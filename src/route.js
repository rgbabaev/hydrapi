const { ObjectID } = require('mongodb');
const _ = require('lodash');

const {
  isUnique,
  prettyIds,
  handleError,
  unPrettyIds,
} = require('./common');
const { validateInputItems } = require('./lifecycle.js');

module.exports = ({
  modelName,
  schema,
  handlers: {
    beforeGetResponseSend
  } = {}
}) => (app, db) => {
  const collection = db.collection(modelName);

  app.get(`/${modelName}`, async (req, res) => {
    try {
      // beforeDatabaseQuery
      let data = await collection.find({}).toArray();
      // beforeGetResponseSend
      data = typeof beforeGetResponseSend === 'function' ?
        await beforeGetResponseSend({
          db,
          [modelName]: data,
          req
        }) :
        data;
      res.send({ data: { [modelName]: prettyIds(data) } });
    }
    catch (err) {
      handleError(err, res);
    }
  });

  app.post(`/${modelName}`, async (req, res) => {
    try {
      let items = _.get(req, `body.${modelName}`, undefined);

      if (!(items instanceof Array) || items.length === 0)
        throw new Error(`Invalid request: ${modelName} must be an non-empty array.`);

      items = await validateInputItems(schema, items);
      if (!await isUnique(db, modelName, schema, items))
        throw new Error('Elements not unique');

      items = items.map(item => _.omitBy(item, i => i === undefined));

      await collection.insertMany(items)
        .then(r => res.send({ data: { [modelName]: prettyIds(r.ops) } }))
    }
    catch (err) {
      handleError(err, res);
    }
  });

  // TODO: answer with some bad items responses
  app.patch(`/${modelName}`, async (req, res) => {
    try {
      let items = _.get(req, `body.${modelName}`, undefined);

      if (!(items instanceof Array) || items.length === 0)
        throw new Error(`Invalid request: ${modelName} must be an non-empty array.`);

      items = await validateInputItems(schema, unPrettyIds(items));
      if (!await isUnique(db, modelName, schema, items))
        throw new Error('Elements not unique');

      items = items.map(item => _.omitBy(item, i => i === undefined));

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

      collection.find({ $or: result }).toArray().then(data => {
        res.send({ data: { [modelName]: prettyIds(data) } });
      });
    }
    catch (err) {
      handleError(err, res);
    }
  });

  app.delete(`/${modelName}`, async (req, res) => {
    try {
      let productIds = _.get(req, `body.${modelName}`, undefined);

      if (!(productIds instanceof Array) || productIds.length === 0)
        throw new Error(`Invalid request: ${modelName} must be an array of ${modelName} IDs.`);

      productIDs = productIds.map(id => ({ '_id': new ObjectID(id) }));

      await collection.deleteMany({ $or: productIDs })
        .then(data => {
          res.send({
            deletedCount: data.deletedCount,
            data
          });
        })
    }
    catch (err) {
      handleError(err, res);
    }
  });
};
