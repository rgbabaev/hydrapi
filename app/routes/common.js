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
exports.isUnique = async (db, modelName, schema, items) => {
  const keys = [];
  for (var key in schema)
    if (schema[key].unique) keys.push(key);

  if (!keys.length)
    throw new Error('Unique checking error. No keys to check.');
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

const checkType = ({
  types,
  fieldName,
  value,
  required,
  multiple
}) => {
  let error = '';
  types = types instanceof Array ? types : [types];
  if (!required && value === undefined) return;
  value = multiple ? value : [value];

  for (let i = 0; i < value.length; i++) {
    for (let ii = 0; ii < types.length; ii++) {
      const type = types[ii];

      if (!['string', 'function'].includes(typeof type))
        error = `Invalid type key of ${fieldName} in schema (${typeof type}).`;
      else if (
        (typeof type === 'string' && type !== 'any' && typeof value[i] !== type)
        ||
        (typeof type === 'function' && !(value[i] instanceof type))
      ) {
        console.log(value);
        error = `Invalid type of field ${fieldName}.`;
      }
      else return;
    }
  }

  if (error.length) throw error;
};

exports.validateInputItems = (schema, items) => {
  const fieldNames = Object.keys(schema);
  const errors = {};

  const r = items.map((item, i) => {
    const itemErrors = [];
    const filteredItem = {};

    _.forIn(schema, ({ defaultValue, required, type, validation, multiple }, fieldName) => {
      let value = item[fieldName];

      // check if the field is necessary and set default value
      if (required && (value === undefined || value === ''))
        itemErrors.push(`Field ${fieldName} is required.`);
      else if (value === undefined && defaultValue !== undefined)
        value = defaultValue;

      try {
        checkType({
          types: type,
          fieldName,
          value,
          multiple,
          required
        });
      } catch (err) {
        itemErrors.push(err);
      }

      // custom validation
      if (typeof validation === 'function')
        try { value = validation(value); }
        catch (err) { itemErrors.push(err.toString()); }

      filteredItem[fieldName] = value;
    });

    if (itemErrors.length) errors[i] = _.flatten(itemErrors);
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
