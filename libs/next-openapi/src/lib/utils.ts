import faker from '@faker-js/faker';
import { JSONSchemaFaker } from 'json-schema-faker';
import { OpenAPIV3 } from 'openapi-types';
import ts, {
  EnumDeclaration,
  InterfaceDeclaration,
  JSDoc,
  JSDocComment,
  JSDocTag,
  NodeArray,
  PropertySignature,
  TypeAliasDeclaration,
  TypeChecker,
  TypeReferenceNode,
  UnionTypeNode,
} from 'typescript';
import { Enum, EnumValue, HttpStatusCode, Model, ModelField } from './types';
JSONSchemaFaker.extend('faker', () => faker);
JSONSchemaFaker.option({ alwaysFakeOptionals: true });

function commentToString(
  comment: string | NodeArray<JSDocComment> | undefined
) {
  return Array.isArray(comment)
    ? (comment as JSDocComment[])?.map((e) => e?.getText?.() ?? '').join('\n')
    : comment?.toString() ?? '';
}
export function getComments(node: ts.Node) {
  const jsDocs = node.getChildren().find((e) => ts.isJSDoc(e)) as
    | JSDoc
    | undefined;
  const joinedString = commentToString(jsDocs?.comment);
  const tags = jsDocs?.tags?.map((e: JSDocTag) => {
    return {
      name: e.tagName?.getText() ?? '',
      value: commentToString(e.comment),
    };
  });
  return {
    description: joinedString,
    tags,
  };
}
export function processEnumNode(enumDeclaration: EnumDeclaration): Enum {
  const enumName = enumDeclaration.name.getText();
  const enumValues: EnumValue[] = enumDeclaration.members.map((e) => {
    return {
      key: e?.initializer?.getText() ?? '',
      name: e.name.getText(),
      ...getComments(e),
    };
  });

  console.log(enumDeclaration.members.map((e) => getComments(e)));
  return {
    name: enumName,
    values: enumValues,
    ...getComments(enumDeclaration),
  };
  // [
  //   enumName,
  //   {
  //     values: Object.keys(enumDefinition),
  //     description: enumDefinition,
  //   },
  // ];
}

export function processUnionTypeNode(typeAlias: TypeAliasDeclaration): Enum {
  const typeAliasDefinition = typeAlias.type as UnionTypeNode;
  return {
    name: typeAlias.name.getText(),
    values: typeAliasDefinition.types.map((e) => ({ key: e.getText() })),
  };
}

export function processObjectType(
  typeChecker: TypeChecker,
  typeAliasDeclaration: TypeAliasDeclaration | InterfaceDeclaration
): Model {
  const type = typeChecker.getTypeAtLocation(typeAliasDeclaration);
  return {
    name: typeAliasDeclaration.name.getText(),
    fields: type.getProperties().map((e): ModelField => {
      const { questionToken, name, type, modifiers } =
        e.valueDeclaration as PropertySignature;
      console.log('---', e.getDocumentationComment(typeChecker));
      return {
        name: e.getName(),
        optional: !!questionToken,
        type: type?.getText?.() ?? 'unknown',
        isInternal: !!name.getText().startsWith('_'),
        modifiers: modifiers?.map?.((e) => e.getText()) ?? [],
        description: e
          .getDocumentationComment(typeChecker)
          ?.map((e) => e.text)
          ?.join(''),
        tags: e.getJsDocTags(typeChecker).map((e) => ({
          name: e.name,
          value: e.text?.map((e) => e.text)?.join?.('\n') ?? '-',
        })),
      };
    }),
  };
}

export const modelDictToOpenApi = (
  modelDict: Record<string, Model>
): {
  tags: OpenAPIV3.TagObject[];
  schemas: Record<string, OpenAPIV3.SchemaObject>;
} => {
  const tags: OpenAPIV3.TagObject[] = [];
  const schemas: [string, OpenAPIV3.SchemaObject][] = [];
  Object.values(modelDict).forEach((model) => {
    const schema = {
      name: model.name,
      title: model.name,
      description: model.description,
      type: 'object',
      additionalProperties: false,
      properties: Object.fromEntries(
        model.fields.map((fieldDef) => {
          return [
            fieldDef.name,
            {
              type: fieldDef.type,
              ...(fieldDef.type === 'object'
                ? {
                    additionalProperties: false,
                  }
                : {}),
              description: fieldDef.description ?? fieldDef.name,
            },
          ];
        })
      ),
      required: model.fields
        .filter((fieldDef) => {
          return !fieldDef.optional;
        })
        .map((e) => e.name),
    } as OpenAPIV3.SchemaObject;
    console.log(JSON.stringify(JSONSchemaFaker.generate(schema)));
    schema.example = JSON.parse(
      JSON.stringify(JSONSchemaFaker.generate(schema))
    );

    schemas.push([model.name, schema]);
    tags.push({
      name: model.name,
      'x-displayName': model.name,
      description: `<SchemaDefinition schemaRef="#/components/schemas/${model.name}" showReadOnly={true} showWriteOnly={true} />`,
    } as OpenAPIV3.TagObject);
  });
  return { tags, schemas: Object.fromEntries(schemas) };
};

