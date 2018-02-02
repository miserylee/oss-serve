#!/usr/bin/env node
const Serve = require('./');
const path = require('path');
const fs = require('fs');

const configPath = path.resolve(process.cwd(), 'oss-serve.config.json');
const isConfigFileExists = fs.existsSync(configPath);

let config;
if (isConfigFileExists) {
  config = require(configPath);
} else {
  const pkg = require(path.resolve(process.cwd(), 'package.json'));
  config = pkg.serve;
}

if (!config) throw new Error('No configuration found!');

const { accessKeyId, accessKeySecret, bucket, region, match, destination, baseUrl, pushRoot, pullRoot } = config;

const serve = new Serve({
  oss: {
    accessKeyId,
    accessKeySecret,
    bucket,
    region,
  },
  match,
  destination,
  baseUrl,
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
