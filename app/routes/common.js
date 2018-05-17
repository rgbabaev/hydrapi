const ObjectID = require('mongodb').ObjectID;
const _ = require('lodash');

exports.prettyIds = arr => arr.map(
  ({ _id, ...rest }) => ({ id: _id, ...rest })
);

exports.unPrettyIds = arr => arr.map(
  ({ id, ...rest }) => ({ _id: new ObjectID(id), ...rest })
);

/**
 * Check for uniqueness of elements in model.
*/
exports.isUnique = async (db, modelName, keys, items) => {
  if (!keys.length)
    throw new Error('Unique checking error. No keys to check.');
  if (!items.length)
    throw new Error('Unique checking error. No elements to check.');

  const query = {
    $or: _.flatten(
      items.map(
        item => keys.map(
          key => ({ [key]: item[key] })
        )
      )
    )
  };
  const result = await db.collection(modelName).find(query).toArray();
  return !result.length;
};

exports.validateInputItems = (schema, items) => {
  const fieldNames = Object.keys(schema);
  const errors = {};

  const r = items.map((item, i) => {
    const itemErrors = [];
    const filteredItem = {};

    _.forIn(schema, (fieldRules, fieldName) => {
      let value = item[fieldName];

      // check if the field is necessary and set default value
      if (fieldRules.required && (value === undefined || value === ''))
        itemErrors.push(`Field ${fieldName} is required.`);
      else if (value === undefined && fieldRules.default !== undefined)
        value = fieldRules.default;

      // check type of item value
      if (!fieldRules.required && value === undefined);
      else if (
        (typeof fieldRules.type === 'string' && typeof value !== fieldRules.type)
        ||
        (typeof fieldRules.type === 'function' && !(value instanceof fieldRules.type))
      )
        itemErrors.push(`Invalid type of field ${fieldName}.`);
      else if (!['string', 'function'].includes(typeof fieldRules.type))
        itemErrors.push(`Invalid type key of ${fieldName} in schema (${typeof fieldRules.type}).`);

      // custom validation
      if (typeof fieldRules.validation === 'function')
        try {
          fieldRules.validation(value);
        } catch (err) {
          itemErrors.push(err.toString());
        }

      filteredItem[fieldName] = value;
    });

    if (itemErrors.length) errors[i] = itemErrors;
    return itemErrors.length ? null : filteredItem;
  });

  if (Object.keys(errors).length) {
    let errorText = 'Validation errors:';
    for (const i in errors) {
      errorText += `\nitem ${i}: ${errors[i].join(' ')}`;
    }
    throw new Error(errorText);
  }

  return r;
};
