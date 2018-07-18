const fs = require('fs');
const path = require('path');

const createRoute = require('./route');

const MODEL_NAME = 'fileStorage';
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
  path: {
    type: 'string',
    required
  },
  contentType: {
    type: 'string'
  },
  loaded: {
    type: 'boolean',
    defaultValue: false
  }
};

const route = createRoute({
  modelName: MODEL_NAME,
  schema: SCHEMA
});

module.exports = (app, db) => {
  route(app, db);

  app.post(`/${MODEL_NAME}/:fileName`, (req, res) => {
    // TODO: сначала проверим, зареган ли этот файл в коллекции fileStorage
    const dirName = path.join(path.dirname(require.main.filename), 'upload');
    const fullPath = path.join(dirName, req.params.fileName);
    const file = fs.createWriteStream(fullPath);
    req.pipe(file);
    console.log(`UPLOADED file ${fullPath}`);

    req.on('end', () => {
      res.end();
    });
  });
};
