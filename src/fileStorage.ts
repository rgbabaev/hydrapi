import fs from 'fs';
import path from 'path';
import { ObjectId, Db } from 'mongodb';
import _ from 'lodash';
import mime from 'mime-types';
import { Application, Request } from 'express';
import { IDBEntry, INewEntry } from './common';
import createRoute, { IEvtHandlerArgs } from './route';
import { ISchema } from './typeCheck';

const fsAccess = (path: fs.PathLike) => new Promise(r => fs.access(path, err => r(!err)));
const fsClose = (fd: number) => new Promise(r => fs.close(fd, err => r(!err)));
const fsOpen = (path: fs.PathLike, flags: string, mode: string) => new Promise(
  (resolve, reject) => fs.open(
    path,
    flags,
    mode,
    (err, fd) => (err ? reject(err) : resolve(fd))
  )
);
const fsRead = (fd: number, buffer: any, offset: number, length: number, position: number | null) => new Promise(
  (resolve, reject) => fs.read(
    fd,
    buffer,
    offset,
    length,
    position,
    (err, bytesRead) => (err ? reject(err) : resolve(bytesRead))
  )
);
const fsUnlink = (path: fs.PathLike) => new Promise(r => fs.unlink(path, err => r(!err)));

const MODEL_NAME = 'fileStorage';
const UPLOAD_DIR = path.join(path.dirname((require.main && require.main.filename) || ''), 'upload');
const FILE_ROUTE = `/${MODEL_NAME}/file`;

const required = true;
const SCHEMA: ISchema = {
  _id: {
    type: 'id',
  },
  active: {
    type: 'boolean',
    defaultValue: true
  },
  originalName: {
    type: 'string',
  },
  contentType: {
    type: 'string'
  },
  size: {
    type: 'number'
  }
};

interface IAddPathsArg {
  items: IDBEntry[];
  req: Request;
}

const addPaths = ({ items = [], req }: IAddPathsArg) => Promise.all(items.map(async i => {
  // make this part shared
  const filePath = path.join(UPLOAD_DIR, `${i._id.toString()}.${i.extension}`);
  i.loaded = await fsAccess(filePath);
  i.url = `${req.baseUrl}${FILE_ROUTE}/${i._id.toString()}.${i.extension}`;
  return i;
}));

export const route = (app: Application, db: Db) => {
  createRoute({
    modelName: MODEL_NAME,
    schema: SCHEMA,
    handlers: {
      afterGetQuery: addPaths,
      afterAddQuery: addPaths,
      beforeAddQuery: async ({ items }: IEvtHandlerArgs<INewEntry>) => items.map(({
        originalName = '',
        ...rest
      }) => ({
        originalName,
        extension: path.extname(originalName).substr(1),
        ...rest
      })),
      beforeDeleteQuery: async ({ entityIds = [], db, req }) => {
        let items = await db
          .collection(MODEL_NAME)
          .find({ $or: entityIds })
          .toArray();
  
        items = await Promise.all(items.map(async i => {
          const filePath = path.join(UPLOAD_DIR, `${i._id.toString()}.${i.extension}`);
          i.fileUnlinked = await fsUnlink(filePath);
          return i;
        }));
  
        return items.reduce(
          // delete db entry only after succesful file deletion
          // (acc, { _id, fileUnlinked }) => fileUnlinked ? [...acc, { _id }] : acc,
          (acc, { _id, fileUnlinked }) => [...acc, { _id }],
          []
        );
      }
    }
  })(app, db);

  app.post(`${FILE_ROUTE}/:fileName`, async (req, res) => {
    const collection = db.collection(MODEL_NAME);
    try {
      const { fileName } = req.params;
      const id = new ObjectId(fileName.substr(0, 24));
      const filePath = path.join(UPLOAD_DIR, fileName);

      if (await fsAccess(filePath)) {
        res.status(422).end();
        return;
      }

      const data = await collection.findOne({ _id: id });
      if (data === null || `${id.toString()}.${data.extension}` !== fileName) {
        res.status(404).end();
        return;
      }

      const fileStream = fs.createWriteStream(filePath);
      req.pipe(fileStream);
      req.on('end', () => res.status(202).end());
    } catch (err) {
      res.status(500).end();
    }
  });

  app.get(`${FILE_ROUTE}/:fileName`, async (req, res) => {
    try {
      const id = new ObjectId(req.params.fileName.substr(0, 24));
      const fileExtension = path.extname(req.params.fileName);
      const filePath = path.join(UPLOAD_DIR, `${id.toString()}${fileExtension}`);
      const mimeType = mime.lookup(filePath);

      if (mimeType) res.set('Content-Type', mimeType);
      const fileStream = fs.createReadStream(filePath);
      fileStream.on('error', err => res.status(404).end());
      fileStream.pipe(res);

      // Are we need this?
      // fileStream.on('end', () => {
      //   res.end();
      // });
    } catch (err) {
      res.status(404).end();
    }
  });
};

interface IGetFilesData {
  db: Db;
  entityIds: string[];
  req: Request;
}

export const getFilesData = async ({ db, entityIds = [], req }: IGetFilesData) => {
  let items = await db
    .collection(MODEL_NAME)
    .find({
      $or: entityIds.map(i => ({ _id: i }))
    })
    .toArray();
  items = await addPaths({ items, req });
  return items.map(({ _id, ...rest }) => ({ id: _id, ...rest }));
};
