import 'mocha';
import * as path from 'path';
import Serve from '../src';
const keys = require('./keys.json');

const serve = new Serve({
  oss: {
    accessKeyId: keys.accessKeyId,
    accessKeySecret: keys.accessKeySecret,
    bucket: '8ddao-web',
    region: 'oss-cn-shenzhen',
  },
  destination: 'demo',
  baseUrl: 'https://s.8ddao.com',
});

describe('Serve', function() {
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
