import {
  HttpStatusCode,
  NextTypedRequest,
  NextTypedResponse,
} from '@next-openapi/next-openapi';
import { NextResponse } from 'next/server';

export enum EnumStringExample {
  /**
   * A - Description of value A
   * czxcczxcz
   * multiline
   * @tag value
   */
  A = 'c',
  B = 'd' /* B - Description of value B */,
  C = 'e', // B - Description of value B
}

/**
 * A - Description of value A
 */
export interface GetDocsRequestParams {
  /**
   * GetDocsRequestParams searchParams
   */
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
/**
 * Represents a book.
 * @param {string} author - The author of the book.
 * @tags tag1, tag2
 * @auth BasicAuth
 */
export async function GET(
  request: CustomRequest
): Promise<NextTypedResponse<GetDocsResponse>> {
  return NextResponse.json({ message: 'OK' });
}

export interface PostDocsRequestParams {
  /**
   * Search parameter description
   * @example lalala
   */
  searchParams: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface IFileUpload {}

export interface PostDocsRequestBody {
  /**
   * Search parameter description
   */
  searchParams: string; // should auto generate based on type
  dateField: Date;

  /**
   * Number field description
   * @min 1
   * @max 100
   */
  numberField: number;
  booleanField: boolean;

  /**
   * @minLength 3
   * @maxLength 20
   */
  stringField: string;

  /**
   * @format password
   */
  stringField2: string;

  nullableNumber?: number;

  // fileUpload: IFileUpload;
  // TODO: implement all 3 cases described here https://swagger.io/docs/specification/describing-request-body/file-upload/

  arrayField: number[];
}

/**
 * Response body description
 */
export interface PostDocsResponse {
  /**
   * Message description
   */
  message: string;
  /**
   * Data description
   */
  data: object;
}

/**
 * This is a description of the foo function.
 * @tags tag1, tag3
 * @auth BearerAuth
 */
export async function POST(
  request: NextTypedRequest<PostDocsRequestParams>
): Promise<
  | NextTypedResponse<PostDocsResponse>
  | NextTypedResponse<unknown, HttpStatusCode.ImATeapot>
> {
  return NextResponse.json({ message: 'OK' });
}
