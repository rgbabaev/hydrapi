const fs = require('fs');
const path = require('path');
const { ObjectID } = require('mongodb');

const createRoute = require('./route');

const fsAccess = path => new Promise(r => fs.access(path, err => r(!err)));

const MODEL_NAME = 'fileStorage';
const UPLOAD_DIR = path.join(path.dirname(require.main.filename), 'upload');
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
  // entity: {
  //   type: relation
  // },
  originalName: {
    type: 'string',
  },
  // File name template [entry_id]
  // path: {
  //   type: 'string',
  //   required
  // },
  contentType: {
    type: 'string'
  },
  loaded: {
    type: 'boolean',
    defaultValue: false
  },
  size: {
    type: 'number',
    required
  }
};

const route = createRoute({
  modelName: MODEL_NAME,
  schema: SCHEMA,
  handlers: {
    afterGetQuery: async ({ db, req, data = [] }) => {
      if (data.length) {
        data = Promise.all(data.map(async i => {
          const filePath = path.join(UPLOAD_DIR, i._id.toString());
          i.loaded = await fsAccess(filePath);
          if (i.loaded) {
            i.path = filePath;
            i.url = `${FILE_ROUTE}/${i._id.toString()}`;
          }
          return i;
        }));
      }
      return data;
    },
    beforeDeleteQuery: ({ db, req, entityIds }) => {
      // delete files here
      console.log({ db, req, entityIds });
      return entityIds;
    }
  }
});

module.exports = (app, db) => {
  route(app, db);

  app.post(`${FILE_ROUTE}/:fileName`, async (req, res) => {
    const collection = db.collection(MODEL_NAME);
    // TODO: сначала проверим, зареган ли этот файл в коллекции fileStorage
    try {
      const id = new ObjectID(req.params.fileName);
    }
    catch (err) {
      res.status(500).end();
    }

    let data = await collection.findOne({ _id: id }).toArray();
    console.log(data);

    const fullPath = path.join(UPLOAD_DIR, req.params.fileName);
    const file = fs.createWriteStream(fullPath);
    req.pipe(file);
    console.log(`UPLOADED file ${fullPath}`);

    req.on('end', () => {
      res.end();
    });
  });

  app.get(`${FILE_ROUTE}/:fileName`, async (req, res) => {
    const collection = db.collection(MODEL_NAME);
    try {
      const id = new ObjectID(req.params.fileName);
      const filePath = path.join(UPLOAD_DIR, id.toString());
      const file = fs.createReadStream(filePath);

      file.pipe(res);

      file.on('end', () => {
        res.end();
      });
    }
    catch (err) {
      res.status(500).end();
    }
  });
};
