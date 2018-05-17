const ObjectID = require('mongodb').ObjectID;
const _ = require('lodash');

const { isUnique, validateInputItems, prettyIds, unPrettyIds } = require('./common');
const { fillProductProps } = require('./productProperties');

const MODEL_NAME = 'products';
const SCHEMA = {
  _id: {
    type: ObjectID
  },
  active: {
    type: 'boolean',
    default: true
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
      return true;
    } // without spaces
  },
  description: {
    type: 'string',
    default: ''
  },
  price: {
    type: 'number',
    required: true
  },
  /*
  properties: {
    type: 'array',
    shape: {
      id: 'ObjectID',
      value: 'string'
    }
  }
  */
};
const UNIQUE_KEYS = ['name', 'code'];

exports.route = (app, db) => {
  const collection = db.collection(MODEL_NAME);

  app.get(`/${MODEL_NAME}`, async (req, res) => {
    try {
      await collection.find({}).toArray().then(async data => {
        data = await fillProductProps({ db, products: data });
        res.send({ data: { [MODEL_NAME]: prettyIds(data) } });
      });
    }
    catch (err) {
      res.send({ error: err.toString() });
      console.error(err);
    }
  });

  app.post(`/${MODEL_NAME}`, async (req, res) => {
    try {
      let products = _.get(req, `body.${MODEL_NAME}`, undefined);

      if (!(products instanceof Array) || products.length === 0)
        throw new Error('Invalid request: products must be an array of products.');

      products = validateInputItems(SCHEMA, products);

      if (!await isUnique(db, MODEL_NAME, UNIQUE_KEYS, products))
        throw new Error('Elements not unique');

      await collection.insertMany(products)
        .then(r => res.send({ data: { products: prettyIds(r.ops) } }))
    }
    catch (err) {
      res.send({ error: err.toString() });
      console.error(err);
    }
  });

  app.patch(`/${MODEL_NAME}`, async (req, res) => {
    try {
      let products = _.get(req, `body.${MODEL_NAME}`, undefined);

      if (!(products instanceof Array) || products.length === 0)
        throw new Error('Invalid request: products must be an array of products.');

      const validatedProducts = validateInputItems(SCHEMA, unPrettyIds(products));
      const result = await Promise.all(
        validatedProducts.map(
          async ({ _id, active, name, code, description, price }) => {
            console.log('DB updateOne start', _id);
            const r = await collection.updateOne(
              { _id },
              { $set: { active, name, code, description, price } }
            );
            console.warn(`DB updateOne`, _id, r);
            if (_.get(r, 'modifiedCount') !== 1)
              throw new Error('Update operation error');
            return { _id };
          }
        )
      );

      collection.find({ $or: result }).toArray().then(data => {
        res.send({ data: { products: prettyIds(data) } });
      });
    }
    catch (error) {
      res.send({ error: error.toString() });
      console.error(error);
    }
  });

  app.delete(`/${MODEL_NAME}`, async (req, res) => {
    try {
      let productIds = _.get(req, `body.${MODEL_NAME}`, undefined);

      if (!(productIds instanceof Array) || productIds.length === 0)
        throw new Error('Invalid request: products must be an array of product IDs.');

      productIDs = productIds.map(id => ({ '_id': new ObjectID(id) }));

      await collection.deleteMany({ $or: productIDs })
        .then(data => {
          res.send({
            deletedCount: data.deletedCount,
            data
          });
        })
    }
    catch (error) {
      res.send({ error: error.toString() });
      console.error(error);
    }
  });
};
