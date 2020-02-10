import _ from 'lodash';
import { isEmpty } from './common';
import { checkFieldType, ISchema, ISchemaField } from './typeCheck';

type TValidateInputField = (
  fieldName: string,
  schemaField: ISchemaField,
  value: any
) => Promise<{
  value: any;
  fieldErrors: string[];
}>

const validateInputField: TValidateInputField = async (
  fieldName,
  {
    defaultValue,
    required,
    type,
    multiple
  },
  value
) => {
  const fieldErrors: string[] = [];

  if (isEmpty(value)) {
    if (required) {
      fieldErrors.push(`Field "${fieldName}" is required.`);
    }

    value = defaultValue || null;
  }

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
      errorText += `\nitem ${i}:\n${errors[i].join('\n')}`;
    }
    throw new Error(errorText);
  }

  return r;
};
