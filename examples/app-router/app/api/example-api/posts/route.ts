import {
  HttpStatusCode,
  NextTypedRequest,
  NextTypedResponse,
} from '@next-openapi/next-openapi';
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
  data: object;
}

export type ActualType = {
  a: string;
  b: string;
  c?: number;
};

export type CustomRequest = NextTypedRequest<GetDocsRequestParams>;

export type X = CustomRequest;

export interface PostDocsRequestParams {
  searchParams: string;
}

export interface PostDocsRequestBody {
  searchParams: string;
}

export interface PostDocsResponse {
  message: string;
  data: object;
}

/**
 * Represents a book.
 * @constructor
 * @param {string} title - The title of the book.
 * @param {string} author - The author of the book.
 */
export async function GET(
  request: X
): Promise<NextTypedResponse<GetDocsResponse>> {
  return NextResponse.json({ message: 'OK' });
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
