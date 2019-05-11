import _ from 'lodash';
import { isEmpty } from './common';
import { checkFieldType, ISchema, ISchemaField } from './typeCheck';

const validateInputField = async (
  fieldName: string,
  {
    defaultValue,
    required,
    type,
    multiple
  }: ISchemaField,
  value: any
) => {
  const fieldErrors: string[] = [];

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

export const validateInputItems = async <P>(schema: ISchema, items: P[]): Promise<any[]> => {
  const errors: { [key: string]: string[] } = {};

  const r = await Promise.all(
    items.map(async (item: { [key: string]: any }, i) => {
      let itemErrors: string[] = [];
      const filteredItem: { [key: string]: any } = {};

      for (const fieldName in schema) {
        const { fieldErrors, value } = await validateInputField(
          fieldName,
          schema[fieldName],
          item[fieldName]
        );
        itemErrors.push(...fieldErrors);
        filteredItem[fieldName] = value;
      }

      itemErrors = _.flattenDeep(itemErrors); // is this needed?
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
