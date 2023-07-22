import { OpenAPIV3 } from 'openapi-types';
import { NextOpenApiConfig } from './types';
export declare function nextOpenapi(config: NextOpenApiConfig): Promise<OpenAPIV3.Document>;
