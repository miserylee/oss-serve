## oss-serve ![NPM version](https://img.shields.io/npm/v/oss-serve.svg?style=flat)



### Installation
```bash
$ yarn add -D oss-serve
```

### Example
```js
const Serve = require('oss-serve');

const serve = new Serve({
  oss: {
    accessKeyId: /* Your AccessKeyID */,
    accessKeySecret: /* Your AccessKeySecret */,
    bucket: /* Your bucket name */,
    region: /* Your bucket region */
  },
  destination: /* Which subdir the bucket you want to serve to */,
  baseUrl: /* The domain you have bind to the bucket */
});

serve.push(path.resolve(__dirname, 'dist'));
serve.pull(path.resolve(__dirname, 'backup'));

// or by cli just set settings in root of project named `oss-serve.config.json` and then run the command.
$ oss-serve
```

### API
#### Serve(options);
##### options
* oss {object} ali-oss options. Check more details [here](https://github.com/ali-sdk/ali-oss#ossoptions)!
* [destination] {string} The subdir of the bucket where to serve the files, if not set means to
serve pages at the root of the bucket.
* [baseUrl] {string} The custom domain bind to the bucket, If not set, default oss domain will be used. Check more details [here](https://github.com/ali-sdk/ali-oss#getobjecturlname-baseurl)!

#### serve.push(root);
Update the remote files by local files;

* root {string} The root path of local files;

#### serve.pull(root);
Update the local files by remote files;

* root {string} The root path of local folder;
