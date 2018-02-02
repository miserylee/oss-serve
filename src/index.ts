import * as ossClient from 'ali-oss';
import * as co from 'co';
import * as dirTraveler from 'dir-traveler';
import * as fs from 'fs';
import * as hasha from 'hasha';
import * as multimatch from 'multimatch';
import * as path from 'path';

const LABEL = 'oss-serve:';

function mkDirsSync(p: string): void {
  if (!fs.existsSync(p)) {
    mkDirsSync(path.dirname(p));
    fs.mkdirSync(p);
  }
}

export interface IOptions {
  oss: {
    accessKeyId: string,
    accessKeySecret: string,
    bucket: string,
    region: string,
  };
  destination?: string;
  match?: string[];
  baseUrl: string;
}

interface IStore {
  head(object: string): Iterable<{
    meta: {
      hash: string,
    },
  }>;

  list(opts: {
    prefix: string,
  }): Iterable<IList>;

  put(object: string, file: string, opts: {
    meta: { hash: object };
  }): Iterable<void>;

  get(object: string, file: string): Iterable<void>;

  getObjectUrl(object: string, baseUrl: string): string,
}

interface IList {
  objects: Array<{
    name: string;
  }>;
}

export type callback = (error?: Error) => void | undefined;

export default class Serve {
  private _store: IStore;
  private _destination: string;
  private _match: string[];
  private _baseUrl: string;

  constructor({ oss, destination = '', match = ['**'], baseUrl }: IOptions) {
    this._store = ossClient(oss);
    this._destination = destination;
    this._match = match;
    this._baseUrl = baseUrl;
  }

  public push(root: string, cb: callback = _ => undefined) {
    if (!fs.existsSync(root)) {
      throw new Error('Root is not exists!');
    }
    (async _ => {
      const files = dirTraveler(root);
      // list remote files
      const list = await this._storeList({
        prefix: this._destination,
      });

      const keys = this._filterObjects(list);
      // check locale files
      const localKeys = multimatch(Object.keys(files), this._match);
      for (const key of localKeys) {
        const file = files[key];
        const object = this._keyToObject(key);

        const index = keys.indexOf(key);
        if (index >= 0) {
          keys.splice(index, 1);
        }

        // update file
        try {
          if (await this._checkFileMata(file, object)) {
            console.log(LABEL, `Remote file '${object}' need to update.`);

            const hash = await hasha.fromFile(file, { algorithm: 'md5' });

            await this._storePut(object, file, {
              meta: { hash },
            });
            console.log(LABEL, `Remote file '${object}' update success!`);
          } else {
            console.log(LABEL, `Remote file '${object}' is fresh.`);
          }
        } catch (err) {
          // update file failed;
          console.error(LABEL, `Update remote file '${object}' failed with error: ${err.message}`);
        }
      }

      for (const key of keys) {
        const object = this._keyToObject(key);
        try {
          console.log(LABEL, `Remote file '${object}' need to remove.`);
          await  this._storeDelete(object);
          console.log(LABEL, `Remote file '${object}' removed success!`);
        } catch (err) {
          // delete file failed
          console.error(LABEL, `Delete remote file '${object}' failed with error: ${err.message}`);
        }
      }

      try {
        const object = this._keyToObject('index.html');
        await this._storeGet(object);

        console.log(LABEL, `Open link ${this._store.getObjectUrl(object, this._baseUrl)} in browser to view.`);
      } catch (err) {
        // index.html do not exists;
        console.warn(LABEL, 'File index.html should serve.');
      }
    })().then(_ => {
      cb();
    }).catch(err => {
      console.error(LABEL, err.message);
      cb(err);
    });
  }

  public pull(root: string, cb: callback = _ => undefined) {
    (async _ => {
      // list remote files
      const list = await this._storeList({ prefix: this._destination });

      const keys = this._filterObjects(list);
      // get files from remote
      for (const key of keys) {
        if (key.slice(-1) === '/') {
          continue;
        }
        const file = path.resolve(root, key);
        const dir = path.dirname(file);
        mkDirsSync(dir);
        const object = this._keyToObject(key);

        if (await this._checkFileMata(file, object)) {
          await this._storeGet(object, file);
          console.log(LABEL, `Fetched remote file '${object}' success!`);
        } else {
          console.log(LABEL, `Local File '${object}' is fresh.`);
        }
      }
    })().then(_ => {
      cb();
    }).catch(err => {
      console.error(LABEL, err.message);
      cb(err);
    });
  }

  private _filterObjects(list: IList) {
    const objects = list.objects.map(object => {
      return path.relative(this._destination, object.name);
    });
    return multimatch(objects, this._match);
  }

  private _keyToObject(key: string): string {
    return this._destination ? [this._destination, key].join('/') : key;
  }

  private async _checkFileMata(file: string, object: string) {
    // check file me;
    try {
      const result = await this._storeHead(object);
      if (result.meta.hash) {
        if (!fs.existsSync(file)) {
          return true;
        }
        const hash = await hasha.fromFile(file, { algorithm: 'md5' });
        if (hash !== result.meta.hash) {
          return true;
        }
      }
    } catch (err) {
      // file not exists.
      // console.warn(LABEL, `Head file '${object}' failed with error: ${err.message}`);
      if (err.status === 404) { return true; }
    }
    return false;
  }

  private async _storeList(...params) {
    return co(function *() {
      return yield this._store.list(...params);
    }.bind(this));
  }

  private async _storeHead(...params) {
    return co(function *() {
      return yield this._store.head(...params);
    }.bind(this));
  }

  private async _storeGet(...params) {
    return co(function *() {
      return yield this._store.get(...params);
    }.bind(this));
  }

  private async _storePut(...params) {
    return co(function *() {
      return yield this._store.put(...params);
    }.bind(this));
  }

  private async _storeDelete(...params) {
    return co(function *() {
      return yield this._store.delete(...params);
    }.bind(this));
  }
}
