"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const mongodb_1 = require("mongodb");
const lodash_1 = tslib_1.__importDefault(require("lodash"));
const common_1 = require("./common");
const lifecycle_1 = require("./lifecycle");
;
exports.default = ({ modelName, schema, handlers: { beforeAddQuery, beforePatchQuery, beforeDeleteQuery, afterGetQuery, afterAddQuery } = {} }) => (app, db) => {
    const collection = db.collection(modelName);
    app.get(`/${modelName}`, async (req, res) => {
        try {
            // beforeGetQuery
            let items = await collection.find({}).toArray();
            // afterGetQuery
            items = typeof afterGetQuery === 'function' ?
                await afterGetQuery({
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
    });
    app.post(`/${modelName}`, async (req, res) => {
        try {
            let items = lodash_1.default.get(req, `body.${modelName}`, undefined);
            if (!(items instanceof Array) || items.length === 0)
                throw new Error(`Invalid request: ${modelName} must be an non-empty array.`);
            items = await lifecycle_1.validateInputItems(schema, items);
            if (!await common_1.isUnique(db, modelName, schema, items))
                throw new Error('Elements not unique');
            items = typeof beforeAddQuery === 'function' ?
                await beforeAddQuery({
                    db,
                    items,
                    req,
                    res
                }) :
                items;
            items = items.map(item => lodash_1.default.omitBy(item, i => i === undefined));
            await collection.insertMany(items)
                .then(async ({ ops: items }) => {
                items = typeof afterAddQuery === 'function' ?
                    await afterAddQuery({
                        db,
                        items,
                        req,
                        res
                    }) :
                    items;
                res.send({ data: { [modelName]: common_1.prettyIds(items) } });
            });
        }
        catch (err) {
            common_1.handleError(err, res);
        }
    });
    // TODO: answer with some bad items responses
    app.patch(`/${modelName}`, async (req, res) => {
        try {
            let items = lodash_1.default.get(req, `body.${modelName}`, undefined);
            if (!(items instanceof Array) || items.length === 0)
                throw new Error(`Invalid request: ${modelName} must be an non-empty array.`);
            items = await lifecycle_1.validateInputItems(schema, common_1.unPrettyIds(items));
            if (!await common_1.isUnique(db, modelName, schema, items))
                throw new Error('Elements not unique');
            items = items.map(item => lodash_1.default.omitBy(item, i => i === undefined));
            items = typeof beforePatchQuery === 'function' ?
                await beforePatchQuery({
                    db,
                    items,
                    req,
                    res
                }) :
                items;
            const result = await Promise.all(items.map(async (_a) => {
                var { _id } = _a, item = tslib_1.__rest(_a, ["_id"]);
                const r = await collection.updateOne({ _id }, { $set: item });
                if (lodash_1.default.get(r, 'modifiedCount') !== 1)
                    throw new Error(`Update operation error. ` +
                        `Matched: ${r.matchedCount}, modified: ${r.modifiedCount}.`);
                return { _id };
            }));
            await collection.find({ $or: result }).toArray().then(data => {
                res.send({ data: { [modelName]: common_1.prettyIds(data) } });
            });
        }
        catch (err) {
            common_1.handleError(err, res);
        }
    });
    app.delete(`/${modelName}`, async (req, res) => {
        try {
            let entityIds = lodash_1.default.get(req, `body.${modelName}`, undefined);
            if (!(entityIds instanceof Array) || entityIds.length === 0)
                throw new Error(`Invalid request: ${modelName} must be an array of ${modelName} IDs.`);
            entityIds = entityIds.map(id => ({ _id: new mongodb_1.ObjectID(id) }));
            entityIds = typeof beforeDeleteQuery === 'function' ?
                await beforeDeleteQuery({
                    db,
                    entityIds,
                    req,
                    res
                }) :
                entityIds;
            if (!entityIds.length) {
                throw new Error('Nothing to delete');
            }
            await collection.deleteMany({ $or: entityIds })
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
    });
};
//# sourceMappingURL=route.js.map