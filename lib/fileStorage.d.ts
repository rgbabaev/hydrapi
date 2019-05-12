import { Db } from 'mongodb';
import { Application, Request } from 'express';
export declare const route: (app: Application, db: Db) => void;
interface IGetFilesData {
    db: Db;
    entityIds: string[];
    req: Request;
}
export declare const getFilesData: ({ db, entityIds, req }: IGetFilesData) => Promise<any[]>;
export {};
