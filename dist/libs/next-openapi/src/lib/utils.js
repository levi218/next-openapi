import faker from '@faker-js/faker';
import { JSONSchemaFaker } from 'json-schema-faker';
import ts from 'typescript';
import { HttpStatusCode } from './types';
JSONSchemaFaker.extend('faker', () => faker);
JSONSchemaFaker.option({ alwaysFakeOptionals: true });
function commentToString(comment) {
    var _a;
    return Array.isArray(comment)
        ? comment === null || comment === void 0 ? void 0 : comment.map((e) => { var _a, _b; return (_b = (_a = e === null || e === void 0 ? void 0 : e.getText) === null || _a === void 0 ? void 0 : _a.call(e)) !== null && _b !== void 0 ? _b : ''; }).join('\n')
        : (_a = comment === null || comment === void 0 ? void 0 : comment.toString()) !== null && _a !== void 0 ? _a : '';
}
export function getComments(node) {
    var _a;
    const jsDocs = node.getChildren().find((e) => ts.isJSDoc(e));
    const joinedString = commentToString(jsDocs === null || jsDocs === void 0 ? void 0 : jsDocs.comment);
    const tags = (_a = jsDocs === null || jsDocs === void 0 ? void 0 : jsDocs.tags) === null || _a === void 0 ? void 0 : _a.map((e) => {
        var _a, _b;
        return {
            name: (_b = (_a = e.tagName) === null || _a === void 0 ? void 0 : _a.getText()) !== null && _b !== void 0 ? _b : '',
            value: commentToString(e.comment),
        };
    });
    return {
        description: joinedString,
        tags,
    };
}
export function processEnumNode(enumDeclaration) {
    const enumName = enumDeclaration.name.getText();
    const enumValues = enumDeclaration.members.map((e) => {
        var _a, _b;
        return Object.assign({ key: (_b = (_a = e === null || e === void 0 ? void 0 : e.initializer) === null || _a === void 0 ? void 0 : _a.getText()) !== null && _b !== void 0 ? _b : '', name: e.name.getText() }, getComments(e));
    });
    console.log(enumDeclaration.members.map((e) => getComments(e)));
    return Object.assign({ name: enumName, values: enumValues }, getComments(enumDeclaration));
    // [
    //   enumName,
    //   {
    //     values: Object.keys(enumDefinition),
    //     description: enumDefinition,
    //   },
    // ];
}
export function processUnionTypeNode(typeAlias) {
    const typeAliasDefinition = typeAlias.type;
    return {
        name: typeAlias.name.getText(),
        values: typeAliasDefinition.types.map((e) => ({ key: e.getText() })),
    };
}
export function processObjectType(typeChecker, typeAliasDeclaration) {
    const type = typeChecker.getTypeAtLocation(typeAliasDeclaration);
    return {
        name: typeAliasDeclaration.name.getText(),
        fields: type.getProperties().map((e) => {
            var _a, _b, _c, _d, _e, _f;
            const { questionToken, name, type, modifiers } = e.valueDeclaration;
            console.log('---', e.getDocumentationComment(typeChecker));
            return {
                name: e.getName(),
                optional: !!questionToken,
                type: (_b = (_a = type === null || type === void 0 ? void 0 : type.getText) === null || _a === void 0 ? void 0 : _a.call(type)) !== null && _b !== void 0 ? _b : 'unknown',
                isInternal: !!name.getText().startsWith('_'),
                modifiers: (_d = (_c = modifiers === null || modifiers === void 0 ? void 0 : modifiers.map) === null || _c === void 0 ? void 0 : _c.call(modifiers, (e) => e.getText())) !== null && _d !== void 0 ? _d : [],
                description: (_f = (_e = e
                    .getDocumentationComment(typeChecker)) === null || _e === void 0 ? void 0 : _e.map((e) => e.text)) === null || _f === void 0 ? void 0 : _f.join(''),
                tags: e.getJsDocTags(typeChecker).map((e) => {
                    var _a, _b, _c, _d;
                    return ({
                        name: e.name,
                        value: (_d = (_c = (_b = (_a = e.text) === null || _a === void 0 ? void 0 : _a.map((e) => e.text)) === null || _b === void 0 ? void 0 : _b.join) === null || _c === void 0 ? void 0 : _c.call(_b, '\n')) !== null && _d !== void 0 ? _d : '-',
                    });
                }),
            };
        }),
    };
}
export const modelDictToOpenApi = (modelDict) => {
    const tags = [];
    const schemas = [];
    Object.values(modelDict).forEach((model) => {
        const schema = {
            name: model.name,
            title: model.name,
            description: model.description,
            type: 'object',
            additionalProperties: false,
            properties: Object.fromEntries(model.fields.map((fieldDef) => {
                var _a;
                return [
                    fieldDef.name,
                    Object.assign(Object.assign({ type: fieldDef.type }, (fieldDef.type === 'object'
                        ? {
                            additionalProperties: false,
                        }
                        : {})), { description: (_a = fieldDef.description) !== null && _a !== void 0 ? _a : fieldDef.name }),
                ];
            })),
            required: model.fields
                .filter((fieldDef) => {
                return !fieldDef.optional;
            })
                .map((e) => e.name),
        };
        console.log(JSON.stringify(JSONSchemaFaker.generate(schema)));
        schema.example = JSON.parse(JSON.stringify(JSONSchemaFaker.generate(schema)));
        schemas.push([model.name, schema]);
        tags.push({
            name: model.name,
            'x-displayName': model.name,
            description: `<SchemaDefinition schemaRef="#/components/schemas/${model.name}" showReadOnly={true} showWriteOnly={true} />`,
        });
    });
    return { tags, schemas: Object.fromEntries(schemas) };
};
export const getOriginalTypeFromSymbol = (typeChecker, symbol) => {
    if (!symbol)
        return undefined;
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
export function unwrapTypeNode(typeNode, options) {
    var _a, _b, _c, _d, _e;
    const wrapperName = options === null || options === void 0 ? void 0 : options.wrapperName;
    const firstParamOnly = (_a = options === null || options === void 0 ? void 0 : options.firstParamOnly) !== null && _a !== void 0 ? _a : true;
    const originalOnFailure = (_b = options === null || options === void 0 ? void 0 : options.originalOnFailure) !== null && _b !== void 0 ? _b : false;
    if (typeNode && ts.isTypeReferenceNode(typeNode)) {
        const typeRefNode = typeNode;
        if (wrapperName && ((_c = typeRefNode.typeName) === null || _c === void 0 ? void 0 : _c.getText()) !== wrapperName) {
            return originalOnFailure
                ? firstParamOnly
                    ? typeRefNode
                    : [typeRefNode]
                : undefined;
        }
        return firstParamOnly
            ? (_d = typeRefNode.typeArguments) === null || _d === void 0 ? void 0 : _d[0]
            : (_e = typeRefNode.typeArguments) === null || _e === void 0 ? void 0 : _e.map((e) => e);
    }
    return undefined;
}
export function getResponseTypeNodeArray(typeNode) {
    if (typeNode && ts.isUnionTypeNode(typeNode)) {
        const typeRefNode = typeNode;
        return typeRefNode.types.map((e) => e);
    }
    return [typeNode];
}
export const modelNamesToRequestParams = (modelDict, modelNames) => {
    return modelNames
        .map((e) => modelDict[e])
        .flatMap((model) => model.fields.map((field) => {
        var _a, _b;
        const defaultValue = (_b = (_a = field.tags) === null || _a === void 0 ? void 0 : _a.find((e) => (e === null || e === void 0 ? void 0 : e.name) === 'default')) === null || _b === void 0 ? void 0 : _b.value;
        console.log('defaultValue', defaultValue);
        const schema = Object.assign({ type: field.type }, (defaultValue ? { default: defaultValue } : {}));
        const example = JSONSchemaFaker.generate(schema);
        return {
            in: 'query',
            name: field.name,
            schema,
            example,
            description: field.description,
            required: !field.optional,
        };
    }));
};
export const modelNamesToRequestBody = (modelDict, modelName) => {
    const model = modelDict[modelName];
    return Object.assign({ description: model === null || model === void 0 ? void 0 : model.description }, (model
        ? {
            content: {
                'application/json': {
                    schema: {
                        $ref: `#/components/schemas/${modelName}`,
                    },
                },
            },
        }
        : {}));
};
export const modelNamesToResponseBody = (modelDict, modelNames) => {
    return Object.fromEntries(modelNames.map(([modelName, statusCode]) => {
        const model = modelDict[modelName];
        return [
            `${statusCode}`,
            Object.assign({ description: HttpStatusCode[`${statusCode}`] }, (model
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
                : {})),
        ];
    }));
};
//# sourceMappingURL=utils.js.map