export const getOriginalTypeFromSymbol = (
  typeChecker: TypeChecker,
  symbol?: ts.Symbol
) => {
  if (!symbol) return undefined;
  if (!(symbol.flags & ts.SymbolFlags.Alias))
    return typeChecker.getTypeOfSymbol(symbol);
  const aliased = typeChecker.getAliasedSymbol(symbol);
  return typeChecker.getTypeOfSymbol(aliased);
};

// export const getOriginalTypeFromTypeNode = (
//   typeChecker: TypeChecker,
//   node?: ts.TypeNode
// ) => {
//   if (!node) return undefined;
//   const symbol = typeChecker.getSymbolAtLocation(node);
//   console.log('symbol', symbol);
//   if (!symbol || !(symbol.flags & ts.SymbolFlags.Alias))
//     return typeChecker.getTypeAtLocation(node);
//   const aliased = typeChecker.getAliasedSymbol(symbol);
//   console.log('aliased', aliased.valueDeclaration?.kind);
//   return typeChecker.getTypeOfSymbol(aliased);
// };

export function unwrapTypeNode(
  typeNode?: ts.TypeNode,
  options?: {
    wrapperName?: string;
    firstParamOnly?: boolean;
    originalOnFailure?: boolean;
  }
) {
  const wrapperName = options?.wrapperName;
  const firstParamOnly = options?.firstParamOnly ?? true;
  const originalOnFailure = options?.originalOnFailure ?? false;

  if (typeNode && ts.isTypeReferenceNode(typeNode)) {
    const typeRefNode = typeNode as TypeReferenceNode;
    if (wrapperName && typeRefNode.typeName?.getText() !== wrapperName) {
      return originalOnFailure
        ? firstParamOnly
          ? typeRefNode
          : [typeRefNode]
        : undefined;
    }

    return firstParamOnly
      ? typeRefNode.typeArguments?.[0]
      : typeRefNode.typeArguments?.map((e) => e);
  }
  return undefined;
}
export function getResponseTypeNodeArray(typeNode?: ts.TypeNode) {
  if (typeNode && ts.isUnionTypeNode(typeNode)) {
    const typeRefNode = typeNode as UnionTypeNode;
    return typeRefNode.types.map((e) => e);
  }
  return [typeNode];
}

export const modelNamesToRequestParams = (
  modelDict: Record<string, Model>,
  modelNames: string[]
) => {
  return modelNames
    .map((e) => modelDict[e])
    .flatMap((model) =>
      model.fields.map((field) => {
        const defaultValue = field.tags?.find(
          (e) => e?.name === 'default'
        )?.value;
        console.log('defaultValue', defaultValue);
        const schema = {
          type: field.type,
          ...(defaultValue ? { default: defaultValue } : {}),
        } as OpenAPIV3.SchemaObject;
        const example = JSONSchemaFaker.generate(schema);
        return {
          in: 'query',
          name: field.name,
          schema,
          example,
          description: field.description,
          required: !field.optional,
        };
      })
    );
};

export const modelNamesToRequestBody = (
  modelDict: Record<string, Model>,
  modelName: string
) => {
  const model = modelDict[modelName];
  return {
    description: model?.description,
    ...(model
      ? {
          content: {
            'application/json': {
              schema: {
                $ref: `#/components/schemas/${modelName}`,
              },
            },
          },
        }
      : {}),
  };
};

export const modelNamesToResponseBody = (
  modelDict: Record<string, Model>,
  modelNames: string[][]
) => {
  return Object.fromEntries(
    modelNames.map(([modelName, statusCode]) => {
      const model = modelDict[modelName];
      return [
        `${statusCode}`,
        {
          description: HttpStatusCode[`${statusCode}` as unknown as number],
          ...(model
            ? {
                description: model.description,
                content: {
                  'application/json': {
                    schema: {
                      $ref: `#/components/schemas/${modelName}`,
                    },
                  },
                },
              }
            : {}),
        },
      ];
    })
  );
};
