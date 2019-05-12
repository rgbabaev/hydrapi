"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = __importDefault(require("lodash"));
const common_1 = require("./common");
const typeCheck_1 = require("./typeCheck");
const validateInputField = async (fieldName, { defaultValue, required, type, multiple }, value) => {
    const fieldErrors = [];
    if (common_1.isEmpty(value)) {
        if (required) {
            fieldErrors.push(`Field "${fieldName}" is required.`);
        }
        value = defaultValue || null;
    }
    try {
        value = await typeCheck_1.checkFieldType({
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
    return {
        value,
        fieldErrors
    };
};
exports.validateInputItems = async (schema, items) => {
    const errors = {};
    const r = await Promise.all(items.map(async (item, i) => {
        let itemErrors = [];
        const filteredItem = {};
        for (const fieldName in schema) {
            const { fieldErrors, value } = await validateInputField(fieldName, schema[fieldName], item[fieldName]);
            itemErrors.push(...fieldErrors);
            filteredItem[fieldName] = value;
        }
        itemErrors = lodash_1.default.flattenDeep(itemErrors); // is this needed?
        if (itemErrors.length)
            errors[i] = itemErrors;
        return itemErrors.length ? null : filteredItem;
    }));
    if (Object.keys(errors).length) {
        let errorText = 'Validation errors:';
        for (const i in errors) {
            errorText += `\nitem ${i}: ${errors[i].join(' ')}`;
        }
        throw new Error(errorText);
    }
    return r;
};
//# sourceMappingURL=lifecycle.js.map