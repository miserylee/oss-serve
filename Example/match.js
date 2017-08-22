const multimatch = require('multimatch');

const objects = [
  'demo/attach/index.css',
  'demo/attach/index.js',
  'demo/index.html',
  'hello'
];

const match = ['**', '!demo/attach/**', '**/index.js'];

console.log(multimatch(objects, match));