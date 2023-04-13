"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.date = exports.id = exports.boolean = exports.number = exports.urlCode = exports.string = exports.any = exports.shape = exports.relation = exports.checkFieldType = void 0;
const tslib_1 = require("tslib");
const lodash_1 = tslib_1.__importDefault(require("lodash"));
const mongodb_1 = require("mongodb");
const common_1 = require("./common");
const simpleTypes = {
    any: (value) => value,
    string: (value) => {
        if (typeof value !== 'string')
            throw new Error(`Must be a string.`);
        return value;
    },
    urlCode: (value) => {
        if (!(typeof value === 'string' && /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(value)))
            throw new Error(`Must contain only lower case letters, digits and "-".`);
        return value;
    },
    number: (value) => {
        if (typeof value !== 'number')
            throw new Error(`Must be a number.`);
        return value;
    },
    boolean: (value) => {
        if (typeof value !== 'boolean')
            throw new Error(`Must be a boolean.`);
        return value;
    },
    id: (value) => {
        if (!(value instanceof mongodb_1.ObjectId) &&
            !(typeof value === 'string' && [12, 24].includes(value.length)) // replace to regex
        )
            throw new Error(`Must be an ObjectId.`);
        return value;
    },
    date: (value) => {
        if (typeof value === 'string' && value) {
            const parsedValue = Date.parse(value);
            if (!isNaN(parsedValue)) {
                return new Date(parsedValue);
            }
        }
        throw new Error(`Must be a string compatible with Date().`);
    }
    // email
};
const checkFieldType = async ({ type, fieldName, value, required, multiple }) => {
    const error = [];
    if (!required && common_1.isEmpty(value))
        return null;
    value = multiple ? value : [value];
    for (let i = 0; i < value.length; i++) {
        if (typeof type === 'string' && Object.keys(simpleTypes).includes(type))
            try {
                value[i] = await simpleTypes[type](value[i]);
            }
            catch (err) {
                error.push(`Invalid type of field "${fieldName}". ${err.message}`);
            }
        else if (typeof type === 'function')
            try {
                value[i] = await type(value[i]);
            }
            catch (err) {
                error.push(`Invalid type of field "${fieldName}". ${err.message}`);
            }
        else
            error.push(`Invalid 'type' property of "${fieldName}" in schema.`);
    }
    if (error.length > 0) {
        throw new Error(error.join('\n'));
    }
    return multiple ? value : value[0];
};
exports.checkFieldType = checkFieldType;
const relation = ({ db, collectionName, checkTargetExists = true // TODO: implement?
 }) => async (value) => {
    try {
        simpleTypes.id(value);
        if (!(value instanceof mongodb_1.ObjectId))
            value = new mongodb_1.ObjectId(value);
        const r = await db.collection(collectionName)
            .find({ $or: [{ _id: value }] })
            .toArray();
        if (!r.length)
            throw new Error('Target item not exists.');
    }
    catch (err) {
        throw new Error(err.message);
    }
    return value;
};
exports.relation = relation;
const shape = model => async (valueObject) => {
    if (common_1.isEmpty(valueObject))
        valueObject = {};
    else if (typeof valueObject !== 'object')
        throw new Error('Input value is not a object');
    const modelKeys = Object.keys(model);
    const excessKeys = Object.keys(lodash_1.default.omit(valueObject, modelKeys));
    if (excessKeys.length)
        throw new Error(`Input object has an excess keys: ${excessKeys.join(', ')}.`);
    for (const key in model) {
        if (model[key].required && common_1.isEmpty(valueObject[key]))
            throw new Error(`Field "${key}" is required.`);
        await exports.checkFieldType({
            type: model[key].type,
            fieldName: key,
            value: valueObject[key],
            required: model[key].required,
            multiple: model[key].multiple
        });
    }
    return valueObject;
};
exports.shape = shape;
exports.any = simpleTypes.any;
exports.string = simpleTypes.string;
exports.urlCode = simpleTypes.urlCode;
exports.number = simpleTypes.number;
exports.boolean = simpleTypes.boolean;
exports.id = simpleTypes.id;
exports.date = simpleTypes.date;
//# sourceMappingURL=typeCheck.js.map