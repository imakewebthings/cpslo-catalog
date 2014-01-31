var fs = require('fs');
var path = require('path');
var request = require('request');
var cheerio = require('cheerio');
var command = process.argv[2];
var unitEndpoint = 'http://catalog.calpoly.edu/coursesaz/';
var $;

switch (command) {
  case 'all':
    parseUnitList();
    break;
  case 'unit':
    parseUnitCourses(process.argv[3]);
    break;
  default:
    printUsage();
}

function printUsage() {
  console.log('Usage:');
  console.log('  node scraper.js all');
  console.log('  node scraper.js unit CODE');
}

function parseUnitList() {
  request(unitEndpoint, function(err, response, html) {
    if (err) throw err;
    var $ = cheerio.load(html);
    $('#tbl-coursesaz .sitemaplink').each(function() {
      var unit = $(this).text().match(/\((.*)\)/)[1].toLowerCase();
      parseUnitCourses(unit);
    });
  });
}

function parseUnitCourses(unit) {
  request(unitEndpoint + unit, function(err, response, html) {
    if (err || response.statusCode !== 200) {
      return console.log('Unit' + unit + ' not found.')
    }
    $ = cheerio.load(html);
    $('.courseblock').each(function() {
      saveCourse(parseCourse($(this)));
    });
    saveUnit(parseUnit($));
  });
}

function saveCourse(course) {
  var filename = path.resolve('courses', course.id + '.json');
  fs.writeFileSync(filename, JSON.stringify(course, null, 2));
  console.log('COURSE: ' + course.id + ' generated.');
}

function parseCourse($element) {
  return {
    id: parseCourseId($element),
    title: parseCourseTitle($element),
    description: parseCourseDescription($element),
    units: parseCourseUnits($element),
    prerequisites: parseCoursePrerequisites($element),
    corequisites: parseCourseCorequisites($element),
    recommended: parseCourseRecommended($element),
    ges: parseCourseGes($element),
    crnc: parseCourseCrnc($element),
    gwr: parseCourseGwr($element),
    uscp: parseCourseUscp($element)
  };
}

function parseCourseId($element) {
  var id = $element.find('.courseblocktitle p').text().split('.')[0];
  return id.replace(/\W/, '-').toLowerCase();
}

function parseCourseTitle($element) {
  var title = $element.find('.courseblocktitle p').text().split('.')[1];
  return title.trim();
}

function parseCourseDescription($element) {
  return $element.find('.courseblockdesc p').text().replace(/  /g, ' ');
}

function parseCourseUnits($element) {
  return $element.find('.courseblockhours').text().split(' ')[0];
}

function parseCourseExtendedString($element, precursor) {
  var string = null;
  $element.find('.courseextendedwrap p').each(function() {
    var text = $(this).text();
    if (text.indexOf(precursor) > -1) {
      string = text.split(precursor)[1].split('.')[0].trim();
    }
  });
  return string;
}

function parseCoursePrerequisites($element) {
  return parseCourseExtendedString($element, 'Prerequisite:');
}

function parseConcurrents($element) {
  var string = null;
  $element.find('.courseextendedwrap p').each(function() {
    var text = $(this).text();
    var match = text.match(/Concurrent.*:(.*)\./);
    if (match) {
      string = match[1].trim();
    }
  });
  return string;
}

function parseCourseCorequisites($element) {
  var coreqs = parseCourseExtendedString($element, 'Corequisite:');
  var concurrents = parseConcurrents($element);
  return coreqs || concurrents;
}

function parseCourseRecommended($element) {
  return parseCourseExtendedString($element, 'Recommended:');
}

function parseExtendedBoolean($element, word) {
  var match = false;
  $element.find('.courseextendedwrap p').each(function() {
    if ($(this).text().indexOf(word) > -1) {
      match = true;
    }
  });
  return match;
}

function parseCourseGes($element) {
  var ges = [];
  $element.find('.courseextendedwrap p').each(function() {
    var text = $(this).text();
    if (text.indexOf('GE Area') === 0) {
      ges = text.split(';').map(function(area) {
        return area.replace(/GE Area/, '').trim();
      });
    }
  });
  return ges;
}

function parseCourseCrnc($element) {
  return parseExtendedBoolean($element, 'CR/NC');
}

function parseCourseGwr($element) {
  return parseExtendedBoolean($element, 'GWR');
}

function parseCourseUscp($element) {
  return parseExtendedBoolean($element, 'USCP');
}

function saveUnit(unit) {
  var filename = path.resolve('units', unit.prefix + '.json');
  fs.writeFileSync(filename, JSON.stringify(unit, null, 2));
  console.log('UNIT: ' + unit.prefix + ' generated.');
}

function parseUnit($) {
  return {
    prefix: parseUnitPrefix($),
    title: parseUnitTitle($),
    courses: parseUnitCourseList($)
  };
}

function parseUnitPrefix($) {
  return $('#secondary-tabs .lastitem').text().trim().toLowerCase();
}

function parseUnitTitle($) {
  return $('.courses h3').text().replace(' Courses', '');
}

function parseUnitCourseList($) {
  var courseList = [];
  $('.courseblock').each(function() {
    courseList.push(parseCourseId($(this)));
  });
  return courseList;
}
