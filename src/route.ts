import { ObjectId, Db } from 'mongodb';
import { Application, Response, Request } from 'express';
import _ from 'lodash';
import { ISchema } from './typeCheck';
import {
  IDBEntry,
  IExistEntry,
  INewEntry,
  isUnique,
  prettyIds,
  handleError,
  unPrettyIds,
} from './common';
import { validateInputItems } from './lifecycle';

interface IBaseEvtHandlerArgs {
  db: Db;
  req: Request;
  res: Response;
}

export interface IEvtHandlerArgs<T> extends IBaseEvtHandlerArgs {
  items: T[];
}

type TEvtHandler<T> = (arg: IEvtHandlerArgs<T>) => Promise<T[]>;

export interface IDeleteEvtHandlerArgs extends IBaseEvtHandlerArgs {
  // Maybe here must be string[] instead of ObjectId[]
  entityIds: ObjectId[];
}

type TDeleteEvtHandler = (arg: IDeleteEvtHandlerArgs) => Promise<ObjectId[]>

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

export default ({
  modelName,
  schema,
  handlers: {
    beforeAddQuery,
    beforePatchQuery,
    beforeDeleteQuery,
    afterGetQuery,
    afterAddQuery
  } = {}
}: IRouteArgs) => (app: Application, db: Db) => {
  const collection = db.collection(modelName);

  app.get(`/${modelName}`, async (req, res) => {
    try {
      // beforeGetQuery
      let items = await collection.find({}).toArray();
      // afterGetQuery
      items = typeof afterGetQuery === 'function' ?
        await afterGetQuery({
          db,
          items,
          req,
          res
        }) :
        items;
      res.send({ data: { [modelName]: prettyIds(items) } });
    } catch (err) {
      handleError(err, res);
    }
  });

  app.post(`/${modelName}`, async (req, res) => {
    try {
      let items: INewEntry[] = _.get(req, `body.${modelName}`, undefined);

      if (!(items instanceof Array) || items.length === 0)
        throw new Error(`Invalid request: ${modelName} must be an non-empty array.`);

      items = await validateInputItems(schema, items);
      if (!await isUnique(db, modelName, schema, items))
        throw new Error('Elements not unique');

      items = typeof beforeAddQuery === 'function' ?
        await beforeAddQuery({
          db,
          items,
          req,
          res
        }) :
        items;

      items = items.map(item => _.omitBy(item, i => i === undefined));

      await collection.insertMany(items)
        .then(async ({ ops: items }) => { // eslint-disable-line no-shadow
          items = typeof afterAddQuery === 'function' ?
            await afterAddQuery({
              db,
              items,
              req,
              res
            }) :
            items;

          res.send({ data: { [modelName]: prettyIds(items) } });
        });
    } catch (err) {
      handleError(err, res);
    }
  });

  // TODO: answer with some bad items responses
  app.patch(`/${modelName}`, async (req, res) => {
    try {
      let items: IExistEntry[] = _.get(req, `body.${modelName}`, undefined);

      if (!(items instanceof Array) || items.length === 0)
        throw new Error(`Invalid request: ${modelName} must be an non-empty array.`);

      items = await validateInputItems(schema, unPrettyIds(items));
      if (!await isUnique(db, modelName, schema, items))
        throw new Error('Elements not unique');

      items = <IExistEntry[]>items.map(item => _.omitBy(item, i => i === undefined));

      items = typeof beforePatchQuery === 'function' ?
        await beforePatchQuery({
          db,
          items,
          req,
          res
        }) :
        items;

      const result = await Promise.all(
        items.map(
          async ({ _id, ...item }) => {
            const r = await collection.updateOne(
              { _id },
              { $set: item }
            );

            if (_.get(r, 'modifiedCount') !== 1)
              throw new Error(
                `Update operation error. ` +
                `Matched: ${r.matchedCount}, modified: ${r.modifiedCount}.`
              );
            return { _id };
          }
        )
      );

      await collection.find({ $or: result }).toArray().then(data => {
        res.send({ data: { [modelName]: prettyIds(data) } });
      });
    } catch (err) {
      handleError(err, res);
    }
  });

  app.delete(`/${modelName}`, async (req, res) => {
    try {
      let entityIds = _.get(req, `body.${modelName}`, undefined);

      if (!(entityIds instanceof Array) || entityIds.length === 0)
        throw new Error(`Invalid request: ${modelName} must be an array of ${modelName} IDs.`);

      entityIds = entityIds.map(id => ({ _id: new ObjectId(id) }));

      entityIds = typeof beforeDeleteQuery === 'function' ?
        await beforeDeleteQuery({
          db,
          entityIds,
          req,
          res
        }) :
        entityIds;

      if (!entityIds.length) {
        throw new Error('Nothing to delete');
      }

      await collection.deleteMany({ $or: entityIds })
        .then(data => {
          res.send({
            deletedCount: data.deletedCount,
            data
          });
        });
    } catch (err) {
      handleError(err, res);
    }
  });
};
