#!/usr/bin/env node
var path = require('path');
var jsonfile = require('jsonfile');
var program = require('commander');
var semver = require('semver');
var chalk = require('chalk');
var version = require('../package.json').version;
var MANIFEST_DEFAULTS = ['package.json', 'bower.json'];

function list(val) {
  return val.split(',').map(function(str) {
    return str.trim();
  });
}

function getManifestPath(filename) {
  return path.join(process.cwd(), filename);
}

program
  .version(version)
  .option('--patch', 'Whether to increment the patch number')
  .option('--minor', 'Whether to increment the minor number')
  .option('--major', 'Whether to increment the major number')
  .option('-m, --manifests <manifests>', 'A comma separated list of manifest files to bump. Default package.json and bower.json', list)
  .parse(process.argv);

var bump = 'patch';
if (program.minor) {
  bump = 'minor';
} else if (program.major) {
  bump = 'major';
}

var manifestFiles = program.manifests || MANIFEST_DEFAULTS;
var manifests = {};
var previousVersion;
var manifestsFound = false;
manifestFiles.forEach(function(file) {
  try {
    manifests[file] = require(getManifestPath(file));
    manifestsFound = true;
  } catch (e) {
    return;
  }
  if (!previousVersion) {
    previousVersion = manifests[file].version;
  } else if (previousVersion !== manifests[file].version) {
    throw new Error('Package versions are different!');
  }
});

if (!manifestsFound) {
  return console.log(chalk.red('No manifest files could be found in this directory!'));
}

manifestFiles.forEach(function(file) {
  if (manifests[file]) {
    var originalVersion = manifests[file].version;
    var newVersion = semver.inc(manifests[file].version, bump);
    manifests[file].version = newVersion;
    jsonfile.writeFileSync(getManifestPath(file), manifests[file], {spaces: 2});
    console.log(
      chalk.green('Bumping version of %s from %s to %s'),
      chalk.bold(file),
      chalk.bold(originalVersion),
      chalk.bold(newVersion)
    );
  }
});
