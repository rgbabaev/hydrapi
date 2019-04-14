const _ = require('lodash');
const { isEmpty } = require('./common');
const { checkFieldType } = require('./typeCheck');

const validateInputField = async (
  fieldName,
  {
    defaultValue,
    required,
    type,
    modification,
    multiple
  },
  value
) => {
  const fieldErrors = [];

  // check if the field is necessary and set default value
  if (required && isEmpty(value))
    fieldErrors.push(`Field "${fieldName}" is required.`);
  else if (value === undefined && defaultValue !== undefined)
    value = defaultValue;

  try {
    value = await checkFieldType({
      type,
      fieldName,
      value,
      multiple,
      required
    });
  } catch (err) {
    fieldErrors.push(err.message);
  }

  // value modification
  // if (typeof modification === 'function')
  //   try { value = await modification(value); }
  //   catch (err) { fieldErrors.push(err.message); }

  return {
    value,
    fieldErrors
  };
};

const validateInputItems = async (schema, items) => {
  const fieldNames = Object.keys(schema);
  const errors = {};

  const r = await Promise.all(
    items.map(async (item, i) => {
      let itemErrors = [];
      const filteredItem = {};

      for (const fieldName in schema) {
        const { fieldErrors, value } = await validateInputField(
          fieldName,
          schema[fieldName],
          item[fieldName]
        );
        itemErrors.push(fieldErrors);
        filteredItem[fieldName] = value;
      }

      itemErrors = _.flattenDeep(itemErrors);
      if (itemErrors.length) errors[i] = itemErrors;
      return itemErrors.length ? null : filteredItem;
    })
  );

  if (Object.keys(errors).length) {
    let errorText = 'Validation errors:';
    for (const i in errors) {
      errorText += `\nitem ${i}: ${errors[i].join(' ')}`;
    }
    throw new Error(errorText);
  }

  return r;
};

module.exports = {
  validateInputItems
};
