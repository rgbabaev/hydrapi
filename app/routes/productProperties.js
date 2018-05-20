const ObjectID = require('mongodb').ObjectID;
const _ = require('lodash');

const commonRoute = require('./commonRoute');

const MODEL_NAME = 'productProperties';
const SCHEMA = {
  _id: {
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
  valueType: {
    type: ['string', 'object'],
    defaultValue: 'string',
    validation: value => {
      console.log('custom validation valueType', value);
      const types = [
        'string',
        'number',
        'enum',
        'enumMulti'
      ];

      if (typeof value !== 'object')
        value = { type: value, values: [] };
      const { type, values } = value;

      if (!types.includes(type))
        throw 'valueType.type not valid';
      if (!(values instanceof Array))
        throw 'valueType.values not valid';

      return value;
    }
  },
  unit: {
    type: 'string',
    default: ''
  },
};

exports.fillProductProps = async ({ db, products }) => {
  const propsCollection = db.collection(MODEL_NAME);

  let propertiesIds = _.flatten(
    products.map(i => _.get(i, 'properties', []).map(i => i.id))
  );

  if (propertiesIds.length) {
    await propsCollection.find({
      $or: propertiesIds.map(i =>({ _id: i }))
    })
      .toArray()
      .then(propDefs => {
        products = products.map(product => ({
          ...product,
          properties: _.get(product, 'properties', []).map(i => ({
            ..._.find(propDefs, p => p._id.toString() === i.id.toString()),
            ...i
          }))
        }));
      });
  }

  return products;
};

const route = commonRoute({
  modelName: MODEL_NAME,
  schema: SCHEMA
});

exports.route = (app, db) => route(app, db);
