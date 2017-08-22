const oss = require('ali-oss');
const dirTraveler = require('dir-traveler');
const path = require('path');
const fs = require('fs');
const co = require('co');
const hasha = require('hasha');
const multimatch = require('multimatch');
const info = require('debug')('oss-serve');

const LABEL = 'oss-serve:';

const mkDirsSync = p => {
  if (!fs.existsSync(p)) {
    mkDirsSync(path.dirname(p));
    fs.mkdirSync(p);
  }
};

class Serve {
  constructor (options = {}) {
    this._store = oss(options.oss);
    this._destination = options.destination;
    this._match = options.match || ['**'];
    this._baseUrl = options.baseUrl;
  }

  _filterObjects (list) {
    const objects = list && list.objects
      && Array.isArray(list.objects)
      && list.objects.map(object => path.relative(this._destination || '', object.name))
      || [];

    return multimatch(objects, this._match);
  }

  * _checkFileMeta (file, object) {
    // check file meta;
    try {
      const result = yield this._store.head(object);
      if (result.meta.hash) {
        const hash = yield hasha.fromFile(file, { algorithm: 'md5' });
        if (hash !== result.meta.hash) return true;
      }
    } catch (err) {
      // file not exists
      info(`Head file '${object}' failed with error: ${err.message}`);
      if (err.status === 404) return true;
    }
    return false;
  }

  _keyToObject (key) {
    return this._destination ? [this._destination, key].join('/') : key;
  }

  push (root) {
    if (!fs.existsSync(root)) throw new Error('Root is not exists!');
    const files = dirTraveler(root);
    return co(function * () {
      // list remote files
      const list = yield this._store.list({
        prefix: this._destination
      });

      const keys = this._filterObjects(list);

      // check locale files
      const localKeys = multimatch(Object.keys(files), this._match);
      for (let key of localKeys) {
        const file = files[key];
        const object = this._keyToObject(key);

        const index = keys.indexOf(key);
        index >= 0 && keys.splice(index, 1);

        // update file
        try {
          if (yield this._checkFileMeta(file, object)) {
            console.log(LABEL, `File '${object}' need to update.`);

            const hash = yield hasha.fromFile(file, { algorithm: 'md5' });

            yield this._store.put(object, file, {
              meta: { hash }
            });
            console.log(LABEL, `File '${object}' update success!`);
          } else {
            console.log(LABEL, `File '${object}' is fresh.`);
          }
        } catch (err) {
          // update file failed;
          console.error(LABEL, `Update file '${object}' failed with error: ${err.message}`);
        }

      }

      for (let key of keys) {
        const object = this._keyToObject(key);
        try {
          console.log(LABEL, `File '${object}' need to remove.`);
          yield this._store.delete(object);
          console.log(LABEL, `File '${object}' removed success!`);
        } catch (err) {
          // delete file failed
          console.error(LABEL, `Delete file '${object}' failed with error: ${err.message}`);
        }
      }

      try {
        const object = this._keyToObject('index.html');
        yield this._store.get(object);

        console.log(LABEL, `Open link ${this._store.getObjectUrl(object, this._baseUrl)} in browser to view.`);
      } catch (err) {
        // index.html do not exists;
        console.warn(LABEL, 'File index.html should serve.');
      }

    }.bind(this)).catch(err => console.error(LABEL, err.message));
  }

  pull (root) {
    return co(function * () {
      // list remote files
      const list = yield this._store.list({
        prefix: this._destination
      });

      const keys = this._filterObjects(list);
      // get files from remote;
      for (let key of keys) {
        if (key.slice(-1) === '/') continue;
        const file = path.resolve(root, key);
        const dir = path.dirname(file);
        mkDirsSync(dir);
        const object = this._keyToObject(key);

        if (yield this._checkFileMeta(file, object)) {
          yield this._store.get(object, file);
          console.log(LABEL, `Fetched file '${object}' success!`);
        } else {
          console.log(LABEL, `File '${object}' is fresh.`);
        }
      }
    }.bind(this)).catch(err => console.error(LABEL, err));
  }
}

module.exports = Serve;