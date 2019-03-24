const { ObjectID } = require('mongodb');
const _ = require('lodash');

const prettyIds = arr => arr.map(
  ({ _id, ...rest }) => ({ id: _id, ...rest })
);

const unPrettyIds = arr => arr.map(
  ({ id, ...rest }) => ({ _id: new ObjectID(id), ...rest })
);

const isEmpty = v => v instanceof Object ?
  _.isEmpty(v) :
  v === undefined || v === null || v === '';

// const isRequired = ({ fieldName, value, errors = [], ...rest }) => {
//   if (isEmpty(value))
//     errors.push(`Field ${fieldName} is required.`);
//   return { fieldName, value, errors, ...rest };
// };

/**
 * Check for uniqueness of elements in model.
*/
const isUnique = async (db, modelName, schema, items) => {
  const keys = [];
  for (var key in schema)
    if (schema[key].unique) keys.push(key);

  if (!keys.length)
    return true;
  // throw new Error('Unique checking error. No keys to check.');
  if (!items.length)
    throw new Error('Unique checking error. No elements to check.');

  const query = {
    $or: _.flatten(
      items.map(
        item => keys.map(
          key => {
            const part = { [key]: item[key] };
            if (item._id) part._id = { $ne: item._id };
            return part;
          }
        )
      )
    )
  };

  const result = await db.collection(modelName).find(query).toArray();
  return !result.length;
};

const handleError = (error, res) => {
  if (error.name === 'MongoError') {
    error.message = 'Database error';
    res.status(500);
    console.error(error);
  } else {
    res.status(400);
    // console.warn(error);
  }
  res.send({ error: error.message });
};

module.exports = {
  isEmpty,
  isUnique,
  handleError,
  prettyIds,
  unPrettyIds
};
