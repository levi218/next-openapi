import { NextRequest, NextResponse } from 'next/server';
import { OpenAPIV3 } from 'openapi-types';

interface TagGroupDefinition {
  title: string;
  tags: string[];
}
interface ServerDefinition {
  url: string;
  description: string;
}
export type NextOpenApiConfig = {
  title?: string;
  root: string;
  description?: string;
  version?: string;
  source?: string;
  tagGroups?: TagGroupDefinition[];
  security?: Record<string, OpenAPIV3.SecuritySchemeObject>;
  servers?: ServerDefinition[];
};

export type ModelField = {
  name: string;
  optional: boolean;
  type: string;
  isInternal: boolean;
  modifiers: string[];
} & JSDoc;
export type Model = {
  name: string;
  fields: ModelField[];
} & JSDoc;

type JSDocTag = {
  name: string;
  value: string;
};

type JSDoc = {
  description?: string;
  tags?: JSDocTag[];
};
export type EnumValue = {
  key: string;
  name?: string;
} & JSDoc;

export type Enum = {
  name: string;
  values: EnumValue[];
} & JSDoc;

export enum HttpStatusCode {
  Continue = 100,
  SwitchingProtocols = 101,
  Processing = 102,
  EarlyHints = 103,
  Ok = 200,
  Created = 201,
  Accepted = 202,
  NonAuthoritativeInformation = 203,
  NoContent = 204,
  ResetContent = 205,
  PartialContent = 206,
  MultiStatus = 207,
  AlreadyReported = 208,
  ImUsed = 226,
  MultipleChoices = 300,
  MovedPermanently = 301,
  Found = 302,
  SeeOther = 303,
  NotModified = 304,
  UseProxy = 305,
  Unused = 306,
  TemporaryRedirect = 307,
  PermanentRedirect = 308,
  BadRequest = 400,
  Unauthorized = 401,
  PaymentRequired = 402,
  Forbidden = 403,
  NotFound = 404,
  MethodNotAllowed = 405,
  NotAcceptable = 406,
  ProxyAuthenticationRequired = 407,
  RequestTimeout = 408,
  Conflict = 409,
  Gone = 410,
  LengthRequired = 411,
  PreconditionFailed = 412,
  PayloadTooLarge = 413,
  UriTooLong = 414,
  UnsupportedMediaType = 415,
  RangeNotSatisfiable = 416,
  ExpectationFailed = 417,
  ImATeapot = 418,
  MisdirectedRequest = 421,
  UnprocessableEntity = 422,
  Locked = 423,
  FailedDependency = 424,
  TooEarly = 425,
  UpgradeRequired = 426,
  PreconditionRequired = 428,
  TooManyRequests = 429,
  RequestHeaderFieldsTooLarge = 431,
  UnavailableForLegalReasons = 451,
  InternalServerError = 500,
  NotImplemented = 501,
  BadGateway = 502,
  ServiceUnavailable = 503,
  GatewayTimeout = 504,
  HttpVersionNotSupported = 505,
  VariantAlsoNegotiates = 506,
  InsufficientStorage = 507,
  LoopDetected = 508,
  NotExtended = 510,
  NetworkAuthenticationRequired = 511,
}

export type Method = 'GET' | 'DELETE' | 'POST' | 'PUT' | 'PATCH';

export type NextTypedRequest<Params = never, Body = never> = NextRequest;
export type NextTypedResponse<
  Body = never,
  StatusCode extends HttpStatusCode = HttpStatusCode.Ok
> = NextResponse;
