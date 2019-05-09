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
const lodash_1 = __importDefault(require("lodash"));
const common_1 = require("./common");
const lifecycle_1 = require("./lifecycle");
;
exports.default = ({ modelName, schema, handlers: { beforeAddQuery, beforePatchQuery, beforeDeleteQuery, afterGetQuery, afterAddQuery } = {} }) => (app, db) => {
    const collection = db.collection(modelName);
    app.get(`/${modelName}`, (req, res) => __awaiter(this, void 0, void 0, function* () {
        try {
            // beforeGetQuery
            let items = yield collection.find({}).toArray();
            // afterGetQuery
            items = typeof afterGetQuery === 'function' ?
                yield afterGetQuery({
                    db,
                    items,
                    req,
                    res
                }) :
                items;
            res.send({ data: { [modelName]: common_1.prettyIds(items) } });
        }
        catch (err) {
            common_1.handleError(err, res);
        }
    }));
    app.post(`/${modelName}`, (req, res) => __awaiter(this, void 0, void 0, function* () {
        try {
            let items = lodash_1.default.get(req, `body.${modelName}`, undefined);
            if (!(items instanceof Array) || items.length === 0)
                throw new Error(`Invalid request: ${modelName} must be an non-empty array.`);
            items = yield lifecycle_1.validateInputItems(schema, items);
            if (!(yield common_1.isUnique(db, modelName, schema, items)))
                throw new Error('Elements not unique');
            items = typeof beforeAddQuery === 'function' ?
                yield beforeAddQuery({
                    db,
                    items,
                    req,
                    res
                }) :
                items;
            items = items.map(item => lodash_1.default.omitBy(item, i => i === undefined));
            yield collection.insertMany(items)
                .then(({ ops: items }) => __awaiter(this, void 0, void 0, function* () {
                // afterAddQuery
                items = typeof afterAddQuery === 'function' ?
                    yield afterAddQuery({
                        db,
                        items,
                        req,
                        res
                    }) :
                    items;
                res.send({ data: { [modelName]: common_1.prettyIds(items) } });
            }));
        }
        catch (err) {
            common_1.handleError(err, res);
        }
    }));
    // TODO: answer with some bad items responses
    app.patch(`/${modelName}`, (req, res) => __awaiter(this, void 0, void 0, function* () {
        try {
            let items = lodash_1.default.get(req, `body.${modelName}`, undefined);
            if (!(items instanceof Array) || items.length === 0)
                throw new Error(`Invalid request: ${modelName} must be an non-empty array.`);
            items = yield lifecycle_1.validateInputItems(schema, common_1.unPrettyIds(items));
            if (!(yield common_1.isUnique(db, modelName, schema, items)))
                throw new Error('Elements not unique');
            items = items.map(item => lodash_1.default.omitBy(item, i => i === undefined));
            items = typeof beforePatchQuery === 'function' ?
                yield beforePatchQuery({
                    db,
                    items,
                    req,
                    res
                }) :
                items;
            const result = yield Promise.all(items.map((_a) => __awaiter(this, void 0, void 0, function* () {
                var { _id } = _a, item = __rest(_a, ["_id"]);
                const r = yield collection.updateOne({ _id }, { $set: item });
                if (lodash_1.default.get(r, 'modifiedCount') !== 1)
                    throw new Error(`Update operation error. ` +
                        `Matched: ${r.matchedCount}, modified: ${r.modifiedCount}.`);
                return { _id };
            })));
            yield collection.find({ $or: result }).toArray().then(data => {
                res.send({ data: { [modelName]: common_1.prettyIds(data) } });
            });
        }
        catch (err) {
            common_1.handleError(err, res);
        }
    }));
    app.delete(`/${modelName}`, (req, res) => __awaiter(this, void 0, void 0, function* () {
        try {
            let entityIds = lodash_1.default.get(req, `body.${modelName}`, undefined);
            if (!(entityIds instanceof Array) || entityIds.length === 0)
                throw new Error(`Invalid request: ${modelName} must be an array of ${modelName} IDs.`);
            entityIds = entityIds.map(id => ({ _id: new mongodb_1.ObjectID(id) }));
            entityIds = typeof beforeDeleteQuery === 'function' ?
                yield beforeDeleteQuery({
                    db,
                    entityIds,
                    req,
                    res
                }) :
                entityIds;
            if (!entityIds.length) {
                throw new Error('Nothing to delete');
            }
            yield collection.deleteMany({ $or: entityIds })
                .then(data => {
                res.send({
                    deletedCount: data.deletedCount,
                    data
                });
            });
        }
        catch (err) {
            common_1.handleError(err, res);
        }
    }));
};
//# sourceMappingURL=route.js.map