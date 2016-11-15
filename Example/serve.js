
const Serve = require('../');
const keys = require('./keys.json');

module.exports = new Serve({
  oss: {
    accessKeyId: keys.AccessKeyID,
    accessKeySecret: keys.AccessKeySecret,
    bucket: '8ddao-web',
    region: 'oss-cn-shenzhen'
  },
  destination: 'demo',
  baseUrl: 'https://s.8ddao.com'
});
