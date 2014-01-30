var requireDirectory = require('require-directory');

module.exports = {
  courses: requireDirectory(module, 'courses')
};
