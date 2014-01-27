var expect = require('chai').expect;
var _ = require('lodash');
var requireDirectory = require('require-directory');

describe('Courses', function() {
  var courseMap = requireDirectory(module, 'courses');

  _.each(courseMap, function(course, filename) {
    describe(filename + ': ', function() {
      it('only contains whitelisted fields', function() {
        expect([
          'id',
          'title',
          'description',
          'units',
          'prerequisites',
          'corequisites',
          'crnc'
        ]).to.include.members(Object.keys(course));
      });

      it('has id equal to filename (minus extension)', function() {
        expect(course.id).to.equal(filename);
      });

      it('has a title', function() {
        expect(course.title).to.exist;
      });

      it('has a description', function() {
        expect(course.description).to.exist;
      });

      it('requires a 0 or positive number for units', function() {
        expect(parseInt(course.units, 10)).to.be.at.least(0);
      });
    });
  });
});
