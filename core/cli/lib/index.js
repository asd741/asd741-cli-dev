'use strict';

module.exports = core;
const pkg = require('../package.json')
const log = require('@asd741-cli-dev/log')
function core() {
  checkPkgVersion()
}
function checkPkgVersion(){
  console.log(pkg.version);
  log()
}