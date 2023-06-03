import { HttpStatusCode } from 'axios';
// import camelcase from 'camelcase';
import { glob } from 'glob';
import { OpenAPIV3 } from 'openapi-types';
import ts, { FunctionDeclaration, TypeAliasDeclaration } from 'typescript';
import { Enum, Model, NextOpenApiConfig } from './types';
import {
  getComments,
  getOriginalTypeFromSymbol,
  getResponseTypeNodeArray,
  modelDictToOpenApi,
  modelNamesToRequestBody,
  modelNamesToRequestParams,
  modelNamesToResponseBody,
  processEnumNode,
  processObjectType,
  processUnionTypeNode,
  unwrapTypeNode,
} from './utils';

function analyzeModels(
  sourceFile: ts.SourceFile,
  typeChecker: ts.TypeChecker,
  enumDictionary: Record<string, Enum>,
  modelDictionary: Record<string, Model>
) {
  for (const statement of sourceFile.statements) {
    // console.log(statement.kind, statement.getText());
    // console.log(
    //   statement
    //     .getChildren()
    //     .map((e) =>
    //       e.getChildren().length
    //         ? e
    //             .getChildren()
    //             .map((e1) => `${e.kind} ${e1.kind} ${e1.getText()}`)
    //         : `${e.getText()}${e.kind}`
    //     )
    // );
    if (ts.isEnumDeclaration(statement)) {
      const def = processEnumNode(statement);
      enumDictionary[def.name] = def;
    }
    if (ts.isTypeAliasDeclaration(statement)) {
      const typeAlias = statement as TypeAliasDeclaration;

      if (ts.isUnionTypeNode(typeAlias.type)) {
        // treat union type as enum
        const def = processUnionTypeNode(typeAlias);
        enumDictionary[def.name] = def;
      }
      if (ts.isTypeLiteralNode(typeAlias.type)) {
        // treat literal type same as interface
        // TODO: refactor - use same parsing method as below
        const def = processObjectType(typeChecker, typeAlias);
        modelDictionary[def.name] = def;
      }
    }
    if (ts.isInterfaceDeclaration(statement)) {
      const def = processObjectType(typeChecker, statement);
      modelDictionary[def.name] = def;
    }
  }
}

