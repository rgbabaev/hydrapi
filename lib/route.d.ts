import { ObjectID, Db } from 'mongodb';
import { Application, Response, Request } from 'express';
import { ISchema } from './typeCheck';
import { IDBEntry, IExistEntry, INewEntry } from './common';
interface IBaseEvtHandlerArgs {
    db: Db;
    req: Request;
    res: Response;
}
export interface IEvtHandlerArgs<T> extends IBaseEvtHandlerArgs {
    items: T[];
}
declare type TEvtHandler<T> = (arg: IEvtHandlerArgs<T>) => Promise<T[]>;
export interface IDeleteEvtHandlerArgs extends IBaseEvtHandlerArgs {
    entityIds: ObjectID[];
}
declare type TDeleteEvtHandler = (arg: IDeleteEvtHandlerArgs) => Promise<ObjectID[]>;
interface IHandlers {
    beforeAddQuery?: TEvtHandler<INewEntry>;
    beforePatchQuery?: TEvtHandler<IExistEntry>;
    beforeDeleteQuery?: TDeleteEvtHandler;
    afterGetQuery?: TEvtHandler<IDBEntry>;
    afterAddQuery?: TEvtHandler<IDBEntry>;
}
export interface IRouteArgs {
    modelName: string;
    schema: ISchema;
    handlers: IHandlers;
}
declare const _default: ({ modelName, schema, handlers: { beforeAddQuery, beforePatchQuery, beforeDeleteQuery, afterGetQuery, afterAddQuery } }: IRouteArgs) => (app: Application, db: Db) => void;
export default _default;
