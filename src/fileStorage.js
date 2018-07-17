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

module.exports = (app, db) => route(app, db);