function processRoutes(
  sourceFile: ts.SourceFile,
  typeChecker: ts.TypeChecker,
  enumDictionary: Record<string, Enum>,
  modelDictionary: Record<string, Model>
) {
  const sourceSymbol = typeChecker.getSymbolAtLocation(sourceFile);
  if (sourceSymbol) {
    const exports = typeChecker.getExportsOfModule(sourceSymbol);
    const urlPath = sourceFile.fileName
      .replace(/.*\/api/, '')
      .replace('/route.ts', '');
    const methodDefinitions: Record<string, OpenAPIV3.OperationObject> = {};
    const methodTags: string[] = [];
    exports?.forEach((e) => {
      if (
        !['GET', 'POST', 'PATCH', 'PUT', 'DELETE'].includes(e.getName() ?? '')
      )
        return;
      const originalFunctionType = getOriginalTypeFromSymbol(typeChecker, e);
      const functionDeclaration = originalFunctionType?.symbol
        ?.declarations?.[0] as FunctionDeclaration | undefined;
      if (!functionDeclaration) return;
      // console.log(
      //   '12312',
      //   e.getName() +
      //     '|' +
      //     originalFunctionType?.symbol?.name +
      //     '|' +
      //     JSON.stringify(e.declarations?.map((e) => e?.kind) ?? null)
      // );
      const jsDoc = getComments(functionDeclaration);
      const methodName = e.getName().toLowerCase() as
        | 'get'
        | 'post'
        | 'patch'
        | 'put'
        | 'delete';
      const requestTypeNode = functionDeclaration.parameters?.[0]?.type;

      // TODO: find another way to resolve model that supports type alias
      const requestModelNames =
        (
          unwrapTypeNode(requestTypeNode, {
            firstParamOnly: false,
            originalOnFailure: false,
            wrapperName: 'NextTypedRequest',
          }) as ts.TypeNode[]
        )?.map((e1) => {
          return e1.getText();
        }) ??
        (() => {
          // if not possible to resolve syntactically -> resolve by type checker
          if (!requestTypeNode) return undefined;
          const aliased = typeChecker.getTypeAtLocation(requestTypeNode);
          if (aliased.aliasSymbol?.name !== 'NextTypedRequest')
            return undefined;
          return aliased.aliasTypeArguments?.map((e) => e.symbol.name);
        })();
      console.log('requestModel', requestModelNames);

      const responseType = unwrapTypeNode(functionDeclaration.type, {
        originalOnFailure: true,
        wrapperName: 'Promise',
      });
      const responseModels = getResponseTypeNodeArray(
        responseType as ts.TypeNode
      )
        .map((e) =>
          unwrapTypeNode(e, {
            firstParamOnly: false,
            wrapperName: 'NextTypedResponse',
          })
        )
        .filter((e) => !!e)
        .map((e) => {
          const [responseType, responseCode] = e as [
            ts.TypeNode,
            ts.TypeNode | undefined
          ];
          return [
            responseType.getText(),
            HttpStatusCode[
              (responseCode?.getText?.()?.split?.('.')?.[1] ??
                responseCode?.getText?.() ??
                'Ok') as unknown as number
            ],
          ];
        });
      console.log('responseModels', responseModels);

      const tags = jsDoc?.tags
        ?.find((e) => e.name === 'tags')
        ?.value?.split(',')
        ?.map((e) => e?.trim()) ?? ['Default'];

      const acceptedAuthMethods =
        jsDoc?.tags
          ?.find((e) => e.name === 'auth')
          ?.value?.split(',')
          ?.map((e) => ({ [e.trim()]: [] })) ?? [];
      // tags?.forEach((e) => apiRouteTags.add(e));
      methodTags.push(...tags);
      methodDefinitions[methodName] = {
        tags: tags,
        summary: urlPath,
        description: jsDoc?.description,
        operationId: urlPath.replace(/\//, '') + '/' + methodName,
        security: acceptedAuthMethods,
        parameters: [
          ...(requestModelNames
            ? modelNamesToRequestParams(
                modelDictionary,
                requestModelNames.slice(0, 1)
              )
            : []),
          // TODO: path parameters
          // {
          //   name: 'id',
          //   in: 'path',
          //   description: 'User ID',
          //   required: true,
          //   schema: {
          //     type: 'integer',
          //     format: 'int64',
          //   },
          // },
        ],
        requestBody: {
          ...modelNamesToRequestBody(modelDictionary, requestModelNames?.[1]),
        },
        responses: {
          ...modelNamesToResponseBody(modelDictionary, responseModels),
        },
      } as OpenAPIV3.OperationObject;
    });
    console.log(urlPath, methodDefinitions);
    return {
      urlPath,
      methodTags,
      methodDefinitions,
    };
  }
  return {
    urlPath: undefined,

    methodDefinitions: {},
  };
}

function createApiDocs(
  config: NextOpenApiConfig,
  paths: OpenAPIV3.PathsObject,
  apiRouteTags: string[],
  convertedModels: {
    tags: OpenAPIV3.TagObject[];
    schemas: Record<string, OpenAPIV3.SchemaObject>;
  }
) {
  return {
    openapi: '3.0.0',
    info: {
      version: config?.version ?? '0.0.1',
      title: config?.title ?? 'Next OpenAPI',
      description: config?.description,
    },
    servers: config?.servers ?? [
      {
        url: 'http://localhost:4200',
      },
    ],
    paths,
    tags: [
      ...convertedModels.tags,
      ...Array.from(apiRouteTags).map((e) => ({ name: e, 'x-displayName': e })),
    ],
    'x-tagGroups': [
      ...(config?.tagGroups ?? [
        {
          name: 'API',
          tags: [...apiRouteTags],
        },
      ]),
      {
        name: 'Models',
        tags: [...convertedModels.tags.map((e) => e.name)],
      },
    ],
    components: {
      securitySchemes: config?.security ?? {
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
      },
      schemas: convertedModels.schemas,
    },
  } as OpenAPIV3.Document;
}

export async function nextOpenapi(
  config: NextOpenApiConfig
): Promise<OpenAPIV3.Document> {
  const routeFiles = await glob('**/route.ts', {
    root: 'examples/app-router/app/api/example-api',
  });
  const program = ts.createProgram(routeFiles, {});

  const typeChecker = program.getTypeChecker()!;

  // Parse the main source file and look for type definitions.
  const paths: OpenAPIV3.PathsObject = {};
  const apiRouteTags = new Set<string>();

  const enumDictionary: Record<string, Enum> = {};
  const modelDictionary: Record<string, Model> = {};

  for (const filePath of routeFiles) {
    const sourceFile = program.getSourceFile(filePath)!;
    analyzeModels(sourceFile, typeChecker, enumDictionary, modelDictionary);
  }
  for (const filePath of routeFiles) {
    const sourceFile = program.getSourceFile(filePath)!;
    const { urlPath, methodDefinitions, methodTags } = processRoutes(
      sourceFile,
      typeChecker,
      enumDictionary,
      modelDictionary
    );
    if (urlPath) {
      paths[urlPath] = methodDefinitions;
      methodTags.forEach((e) => apiRouteTags.add(e));
    }
  }
  const convertedModels = modelDictToOpenApi(modelDictionary);
  return createApiDocs(
    config,
    paths,
    Array.from(apiRouteTags),
    convertedModels
  );
}
