import { ObjectId, Db } from 'mongodb';
import { Response } from 'express';
import lodashIsEmpty from 'lodash/isEmpty';
import lodashFlatten from 'lodash/flatten';

export interface IDBEntry {
  _id: ObjectId;
  [key: string]: any;
}

export interface INewEntry {
  [key: string]: any;
}

export interface IExistEntry {
  id: string;
  [key: string]: any;
}

export const prettyIds = <T extends IDBEntry>(arr: T[]) => arr.map(
  ({ _id, ...rest }) => ({ id: _id, ...rest })
);

export const unPrettyIds = (arr: any[]) => arr.map(
  ({ id, ...rest }) => ({ _id: new ObjectId(id), ...rest })
);

export const isEmpty: (v: any) => boolean = v => {
  if (v instanceof ObjectId) return false;
  return v instanceof Object
    ? lodashIsEmpty(v)
    : v === undefined || v === null || v === '';
};

/**
 * Check for uniqueness of elements in model.
*/
export const isUnique = async (db: Db, modelName: string, schema: any, items: any[]) => {
  const keys = Object.keys(schema).filter(key => schema[key].unique);

  if (!keys.length)
    return true;
  // throw new Error('Unique checking error. No keys to check.');
  if (!items.length)
    throw new Error('Unique checking error. No elements to check.');

  const query = {
    $or: lodashFlatten(
      items.map(
        item => keys.map(
          key => {
            const part = { [key]: item[key] };
            if (item._id) part._id = { $ne: item._id };
            return part;
          }
        )
      )
    )
  };

  const result = await db.collection(modelName).find(query).toArray();
  return !result.length;
};

export const handleError = (error: Error, res: Response) => {
  if (error.name === 'MongoError') {
    error.message = 'Database error';
    res.status(500);
    console.error(error);
  } else {
    res.status(400);
    // console.warn(error);
  }
  res.send({ error: error.message });
};
