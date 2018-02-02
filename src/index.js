"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const ossClient = require("ali-oss");
const co = require("co");
const dirTraveler = require("dir-traveler");
const fs = require("fs");
const hasha = require("hasha");
const multimatch = require("multimatch");
const path = require("path");
const LABEL = 'oss-serve:';
function mkDirsSync(p) {
    if (!fs.existsSync(p)) {
        mkDirsSync(path.dirname(p));
        fs.mkdirSync(p);
    }
}
class Serve {
    constructor({ oss, destination = '', match = ['**'], baseUrl }) {
        this._store = ossClient(oss);
        this._destination = destination;
        this._match = match;
        this._baseUrl = baseUrl;
    }
    push(root, cb = _ => undefined) {
        if (!fs.existsSync(root)) {
            throw new Error('Root is not exists!');
        }
        ((_) => __awaiter(this, void 0, void 0, function* () {
            const files = dirTraveler(root);
            const list = yield this._storeList({
                prefix: this._destination,
            });
            const keys = this._filterObjects(list);
            const localKeys = multimatch(Object.keys(files), this._match);
            for (const key of localKeys) {
                const file = files[key];
                const object = this._keyToObject(key);
                const index = keys.indexOf(key);
                if (index >= 0) {
                    keys.splice(index, 1);
                }
                try {
                    if (yield this._checkFileMata(file, object)) {
                        console.log(LABEL, `Remote file '${object}' need to update.`);
                        const hash = yield hasha.fromFile(file, { algorithm: 'md5' });
                        yield this._storePut(object, file, {
                            meta: { hash },
                        });
                        console.log(LABEL, `Remote file '${object}' update success!`);
                    }
                    else {
                        console.log(LABEL, `Remote file '${object}' is fresh.`);
                    }
                }
                catch (err) {
                    console.error(LABEL, `Update remote file '${object}' failed with error: ${err.message}`);
                }
            }
            for (const key of keys) {
                const object = this._keyToObject(key);
                try {
                    console.log(LABEL, `Remote file '${object}' need to remove.`);
                    yield this._storeDelete(object);
                    console.log(LABEL, `Remote file '${object}' removed success!`);
                }
                catch (err) {
                    console.error(LABEL, `Delete remote file '${object}' failed with error: ${err.message}`);
                }
            }
            try {
                const object = this._keyToObject('index.html');
                yield this._storeGet(object);
                console.log(LABEL, `Open link ${this._store.getObjectUrl(object, this._baseUrl)} in browser to view.`);
            }
            catch (err) {
                console.warn(LABEL, 'File index.html should serve.');
            }
        }))().then(_ => {
            cb();
        }).catch(err => {
            console.error(LABEL, err.message);
            cb(err);
        });
    }
    pull(root, cb = _ => undefined) {
        ((_) => __awaiter(this, void 0, void 0, function* () {
            const list = yield this._storeList({ prefix: this._destination });
            const keys = this._filterObjects(list);
            for (const key of keys) {
                if (key.slice(-1) === '/') {
                    continue;
                }
                const file = path.resolve(root, key);
                const dir = path.dirname(file);
                mkDirsSync(dir);
                const object = this._keyToObject(key);
                if (yield this._checkFileMata(file, object)) {
                    yield this._storeGet(object, file);
                    console.log(LABEL, `Fetched remote file '${object}' success!`);
                }
                else {
                    console.log(LABEL, `Local File '${object}' is fresh.`);
                }
            }
        }))().then(_ => {
            cb();
        }).catch(err => {
            console.error(LABEL, err.message);
            cb(err);
        });
    }
    _filterObjects(list) {
        const objects = list.objects.map(object => {
            return path.relative(this._destination, object.name);
        });
        return multimatch(objects, this._match);
    }
    _keyToObject(key) {
        return this._destination ? [this._destination, key].join('/') : key;
    }
    _checkFileMata(file, object) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this._storeHead(object);
                if (result.meta.hash) {
                    if (!fs.existsSync(file)) {
                        return true;
                    }
                    const hash = yield hasha.fromFile(file, { algorithm: 'md5' });
                    if (hash !== result.meta.hash) {
                        return true;
                    }
                }
            }
            catch (err) {
                if (err.status === 404) {
                    return true;
                }
            }
            return false;
        });
    }
    _storeList(...params) {
        return __awaiter(this, void 0, void 0, function* () {
            return co(function* () {
                return yield this._store.list(...params);
            }.bind(this));
        });
    }
    _storeHead(...params) {
        return __awaiter(this, void 0, void 0, function* () {
            return co(function* () {
                return yield this._store.head(...params);
            }.bind(this));
        });
    }
    _storeGet(...params) {
        return __awaiter(this, void 0, void 0, function* () {
            return co(function* () {
                return yield this._store.get(...params);
            }.bind(this));
        });
    }
    _storePut(...params) {
        return __awaiter(this, void 0, void 0, function* () {
            return co(function* () {
                return yield this._store.put(...params);
            }.bind(this));
        });
    }
    _storeDelete(...params) {
        return __awaiter(this, void 0, void 0, function* () {
            return co(function* () {
                return yield this._store.delete(...params);
            }.bind(this));
        });
    }
}
exports.default = Serve;
//# sourceMappingURL=index.js.map