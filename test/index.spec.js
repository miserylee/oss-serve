"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("mocha");
const path = require("path");
const src_1 = require("../src");
const keys = require('./keys.json');
const serve = new src_1.default({
    oss: {
        accessKeyId: keys.accessKeyId,
        accessKeySecret: keys.accessKeySecret,
        bucket: '8ddao-web',
        region: 'oss-cn-shenzhen',
    },
    destination: 'demo',
    baseUrl: 'https://s.8ddao.com',
});
describe('Serve', function () {
    this.timeout(10000);
    it('push should success', done => {
        serve.push(path.resolve(__dirname, 'dist'), err => {
            done(err);
        });
    });
    it('pull should success', done => {
        serve.pull(path.resolve(__dirname, 'backup'), err => {
            done(err);
        });
    });
});
//# sourceMappingURL=index.spec.js.map