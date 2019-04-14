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
const fs = require('fs');
const path = require('path');
const { ObjectID } = require('mongodb');
const _ = require('lodash');
const mime = require('mime-types');
const createRoute = require('./route');
const fsAccess = path => new Promise(r => fs.access(path, err => r(!err)));
const fsClose = fd => new Promise(r => fs.close(fd, err => r(!err)));
const fsOpen = (path, flags, mode) => new Promise((resolve, reject) => fs.open(path, flags, mode, (err, fd) => err ? reject(err) : resolve(fd)));
const fsRead = (fd, buffer, offset, length, position) => new Promise((resolve, reject) => fs.read(fd, buffer, offset, length, position, (err, bytesRead) => err ? reject(err) : resolve(bytesRead)));
const fsUnlink = path => new Promise(r => fs.unlink(path, err => r(!err)));
const MODEL_NAME = 'fileStorage';
const UPLOAD_DIR = path.join(path.dirname(require.main.filename), 'upload');
const FILE_ROUTE = `/${MODEL_NAME}/file`;
const required = true;
const SCHEMA = {
    _id: {
        type: 'id',
    },
    active: {
        type: 'boolean',
        defaultValue: true
    },
    originalName: {
        type: 'string',
    },
    contentType: {
        type: 'string'
    },
    size: {
        type: 'number'
    }
};
const addPaths = ({ items = [], req }) => Promise.all(items.map((i) => __awaiter(this, void 0, void 0, function* () {
    // make this part shared
    const filePath = path.join(UPLOAD_DIR, `${i._id.toString()}.${i.extension}`);
    i.loaded = yield fsAccess(filePath);
    i.url = `${req.baseUrl}${FILE_ROUTE}/${i._id.toString()}.${i.extension}`;
    return i;
})));
const route = createRoute({
    modelName: MODEL_NAME,
    schema: SCHEMA,
    handlers: {
        afterGetQuery: addPaths,
        afterAddQuery: addPaths,
        beforeAddQuery: ({ items }) => items.map((_a) => {
            var { originalName = '' } = _a, rest = __rest(_a, ["originalName"]);
            return (Object.assign({ originalName, extension: path.extname(originalName).substr(1) }, rest));
        }),
        beforeDeleteQuery: ({ entityIds = [], db, req }) => __awaiter(this, void 0, void 0, function* () {
            let items = yield db
                .collection(MODEL_NAME)
                .find({ $or: entityIds })
                .toArray();
            items = yield Promise.all(items.map((i) => __awaiter(this, void 0, void 0, function* () {
                const filePath = path.join(UPLOAD_DIR, `${i._id.toString()}.${i.extension}`);
                i.fileUnlinked = yield fsUnlink(filePath);
                return i;
            })));
            return items.reduce(
            // delete db entry only after succesful file deletion
            // (acc, { _id, fileUnlinked }) => fileUnlinked ? [...acc, { _id }] : acc,
            (acc, { _id, fileUnlinked }) => [...acc, { _id }], []);
        })
    }
});
exports.route = (app, db) => {
    route(app, db);
    app.post(`${FILE_ROUTE}/:fileName`, (req, res) => __awaiter(this, void 0, void 0, function* () {
        const collection = db.collection(MODEL_NAME);
        try {
            const { fileName } = req.params;
            const id = new ObjectID(fileName.substr(0, 24));
            const filePath = path.join(UPLOAD_DIR, fileName);
            if (yield fsAccess(filePath)) {
                res.status(422).end();
                return;
            }
            let data = yield collection.findOne({ _id: id });
            if (data === null || `${id.toString()}.${data.extension}` !== fileName) {
                res.status(404).end();
                return;
            }
            const fileStream = fs.createWriteStream(filePath);
            req.pipe(fileStream);
            req.on('end', () => res.status(202).end());
        }
        catch (err) {
            res.status(500).end();
        }
    }));
    app.get(`${FILE_ROUTE}/:fileName`, (req, res) => __awaiter(this, void 0, void 0, function* () {
        try {
            const id = new ObjectID(req.params.fileName.substr(0, 24));
            const fileExtension = path.extname(req.params.fileName);
            const filePath = path.join(UPLOAD_DIR, `${id.toString()}${fileExtension}`);
            const mimeType = mime.lookup(filePath);
            if (mimeType)
                res.set('Content-Type', mimeType);
            const fileStream = fs.createReadStream(filePath);
            fileStream.on('error', err => res.status(404).end());
            fileStream.pipe(res);
            // Are we need this?
            // fileStream.on('end', () => {
            //   res.end();
            // });
        }
        catch (err) {
            res.status(404).end();
        }
    }));
};
exports.getFilesData = ({ db, entityIds = [], req }) => __awaiter(this, void 0, void 0, function* () {
    let items = yield db
        .collection(MODEL_NAME)
        .find({
        $or: entityIds.map(i => ({ _id: i }))
    })
        .toArray();
    items = yield addPaths({ items, req });
    return items.map((_a) => {
        var { _id } = _a, rest = __rest(_a, ["_id"]);
        return (Object.assign({ id: _id }, rest));
    });
});
//# sourceMappingURL=fileStorage.js.map