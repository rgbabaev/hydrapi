var ObjectID = require('mongodb').ObjectID;
const _ = require('lodash');

const MODEL_NAME = 'productProperties';

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
