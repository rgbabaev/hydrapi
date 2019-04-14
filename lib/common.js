"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0)
            t[p[i]] = s[p[i]];
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongodb_1 = require("mongodb");
const isEmpty_1 = __importDefault(require("lodash/isEmpty"));
const flatten_1 = __importDefault(require("lodash/flatten"));
exports.prettyIds = (arr) => arr.map((_a) => {
    var { _id } = _a, rest = __rest(_a, ["_id"]);
    return (Object.assign({ id: _id }, rest));
});
exports.unPrettyIds = (arr) => arr.map((_a) => {
    var { id } = _a, rest = __rest(_a, ["id"]);
    return (Object.assign({ _id: new mongodb_1.ObjectID(id) }, rest));
});
exports.isEmpty = v => (typeof v === 'object' ?
    isEmpty_1.default(v) :
    v === undefined || v === null || v === '' || v === 0);
// const isRequired = ({ fieldName, value, errors = [], ...rest }) => {
//   if (isEmpty(value))
//     errors.push(`Field ${fieldName} is required.`);
//   return { fieldName, value, errors, ...rest };
// };
/**
 * Check for uniqueness of elements in model.
*/
exports.isUnique = (db, modelName, schema, items) => __awaiter(this, void 0, void 0, function* () {
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
    const result = yield db.collection(modelName).find(query).toArray();
    return !result.length;
});
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