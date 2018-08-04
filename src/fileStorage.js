const fs = require('fs');
const path = require('path');
const { ObjectID } = require('mongodb');
const _ = require('lodash');
const getFileType = require('file-type');

const createRoute = require('./route');

const fsAccess = path => new Promise(r => fs.access(path, err => r(!err)));
const fsClose = fd => new Promise(r => fs.close(fd, err => r(!err)));
const fsOpen = (path, flags, mode) => new Promise(
  (resolve, reject) => fs.open(
    path,
    flags,
    mode,
    (err, fd) => err ? reject(err) : resolve(fd)
  )
);
const fsRead = (fd, buffer, offset, length, position) => new Promise(
  (resolve, reject) => fs.read(
    fd,
    buffer,
    offset,
    length,
    position,
    (err, bytesRead) => err ? reject(err) : resolve(bytesRead)
  )
);
const fsUnlink = path => new Promise(r => fs.unlink(path, err => r(!err)));

const MODEL_NAME = 'fileStorage';
const UPLOAD_DIR = path.join(path.dirname(require.main.filename), 'upload');
const TEST_CHUNK_SIZE = 4100;
const FILE_ROUTE = `/${MODEL_NAME}/file`;

const required = true;
const SCHEMA = {
  _id: {
    type: 'id',
  },
  active: {
    type: 'boolean',
    defaultValue: true
  },
  module: {
    type: 'string',
    required
  },
  entity: {
    type: 'id'
  },
  originalName: {
    type: 'string',
  },
  contentType: {
    type: 'string'
  },
};

const addUrls = ({ data = [], req }) => Promise.all(data.map(async i => {
  const filePath = path.join(UPLOAD_DIR, i._id.toString());
  i.loaded = await fsAccess(filePath);
  if (i.loaded) {
    i.url = `${req.baseUrl}${FILE_ROUTE}/${i._id.toString()}`;
  }
  return i;
}));

const route = createRoute({
  modelName: MODEL_NAME,
  schema: SCHEMA,
  handlers: {
    afterGetQuery: addUrls,
    beforeDeleteQuery: ({ entityIds = [] }) => {
      return Promise.all(entityIds.filter(async i => {
        try {
          const filePath = path.join(UPLOAD_DIR, i._id.toString());
          return await fsUnlink(filePath);
        }
        catch (err) {
          return false;
        }
      }));
    }
  }
});

exports.route = (app, db) => {
  route(app, db);

  app.post(`${FILE_ROUTE}/:fileName`, async (req, res) => {
    const collection = db.collection(MODEL_NAME);
    // TODO: проверим, зареган ли этот файл в коллекции fileStorage, есть ли файл с таким именем
    try {
      const id = new ObjectID(req.params.fileName);
      const filePath = path.join(UPLOAD_DIR, req.params.fileName);

      if (await fsAccess(filePath)) {
        res.status(422).end();
        return;
      }

      let data = await collection.findOne({ _id: id });
      if (data === null) {
        res.status(404).end();
        return;
      }

      console.log(data);
      const fileStream = fs.createWriteStream(filePath);
      req.pipe(fileStream);

      req.on('end', () => {
        res.end();
      });
    }
    catch (err) {
      res.status(500).end();
    }
  });

  app.get(`${FILE_ROUTE}/:fileName`, async (req, res) => {
    const collection = db.collection(MODEL_NAME);
    try {
      const id = new ObjectID(req.params.fileName);
      const filePath = path.join(UPLOAD_DIR, id.toString());

      const buffer = Buffer.alloc(TEST_CHUNK_SIZE);
      const fd = await fsOpen(filePath, 'r');
      await fsRead(fd, buffer, 0, TEST_CHUNK_SIZE, null);
      const fileType = getFileType(buffer);
      if (fileType)
        res.set('Content-Type', fileType.mime);
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
      await fsClose(fd);

      console.log('getFileType', fileType);

      // Are we need this?
      // fileStream.on('end', () => {
      //   res.end();
      // });
    }
    catch (err) {
      console.error(err);
      res.status(404).end();
    }
  });
};

exports.getFilesData = async ({ db, entityIds = [], req }) => {
  let data = await db
    .collection(MODEL_NAME)
    .find({
      $or: entityIds.map(i =>({ _id: i }))
    })
    .toArray();
  data = await addUrls({ data, req });
  return data.map(({ _id, ...rest }) => ({ id: _id, ...rest }));
};
