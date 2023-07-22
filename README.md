# NextOpenapi

OpenAPI module for NextJS. 
Documenting your API by TypeScript

## Disclaimer
This lib is in the prototype stage.

If you like it, start some issues and I will work on it in my free time.

If you like it and want to contribute, pull requests are always welcome.

## Motivation

```
Next.js enables you to create full-stack Web applications
```

However, in most of my projects, NextJS is only used as a frontend framework, "React with SSR"

One of the issue is the lacks of support for API documentations.

Without proper API documentations, communication between BE developers and FE developers would be harder, leading to the general choice of using another full fetch BE framework.

This library is my take at resolving this issue while taking a look at how TypeScript works.

## Getting started

```
$ npm install https://github.com/levi218/next-openapi.git
```

Currently, the lib only support App Router,
1. Create a new GET API in your project folder to serve the json

```
# app/api/docs/json/route.ts

import { nextOpenapi } from '@next-openapi/next-openapi';
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(await nextOpenapi({ root: 'src/api' }));
}
```

This will generate an OpenAPI JSON at the declared route

2. Use any OpenAPI documentation compatible libs for visualizing.
In the example project, I used `redoc-try-it-out` to visualize the documentation

```
'use client';
import { useEffect } from 'react';
import { RedocTryItOut } from '../../../../../libs/redoc-try-it-out-main/src/module';

export default function ApiDocs() {
  useEffect(() => {
    RedocTryItOut.init(
      '/api/docs/json',
      {
        tryItOutEnabled: true,
        authBtn: {
          posSelector: '#section\\/Authentication > div:first-child',
          text: 'Authorizations config',
        },
      },
      document.getElementById('redoc_container') ?? undefined
    );
  }, []);
  return <div id="redoc_container"></div>;
}
```

3. Wrap your request and response with provided types (more information in the examples folder)
```
export async function POST(
  request: NextTypedRequest<PostDocsRequestParams>
): Promise<
  | NextTypedResponse<PostDocsResponse>
  | NextTypedResponse<unknown, HttpStatusCode.ImATeapot>
> {
  return NextResponse.json({ message: 'OK' });
}
```

## Configuration

The function nextOpenapi(config: Config) accept a config object as first parameter

### Config
| Name        |                      Type                      |                       Description | Is required |
| ----------- | :--------------------------------------------: | --------------------------------: | ----------: |
| root        |                     string                     |                   API root folder |        true |
| title       |                     string                     |       OpenAPI documentation title |
| description |                     string                     | OpenAPI documentation description |
| version     |                     string                     |                       API version |
| tagGroups   |              TagGroupDefinition[]              |                                $1 |
| security    | Record<string, OpenAPIV3.SecuritySchemeObject> |                                $1 |
| servers     |               ServerDefinition[]               |                                $1 |

### TagGroupDefinition

| Name  |   Type   |       Description | Is required |
| ----- | :------: | ----------------: | ----------: |
| title |  string  |       Group title |        true |
| tags  | string[] | Tags in the group |        true |



### OpenAPIV3.SecuritySchemeObject
Basically, authentication methods that will be used in your API, and typically can be configured from your documentation UI (eg: Redoc)
You can select none, one or more of the below key:

```
{
  BasicAuth: {
    type: 'http',
    scheme: 'basic',
  },
  BearerAuth: {
    type: 'http',
    scheme: 'bearer',
  },
  ApiKeyAuth: {
    type: 'apiKey',
    in: 'header',
    name: 'X-API-Key',
  },
}
```

### ServerDefinition

| Name        |  Type  |        Description | Is required |
| ----------- | :----: | -----------------: | ----------: |
| url         | string |         Server url |        true |
| description | string | Server description |        true |


## Development

For NextJS App Router
```
yarn nx run app-router:serve
```

For NextJS Page Router
```
yarn nx run app-router:serve
```

## Todo

[ ] Supporting path parameters

[ ] Page router supports

[ ] Code clean up
