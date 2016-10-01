const oss = require('ali-oss');
const dirTraveler = require('dir-traveler');
const path = require('path');
const fs = require('fs');
const co = require('co');
const hasha = require('hasha');
const info = require('debug')('oss-serve');

const LABEL = 'oss-serve:';

module.exports = function (options = {}) {

  const store = oss(options.oss);

  if (!options.root) throw new Error('Should set destination & root!');

  const files = dirTraveler(options.root);

  co(function * () {
    // list remote files
    const list = yield store.list({
      prefix: options.destination
    });

    const objects = list.objects.map(object => object.name);
    
    // check locale files
    for (let key of Object.keys(files)) {
      const file = files[key];
      const object = [options.destination, key].join('/');

      objects.splice(objects.indexOf(object), 1);
      
      let needUpdate = false;

      // check file meta;
      try {
        const result = yield store.head(object);
        if(result.meta.hash) {
          const hash = yield hasha.fromFile(file, { algorithm: 'md5' });
          if(hash !== result.meta.hash) needUpdate = true;
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

          yield store.put(object, file, {
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

    for(let object of objects) {
      try {
        console.log(LABEL, `File '${object}' need to remove.`);
        yield store.delete(object);
        console.log(LABEL, `File '${object}' delete success!`);
      } catch (err) {
        // delete file failed
        console.error(LABEL, `Delete file '${object}' failed with error: ${err.message}`);
      }
    }

    try {
      const object = [options.destination, 'index.html'].join('/');
      yield store.get(object);

      console.log(LABEL, `Open link ${store.getObjectUrl(object, options.baseUrl)} in browser to view.`);
    } catch (err) {
      // index.html do not exists;
      console.warn(LABEL, 'File index.html should serve.');
    }

  }).catch(err => console.error(LABEL, err.message));


};