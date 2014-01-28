var fs = require('fs');
var path = require('path');
var request = require('request');
var cheerio = require('cheerio');
var command = process.argv[2];
var departmentEndpoint = 'http://catalog.calpoly.edu/coursesaz/';
var $;

switch (command) {
  case 'all':
    parseDepartmentList();
    break;
  case 'dept':
    parseDepartmentCourses(process.argv[3]);
    break;
  default:
    printUsage();
}

function printUsage() {
  console.log('Usage:');
  console.log('  node scraper.js all');
  console.log('  node scraper.js dept CODE');
}

function parseDepartmentList() {
  request(departmentEndpoint, function(err, response, html) {
    if (err) throw err;
    var $ = cheerio.load(html);
    $('#tbl-coursesaz .sitemaplink').each(function() {
      var department = $(this).text().match(/\((.*)\)/)[1].toLowerCase();
      parseDepartmentCourses(department);
    });
  });
}

function parseDepartmentCourses(department) {
  request(departmentEndpoint + department, function(err, response, html) {
    if (err || response.statusCode !== 200) {
      return console.log('Department ' + department + ' not found.')
    }
    $ = cheerio.load(html);
    $('.courseblock').each(function() {
      saveCourse(parseCourse($(this)));
    });
  });
}

function saveCourse(course) {
  var filename = path.resolve('courses', course.id + '.json');
  fs.writeFileSync(filename, JSON.stringify(course, null, 2));
  console.log(filename + ' generated.');
}

function parseCourse($element) {
  return {
    id: parseCourseId($element),
    title: parseCourseTitle($element),
    description: parseCourseDescription($element),
    units: parseCourseUnits($element),
    prerequisites: parseCoursePrerequisites($element),
    corequisites: parseCourseCorequisites($element),
    crnc: parseCourseCrnc($element)
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

function parseCoursePrerequisites($element) {
  var prereqs = null;
  $element.find('.courseextendedwrap p').each(function() {
    var text = $(this).text();
    if (text.indexOf('Prerequisite:') > -1) {
      prereqs = text.split('Prerequisite: ')[1].split('.')[0];
    }
  });
  return prereqs;
}

function parseCourseCorequisites($element) {
  var coreqs = null;
  $element.find('.courseextendedwrap p').each(function() {
    var text = $(this).text();
    if (text.indexOf('Corequisite:') > -1) {
      coreqs = text.split('Corequisite: ')[1].split('.')[0];
    }
  });
  return coreqs;
}

function parseCourseCrnc($element) {
  var crnc = false;
  $element.find('courseextendedwrap p').each(function() {
    if ($(this).text() === 'CR/NC') {
      crnc = true;
    }
  });
  return crnc;
}
