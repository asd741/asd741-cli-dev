'use strict';
module.exports = core;
const path = require('path')
const semver = require('semver')
const userHome = require('user-home')
const log = require('@asd741-cli-dev/log')
const constant = require('./const')
const colors = require('colors/safe')
const pkg = require('../package.json')
let args,config;

// 声明 pathExists 作为公共函数
let pathExists;
(async function() {
  const pathExistsModule = await import('path-exists');
  pathExists = pathExistsModule.pathExists;
})();

async function core() {
  try {
    checkPkgVersion()
    checkNodeVersion()
    checkRoot()
    checkUserHome()
    checkInputArgs();
    checkEnv();
    await checkGlobalUpdate();
  } catch (e) {
    log.error(e.message)
  }
}
async function checkGlobalUpdate() {
  const currentVersion = pkg.version;
  const npmName = pkg.name;
  const { getNpmSemverVersions } = require('@asd741-cli-dev/get-npm-info');
  const lastVersion = await getNpmSemverVersions( currentVersion,npmName);
  if(lastVersion && semver.gt(lastVersion,currentVersion)){
    log.warn('更新提示',colors.yellow(`請手動更新${npmName},当前版本${currentVersion},最新版本${lastVersion},更新命令: npm install -g ${npmName}`));
  }
  console.log(lastVersion);
}

function checkEnv() {
  const dotenv = require('dotenv')
  const dotenvPath = path.resolve(userHome, '.env')
  if(pathExists && pathExists.sync(dotenvPath)){
    dotenv.config({
      path: path.resolve(userHome, '.env')
    });
  }
  config = createDefaultConfig()
  log.verbose('環境變數',process.env.CLI_HOME_PATH)
}
function createDefaultConfig(){
  const cliConfig = {
    home:userHome
  }
  if(process.env.CLI_HOME){
    cliConfig['cliHome'] = path.join(userHome, process.env.CLI_HOME)
  }else{
    cliConfig['cliHome'] = path.join(userHome, constant.DEFAULT_CLI_HOME)
  }
  process.env.CLI_HOME_PATH = cliConfig.cliHome;
  return cliConfig
}
function checkInputArgs() {
  const minimist = require('minimist');
  args = minimist(process.argv.slice(2));
  checkArgs(args)
}

function checkArgs() {
  if (args.debug) {
    process.env.LOG_LEVEL = 'verbose'
  } else {
    process.env.LOG_LEVEL = 'info'
  }
  log.level = process.env.LOG_LEVEL
}

async function checkUserHome() {
  if (!userHome) {
    throw new Error(colors.red('當前登入用戶主目錄不存在'))
  }
  
  if (pathExists) {
    const exists = await pathExists(userHome);
    if (!exists) {
      throw new Error(colors.red('當前登入用戶主目錄不存在'))
    }
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