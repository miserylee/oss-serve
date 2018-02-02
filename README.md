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

### Contributing
- Fork this Repo first
- Clone your Repo
- Install dependencies by `$ npm install`
- Checkout a feature branch
- Feel free to add your features
- Make sure your features are fully tested
- Publish your local branch, Open a pull request
- Enjoy hacking <3

### MIT license
Copyright (c) 2016 Misery Lee &lt;miserylee@foxmail.com&gt;

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the &quot;Software&quot;), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED &quot;AS IS&quot;, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.