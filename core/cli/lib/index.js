'use strict';
module.exports = core;
const semver = require('semver')
const userHome = require('user-home')
const pathExists = require('path-exists').sync;
const log = require('@asd741-cli-dev/log')
const constant = require('./const')
const colors = require('colors/safe')
const pkg = require('../package.json')
function core() {
  try {
    checkPkgVersion()
    checkNodeVersion()
    checkRoot()
    checkUserHome()
  } catch (e) {
    log.error(e.message)
  }
}
function checkUserHome(){
  if(!userHome||!pathExists(userHome)){
    throw new Error(colors.red('當前登入用戶主目錄不存在'))
  }
}
async function checkRoot() {
  const sudoBlock = await import('sudo-block')
  sudoBlock.default()
  const isWindows = process.platform === 'win32';
  if (isWindows) {
    // Windows 系統：使用 sudo-block
    const sudoBlock = await import('sudo-block')
    sudoBlock.default()
  } else {
    // POSIX 系統（Linux/macOS）：使用 root-check
    const rootCheck = await import('root-check')
    rootCheck.default()
  }
}
function checkNodeVersion() {
  const curVersion = process.version;
  const lowestVersion = constant.LOWSET_NODE_VERSION;
  if (!semver.gte(curVersion, lowestVersion)) {
    throw new Error(colors.reset(`当前Node.js版本${curVersion}低于最低要求${lowestVersion}`));
  }
}
function checkPkgVersion() {
  log.notice('cli', pkg.version);
}