"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const _ = require('lodash');
const { isEmpty } = require('./common');
const { checkFieldType } = require('./typeCheck');
const validateInputField = (fieldName, { defaultValue, required, type, modification, multiple }, value) => __awaiter(this, void 0, void 0, function* () {
    const fieldErrors = [];
    // check if the field is necessary and set default value
    if (required && isEmpty(value))
        fieldErrors.push(`Field "${fieldName}" is required.`);
    else if (value === undefined && defaultValue !== undefined)
        value = defaultValue;
    try {
        value = yield checkFieldType({
            type,
            fieldName,
            value,
            multiple,
            required
        });
    }
    catch (err) {
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
});
const validateInputItems = (schema, items) => __awaiter(this, void 0, void 0, function* () {
    const fieldNames = Object.keys(schema);
    const errors = {};
    const r = yield Promise.all(items.map((item, i) => __awaiter(this, void 0, void 0, function* () {
        let itemErrors = [];
        const filteredItem = {};
        for (const fieldName in schema) {
            const { fieldErrors, value } = yield validateInputField(fieldName, schema[fieldName], item[fieldName]);
            itemErrors.push(fieldErrors);
            filteredItem[fieldName] = value;
        }
        itemErrors = _.flattenDeep(itemErrors);
        if (itemErrors.length)
            errors[i] = itemErrors;
        return itemErrors.length ? null : filteredItem;
    })));
    if (Object.keys(errors).length) {
        let errorText = 'Validation errors:';
        for (const i in errors) {
            errorText += `\nitem ${i}: ${errors[i].join(' ')}`;
        }
        throw new Error(errorText);
    }
    return r;
});
module.exports = {
    validateInputItems
};
//# sourceMappingURL=lifecycle.js.map