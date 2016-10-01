
const ossServe = require('../');
const keys = require('./keys.json');
const path = require('path');

ossServe({
  oss: {
    accessKeyId: keys.AccessKeyID,
    accessKeySecret: keys.AccessKeySecret,
    bucket: '8ddao-web',
    region: 'oss-cn-shenzhen'
  },
  destination: 'demo',
  root: path.resolve(__dirname, 'dist'),
  baseUrl: 'https://s.8ddao.com'
});