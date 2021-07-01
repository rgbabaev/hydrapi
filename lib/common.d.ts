import { ObjectID, Db } from 'mongodb';
import { Response } from 'express';
export interface IDBEntry {
    _id: ObjectID;
    [key: string]: any;
}
export interface INewEntry {
    [key: string]: any;
}
export interface IExistEntry {
    id: string;
    [key: string]: any;
}
export declare const prettyIds: <T extends IDBEntry>(arr: T[]) => ({
    id: ObjectID;
} & Omit<T, "_id">)[];
export declare const unPrettyIds: (arr: any[]) => any[];
export declare const isEmpty: (v: any) => boolean;
/**
 * Check for uniqueness of elements in model.
*/
export declare const isUnique: (db: Db, modelName: string, schema: any, items: any[]) => Promise<boolean>;
export declare const handleError: (error: Error, res: Response) => void;
