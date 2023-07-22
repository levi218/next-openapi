import { OpenAPIV3 } from 'openapi-types';
import ts, { EnumDeclaration, InterfaceDeclaration, TypeAliasDeclaration, TypeChecker } from 'typescript';
import { Enum, Model } from './types';
export declare function getComments(node: ts.Node): {
    description: string;
    tags: {
        name: string;
        value: string;
    }[] | undefined;
};
export declare function processEnumNode(enumDeclaration: EnumDeclaration): Enum;
export declare function processUnionTypeNode(typeAlias: TypeAliasDeclaration): Enum;
export declare function processObjectType(typeChecker: TypeChecker, typeAliasDeclaration: TypeAliasDeclaration | InterfaceDeclaration): Model;
export declare const modelDictToOpenApi: (modelDict: Record<string, Model>) => {
    tags: OpenAPIV3.TagObject[];
    schemas: Record<string, OpenAPIV3.SchemaObject>;
};
export declare const getOriginalTypeFromSymbol: (typeChecker: TypeChecker, symbol?: ts.Symbol) => ts.Type | undefined;
export declare function unwrapTypeNode(typeNode?: ts.TypeNode, options?: {
    wrapperName?: string;
    firstParamOnly?: boolean;
    originalOnFailure?: boolean;
}): ts.TypeNode | ts.TypeNode[] | undefined;
export declare function getResponseTypeNodeArray(typeNode?: ts.TypeNode): (ts.TypeNode | undefined)[];
export declare const modelNamesToRequestParams: (modelDict: Record<string, Model>, modelNames: string[]) => {
    in: string;
    name: string;
    schema: OpenAPIV3.SchemaObject;
    example: import("type-fest").JsonValue;
    description: string | undefined;
    required: boolean;
}[];
export declare const modelNamesToRequestBody: (modelDict: Record<string, Model>, modelName: string) => {
    content?: {
        'application/json': {
            schema: {
                $ref: string;
            };
        };
    } | undefined;
    description: string | undefined;
};
export declare const modelNamesToResponseBody: (modelDict: Record<string, Model>, modelNames: string[][]) => {
    [k: string]: {
        description: string;
        content?: {
            'application/json': {
                schema: {
                    $ref: string;
                };
            };
        } | undefined;
    };
};
