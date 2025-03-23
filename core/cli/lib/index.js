'use strict';

module.exports = core;
const pkg = require('../package.json')
const log = require('@asd741-cli-dev/log')
function core() {
  console.log('exec core');
}
function checkPkgVersion(){
  console.log(checkPkgVersion.version);
  log()
}