#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import Serve from './index';

const configPath = path.resolve(process.cwd(), 'oss-serve.config.json');
const isConfigFileExists = fs.existsSync(configPath);

let config;
if (isConfigFileExists) {
  config = require(configPath);
} else {
  const pkg = require(path.resolve(process.cwd(), 'package.json'));
  config = pkg.serve;
}

if (!config) {
  throw new Error('No configuration found!');
}

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

const cb = err => {
  if (err) {
    console.error(err);
    process.exit(-1);
  } else {
    process.exit();
  }
};

switch (command) {
  case 'pull':
    serve.pull(pullRoot, cb);
    break;
  case 'push':
  default:
    serve.push(pushRoot, cb);
}
