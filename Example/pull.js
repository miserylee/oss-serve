const path = require('path');
const serve = require('./serve');

serve.pull(path.resolve(__dirname, 'backup'));