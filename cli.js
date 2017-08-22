#!/usr/bin/env node
const Serve = require('./');
const path = require('path');

const pkg = require(path.resolve(process.cwd(), 'package.json'));

if (!pkg.serve) throw new Error('No configuration found!');
const { accessKeyId, accessKeySecret, bucket, region, match, destination, baseUrl, pushRoot, pullRoot } = pkg.serve;

const serve = new Serve({
  oss: {
    accessKeyId,
    accessKeySecret,
    bucket,
    region
  },
  match,
  destination,
  baseUrl
});

const command = process.argv.slice(2)[0];

switch (command) {
  case 'pull':
    serve.pull(pullRoot).then(_ => process.exit());
    break;
  case 'push':
  default:
    serve.push(pushRoot).then(_ => process.exit());
}
