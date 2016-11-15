const oss = require('ali-oss');
const dirTraveler = require('dir-traveler');
const path = require('path');
const fs = require('fs');
const co = require('co');
const hasha = require('hasha');
const info = require('debug')('oss-serve');

const LABEL = 'oss-serve:';

const mkDirsSync = p => {
  if(!fs.existsSync(p)) {
    mkDirsSync(path.dirname(p));
    fs.mkdirSync(p);
  }
};

class Serve {
  constructor (options = {}) {
    this._store = oss(options.oss);
    this._destination = options.destination;
    this._baseUrl = options.baseUrl;
  }

  push (root) {
    if(!fs.existsSync(root)) throw new Error('Root is not exists!');
    const files = dirTraveler(root);
    co(function * () {
      // list remote files
      const list = yield this._store.list({
        prefix: this._destination
      });

      const objects = list && list.objects && Array.isArray(list.objects) && list.objects.map(object => object.name) || [];

      // check locale files
      for (let key of Object.keys(files)) {
        const file = files[key];
        const object = this._destination ? [this._destination, key].join('/') : key;

        const index = objects.indexOf(object);
        index >= 0 && objects.splice(index, 1);

        let needUpdate = false;

        // check file meta;
        try {
          const result = yield this._store.head(object);
          if (result.meta.hash) {
            const hash = yield hasha.fromFile(file, { algorithm: 'md5' });
            if (hash !== result.meta.hash) needUpdate = true;
          }
        } catch (err) {
          // file not exists
          info(`Head file '${object}' failed with error: ${err.message}`);
          if (err.status === 404) needUpdate = true;
        }

        // update file
        try {
          if (needUpdate) {
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

      for (let object of objects) {
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
        const object = [this._destination, 'index.html'].join('/');
        yield this._store.get(object);

        console.log(LABEL, `Open link ${this._store.getObjectUrl(object, this._baseUrl)} in browser to view.`);
      } catch (err) {
        // index.html do not exists;
        console.warn(LABEL, 'File index.html should serve.');
      }

    }.bind(this)).catch(err => console.error(LABEL, err.message));
  }

  pull (root) {
    co(function * () {
      // list remote files
      const list = yield this._store.list({
        prefix: this._destination
      });

      const objects = list && list.objects && Array.isArray(list.objects) && list.objects.map(object => object.name) || [];
      // get files from remote;
      for (let object of objects) {
        if(object.slice(-1) === '/') continue;
        const file = path.resolve(root, path.relative(this._destination, object));
        const dir = path.dirname(file);
        mkDirsSync(dir);
        yield this._store.get(object, file);
        console.log(LABEL, `Fetched file '${object}' success!`);
      }
    }.bind(this)).catch(err => console.error(LABEL, err.message));
  }
}

module.exports = Serve;