var expect = require('chai').expect;
var _ = require('lodash');

describe('Units', function() {
  var unitMap = require('..').units;

  _.each(unitMap, function(unit, filename) {
    describe(filename + ': ', function() {
      it('only contains whitelisted fields', function() {
        expect([
          'prefix',
          'title',
          'courses'
        ]).to.include.members(Object.keys(unit));
      });

      it('has prefix equal to filename (minus extension)', function() {
        expect(unit.prefix).to.equal(filename);
      });

      it('has a title', function() {
        expect(unit.title).to.exist;
      });

      it('has a course list', function() {
        expect(unit.courses).to.be.an('array').and.not.be.empty;
      });
    });
  });
});
