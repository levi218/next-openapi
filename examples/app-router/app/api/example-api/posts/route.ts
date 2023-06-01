import { getGoogleDocsDocument } from '@docs2site/gg-docs-client';
import {
  HttpStatusCode,
  NextTypedRequest,
  NextTypedResponse,
} from '@docs2site/next-openapi';
import { docs_v1 } from '@googleapis/docs';
import { NextResponse } from 'next/server';

export enum EnumStringExample {
  A = 'B',
  B = 'C',
}

export interface GetDocsRequestParams {
  searchParams: string;
}

export interface GetDocsResponse {
  message: string;
  data: docs_v1.Schema$Document;
}

export type ActualType = {
  a: string;
  b: string;
  c?: number;
};

export type CustomRequest = NextTypedRequest<GetDocsRequestParams>;

export type X = CustomRequest;
/**
 * Represents a book.
 * @constructor
 * @param {string} title - The title of the book.
 * @param {string} author - The author of the book.
 */
export async function GET(
  request: X
): Promise<NextTypedResponse<GetDocsResponse>> {
  const { searchParams } = new URL(request.url);
  const documentId = searchParams.get('documentId');
  if (!documentId) return NextResponse.json({ message: 'Missing documentId' });
  const data = await getGoogleDocsDocument(documentId);
  return NextResponse.json({ message: 'OK', data: data });
}

export interface PostDocsRequestParams {
  searchParams: string;
}

export interface PostDocsRequestBody {
  searchParams: string;
}

export interface PostDocsResponse {
  message: string;
  data: docs_v1.Schema$Document;
}

/** This is a description of the foo function. */
export async function POST(
  request: NextTypedRequest<PostDocsRequestParams>
): Promise<
  | NextTypedResponse<GetDocsResponse>
  | NextTypedResponse<unknown, HttpStatusCode.ImATeapot>
> {
  return NextResponse.json({ message: 'OK' });
}

const POST3 = POST;
export const POST2 = POST3;

export function FETCH(
  request: NextTypedRequest<PostDocsRequestParams, PostDocsRequestBody>
): NextTypedResponse<GetDocsResponse> {
  return NextResponse.json({ message: 'OK' });
}

export default POST;
