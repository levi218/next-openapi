import { __awaiter } from "tslib";
import { HttpStatusCode } from 'axios';
// import camelcase from 'camelcase';
import { glob } from 'glob';
import ts from 'typescript';
import { getComments, getOriginalTypeFromSymbol, getResponseTypeNodeArray, modelDictToOpenApi, modelNamesToRequestBody, modelNamesToRequestParams, modelNamesToResponseBody, processEnumNode, processObjectType, processUnionTypeNode, unwrapTypeNode, } from './utils';
function analyzeModels(sourceFile, typeChecker, enumDictionary, modelDictionary) {
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
            const typeAlias = statement;
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
function processRoutes(sourceFile, typeChecker, enumDictionary, modelDictionary) {
    const sourceSymbol = typeChecker.getSymbolAtLocation(sourceFile);
    if (sourceSymbol) {
        const exports = typeChecker.getExportsOfModule(sourceSymbol);
        const urlPath = sourceFile.fileName
            .replace(/.*\/api/, '')
            .replace('/route.ts', '');
        const methodDefinitions = {};
        const methodTags = [];
        exports === null || exports === void 0 ? void 0 : exports.forEach((e) => {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s;
            if (!['GET', 'POST', 'PATCH', 'PUT', 'DELETE'].includes((_a = e.getName()) !== null && _a !== void 0 ? _a : ''))
                return;
            const originalFunctionType = getOriginalTypeFromSymbol(typeChecker, e);
            const functionDeclaration = (_c = (_b = originalFunctionType === null || originalFunctionType === void 0 ? void 0 : originalFunctionType.symbol) === null || _b === void 0 ? void 0 : _b.declarations) === null || _c === void 0 ? void 0 : _c[0];
            if (!functionDeclaration)
                return;
            // console.log(
            //   '12312',
            //   e.getName() +
            //     '|' +
            //     originalFunctionType?.symbol?.name +
            //     '|' +
            //     JSON.stringify(e.declarations?.map((e) => e?.kind) ?? null)
            // );
            const jsDoc = getComments(functionDeclaration);
            const methodName = e.getName().toLowerCase();
            const requestTypeNode = (_e = (_d = functionDeclaration.parameters) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.type;
            // TODO: find another way to resolve model that supports type alias
            const requestModelNames = (_g = (_f = unwrapTypeNode(requestTypeNode, {
                firstParamOnly: false,
                originalOnFailure: false,
                wrapperName: 'NextTypedRequest',
            })) === null || _f === void 0 ? void 0 : _f.map((e1) => {
                return e1.getText();
            })) !== null && _g !== void 0 ? _g : (() => {
                var _a, _b;
                // if not possible to resolve syntactically -> resolve by type checker
                if (!requestTypeNode)
                    return undefined;
                const aliased = typeChecker.getTypeAtLocation(requestTypeNode);
                if (((_a = aliased.aliasSymbol) === null || _a === void 0 ? void 0 : _a.name) !== 'NextTypedRequest')
                    return undefined;
                return (_b = aliased.aliasTypeArguments) === null || _b === void 0 ? void 0 : _b.map((e) => e.symbol.name);
            })();
            console.log('requestModel', requestModelNames);
            const responseType = unwrapTypeNode(functionDeclaration.type, {
                originalOnFailure: true,
                wrapperName: 'Promise',
            });
            const responseModels = getResponseTypeNodeArray(responseType)
                .map((e) => unwrapTypeNode(e, {
                firstParamOnly: false,
                wrapperName: 'NextTypedResponse',
            }))
                .filter((e) => !!e)
                .map((e) => {
                var _a, _b, _c, _d, _e, _f, _g;
                const [responseType, responseCode] = e;
                return [
                    responseType.getText(),
                    HttpStatusCode[((_g = (_e = (_d = (_c = (_b = (_a = responseCode === null || responseCode === void 0 ? void 0 : responseCode.getText) === null || _a === void 0 ? void 0 : _a.call(responseCode)) === null || _b === void 0 ? void 0 : _b.split) === null || _c === void 0 ? void 0 : _c.call(_b, '.')) === null || _d === void 0 ? void 0 : _d[1]) !== null && _e !== void 0 ? _e : (_f = responseCode === null || responseCode === void 0 ? void 0 : responseCode.getText) === null || _f === void 0 ? void 0 : _f.call(responseCode)) !== null && _g !== void 0 ? _g : 'Ok')],
                ];
            });
            console.log('responseModels', responseModels);
            const tags = (_m = (_l = (_k = (_j = (_h = jsDoc === null || jsDoc === void 0 ? void 0 : jsDoc.tags) === null || _h === void 0 ? void 0 : _h.find((e) => e.name === 'tags')) === null || _j === void 0 ? void 0 : _j.value) === null || _k === void 0 ? void 0 : _k.split(',')) === null || _l === void 0 ? void 0 : _l.map((e) => e === null || e === void 0 ? void 0 : e.trim())) !== null && _m !== void 0 ? _m : ['Default'];
            const acceptedAuthMethods = (_s = (_r = (_q = (_p = (_o = jsDoc === null || jsDoc === void 0 ? void 0 : jsDoc.tags) === null || _o === void 0 ? void 0 : _o.find((e) => e.name === 'auth')) === null || _p === void 0 ? void 0 : _p.value) === null || _q === void 0 ? void 0 : _q.split(',')) === null || _r === void 0 ? void 0 : _r.map((e) => ({ [e.trim()]: [] }))) !== null && _s !== void 0 ? _s : [];
            // tags?.forEach((e) => apiRouteTags.add(e));
            methodTags.push(...tags);
            methodDefinitions[methodName] = {
                tags: tags,
                summary: urlPath,
                description: jsDoc === null || jsDoc === void 0 ? void 0 : jsDoc.description,
                operationId: urlPath.replace(/\//, '') + '/' + methodName,
                security: acceptedAuthMethods,
                parameters: [
                    ...(requestModelNames
                        ? modelNamesToRequestParams(modelDictionary, requestModelNames.slice(0, 1))
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
                requestBody: Object.assign({}, modelNamesToRequestBody(modelDictionary, requestModelNames === null || requestModelNames === void 0 ? void 0 : requestModelNames[1])),
                responses: Object.assign({}, modelNamesToResponseBody(modelDictionary, responseModels)),
            };
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
function createApiDocs(config, paths, apiRouteTags, convertedModels) {
    var _a, _b, _c, _d, _e;
    return {
        openapi: '3.0.0',
        info: {
            version: (_a = config === null || config === void 0 ? void 0 : config.version) !== null && _a !== void 0 ? _a : '0.0.1',
            title: (_b = config === null || config === void 0 ? void 0 : config.title) !== null && _b !== void 0 ? _b : 'Next OpenAPI',
            description: config === null || config === void 0 ? void 0 : config.description,
        },
        servers: (_c = config === null || config === void 0 ? void 0 : config.servers) !== null && _c !== void 0 ? _c : [
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
            ...((_d = config === null || config === void 0 ? void 0 : config.tagGroups) !== null && _d !== void 0 ? _d : [
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
            securitySchemes: (_e = config === null || config === void 0 ? void 0 : config.security) !== null && _e !== void 0 ? _e : {
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
    };
}
export function nextOpenapi(config) {
    return __awaiter(this, void 0, void 0, function* () {
        const routeFiles = yield glob('**/route.ts', {
            root: 'examples/app-router/app/api/example-api',
        });
        const program = ts.createProgram(routeFiles, {});
        const typeChecker = program.getTypeChecker();
        // Parse the main source file and look for type definitions.
        const paths = {};
        const apiRouteTags = new Set();
        const enumDictionary = {};
        const modelDictionary = {};
        for (const filePath of routeFiles) {
            const sourceFile = program.getSourceFile(filePath);
            analyzeModels(sourceFile, typeChecker, enumDictionary, modelDictionary);
        }
        for (const filePath of routeFiles) {
            const sourceFile = program.getSourceFile(filePath);
            const { urlPath, methodDefinitions, methodTags } = processRoutes(sourceFile, typeChecker, enumDictionary, modelDictionary);
            if (urlPath) {
                paths[urlPath] = methodDefinitions;
                methodTags.forEach((e) => apiRouteTags.add(e));
            }
        }
        const convertedModels = modelDictToOpenApi(modelDictionary);
        return createApiDocs(config, paths, Array.from(apiRouteTags), convertedModels);
    });
}
//# sourceMappingURL=next-openapi.js.map