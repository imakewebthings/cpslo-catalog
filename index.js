var requireDirectory = require('require-directory');
var path = require('path');

module.exports = {
  courses: requireDirectory(module, path.resolve(__dirname, 'courses'))
};
