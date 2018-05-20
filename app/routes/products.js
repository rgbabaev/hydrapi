const { ObjectID } = require('mongodb');

const createRoute = require('./commonRoute');
const { fillProductProps } = require('./productProperties');

const MODEL_NAME = 'products';
const SCHEMA = {
  _id: { // disable unique key
    type: ObjectID
  },
  active: {
    type: 'boolean',
    defaultValue: true
  },
  name: {
    type: 'string',
    required: true,
    unique: true
  },
  code: {
    type: 'string',
    required: true,
    unique: true,
    validation: val => {
      if (!/^[a-z0-9][a-z0-9-]+[a-z0-9]$/.test(val))
        throw 'Invalid code';
      return val;
    }
  },
  description: {
    type: 'string',
    defaultValue: ''
  },
  similarProducts: {
    type: 'string', // it's a problem
    multiple: true,
    validation: val => val.map(v => new ObjectID(v))
  },
  price: {
    type: 'number',
    required: true
  },
  properties: {
    type: 'array',
    shape: {
      id: 'ObjectID',
      value: 'string'
    }
  }
};

const route = createRoute({
  modelName: MODEL_NAME,
  schema: SCHEMA,
  handlers: {
    beforeGetResponseSend: fillProductProps
  }
});

exports.route = (app, db) => route(app, db);
