"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const mongodb_1 = require("mongodb");
const isEmpty_1 = tslib_1.__importDefault(require("lodash/isEmpty"));
const flatten_1 = tslib_1.__importDefault(require("lodash/flatten"));
exports.prettyIds = (arr) => arr.map((_a) => {
    var { _id } = _a, rest = tslib_1.__rest(_a, ["_id"]);
    return (Object.assign({ id: _id }, rest));
});
exports.unPrettyIds = (arr) => arr.map((_a) => {
    var { id } = _a, rest = tslib_1.__rest(_a, ["id"]);
    return (Object.assign({ _id: new mongodb_1.ObjectID(id) }, rest));
});
exports.isEmpty = v => (v instanceof Object ?
    isEmpty_1.default(v) :
    v === undefined || v === null || v === '');
/**
 * Check for uniqueness of elements in model.
*/
exports.isUnique = async (db, modelName, schema, items) => {
    const keys = Object.keys(schema).filter(key => schema[key].unique);
    if (!keys.length)
        return true;
    // throw new Error('Unique checking error. No keys to check.');
    if (!items.length)
        throw new Error('Unique checking error. No elements to check.');
    const query = {
        $or: flatten_1.default(items.map(item => keys.map(key => {
            const part = { [key]: item[key] };
            if (item._id)
                part._id = { $ne: item._id };
            return part;
        })))
    };
    const result = await db.collection(modelName).find(query).toArray();
    return !result.length;
};
exports.handleError = (error, res) => {
    if (error.name === 'MongoError') {
        error.message = 'Database error';
        res.status(500);
        console.error(error);
    }
    else {
        res.status(400);
        // console.warn(error);
    }
    res.send({ error: error.message });
};
//# sourceMappingURL=common.js.map