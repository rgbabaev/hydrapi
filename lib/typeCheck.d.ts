import { Db } from 'mongodb';
export declare type TFieldType = 'any' | 'string' | 'urlCode' | 'number' | 'boolean' | 'id' | ((value: any) => void);
export interface ISchemaField {
    type: TFieldType;
    defaultValue?: any;
    required?: boolean;
    multiple?: boolean;
    unique?: boolean;
    description?: string;
}
export interface ISchema {
    [fieldName: string]: ISchemaField;
}
declare type TCheckFieldType = (arg: {
    fieldName: string;
    type: TFieldType;
    value: any;
    required?: boolean;
    multiple?: boolean;
}) => Promise<any>;
export declare const checkFieldType: TCheckFieldType;
interface IRelationArgs {
    db: Db;
    collectionName: string;
    checkTargetExists?: boolean;
}
export declare const relation: ({ db, collectionName, checkTargetExists }: IRelationArgs) => (value: any) => Promise<any>;
declare type TValueObject = {
    [key: string]: any;
};
declare type TShape = (model: ISchema) => (valueObject: TValueObject) => Promise<TValueObject>;
export declare const shape: TShape;
export declare const any: <T>(value: T) => T;
export declare const string: <T>(value: T) => T;
export declare const urlCode: <T>(value: T) => T;
export declare const number: <T>(value: T) => T;
export declare const boolean: <T>(value: T) => T;
export declare const id: <T>(value: T) => T;
export {};
