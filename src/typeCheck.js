const _ = require('lodash');
const { ObjectID } = require('mongodb');
const { isEmpty } = require('./common');

const simpleTypes = {
  any: value => value,

  string: value => {
    if (typeof value !== 'string')
      throw new Error(`Must be a string.`);
    return value;
  },

  urlCode: value => {
    if (!(typeof value === 'string' && /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(value)))
      throw new Error(`Must contain only lower case letters, digits and "-".`);
    return value;
  },

  number: value => {
    if (typeof value !== 'number')
      throw new Error(`Must be a number.`);
    return value;
  },

  boolean: value => {
    if (typeof value !== 'boolean')
      throw new Error(`Must be a boolean.`);
    return value;
  },

  id: value => {
    if (
      !(value instanceof ObjectID) &&
      !(typeof value === 'string' && [12, 24].includes(value.length)) // replace to regex
    )
      throw new Error(`Must be an ObjectID.`);
    return value;
  },
  // email
};

const checkFieldType = async ({
  type,
  fieldName,
  value,
  required,
  multiple
}) => {
  let error = '';

  if (!required && value === undefined) return;
  value = multiple ? value : [value];

  for (let i = 0; i < value.length; i++) {
    if (Object.keys(simpleTypes).includes(type))
      try {
        value[i] = await simpleTypes[type](value[i]);
      } catch (err) {
        error = `Invalid type of field "${fieldName}". ${err.message}`;
      }
    else if (typeof type === 'function')
      try {
        value[i] = await type(value[i]);
      } catch (err) {
        error = `Invalid type of field "${fieldName}". ${err.message}`;
      }
    else
      error = `Invalid type key of "${fieldName}" in schema.`;
  }

  if (error) throw new Error(error);

  return multiple ? value : value[0];
};

const relation = ({
  db,
  collectionName,
  checkTargetExists = true
}) => async value => {
  if (isEmpty(value)) {
    return null;
  }

  try {
    simpleTypes.id(value);
    if (!(value instanceof ObjectID))
      value = new ObjectID(value);

    const r = await db.collection(collectionName)
      .find({ $or: [{ _id: value }] })
      .toArray();

    if (!r.length)
      throw new Error('Target item not exists.');
  } catch (err) {
    throw new Error(err.message);
  }

  return value;
};

const shape = model => async valueObject => {
  if (typeof valueObject !== 'object') return;

  const modelKeys = Object.keys(model);

  const excessKeys = Object.keys(_.omit(valueObject, modelKeys));
  if (excessKeys.length)
    throw new Error(`Input object has an excess keys: ${excessKeys.join(', ')}.`);

  for (var key in model) {
    if (model[key].required && isEmpty(valueObject[key]))
      throw new Error(`Field "${key}" is required.`);

    await checkFieldType({
      type: model[key].type,
      fieldName: key,
      value: valueObject[key],
      required: model[key].required,
      multiple: model[key].multiple
    });
  }

  return valueObject;
};

module.exports = {
  checkFieldType,
  ...simpleTypes,
  relation,
  shape
};
