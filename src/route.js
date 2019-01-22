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
    beforeAddQuery,
    beforePatchQuery,
    beforeDeleteQuery,
    afterGetQuery,
    afterAddQuery
  } = {}
}) => (app, db) => {
  const collection = db.collection(modelName);

  app.get(`/${modelName}`, async (req, res) => {
    try {
      // beforeGetQuery
      let items = await collection.find({}).toArray();
      // afterGetQuery
      items = typeof afterGetQuery === 'function' ?
        await afterGetQuery({
          db,
          items,
          req,
          res
        }) :
        items;
      res.send({ data: { [modelName]: prettyIds(items) } });
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

      items = typeof beforeAddQuery === 'function' ?
        await beforeAddQuery({
          db,
          items,
          req,
          res
        }) :
        items;

      items = items.map(item => _.omitBy(item, i => i === undefined));

      await collection.insertMany(items)
        .then(async ({ ops: items}) => {
          // afterAddQuery
          items = typeof afterAddQuery === 'function' ?
            await afterAddQuery({
              db,
              items,
              req,
              res
            }) :
            items;

          res.send({ data: { [modelName]: prettyIds(items) } });
        });
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

      items = typeof beforePatchQuery === 'function' ?
        await beforePatchQuery({
          db,
          items,
          req,
          res
        }) :
        items;

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

      await collection.find({ $or: result }).toArray().then(data => {
        res.send({ data: { [modelName]: prettyIds(data) } });
      });
    }
    catch (err) {
      handleError(err, res);
    }
  });

  app.delete(`/${modelName}`, async (req, res) => {
    try {
      let entityIds = _.get(req, `body.${modelName}`, undefined);

      if (!(entityIds instanceof Array) || entityIds.length === 0)
        throw new Error(`Invalid request: ${modelName} must be an array of ${modelName} IDs.`);

      entityIds = entityIds.map(id => ({ '_id': new ObjectID(id) }));

      entityIds = typeof beforeDeleteQuery === 'function' ?
        await beforeDeleteQuery({
          db,
          entityIds,
          req,
          res
        }) :
        entityIds;

      if (!entityIds.length) {
        throw new Error('Nothing to delete');
      }

      await collection.deleteMany({ $or: entityIds })
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
