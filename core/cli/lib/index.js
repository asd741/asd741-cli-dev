'use strict';
module.exports = core;
const path = require('path')
const semver = require('semver')
const userHome = require('user-home')
const log = require('@asd741-cli-dev/log')
const constant = require('./const')
const colors = require('colors/safe')
const pkg = require('../package.json')
// 声明 pathExists 作为公共函数
let pathExists;
(async function() {
  const pathExistsModule = await import('path-exists');
  pathExists = pathExistsModule.pathExists;
})();

async function core() {
  try {
    await prepare();
    registerCommand();

  } catch (e) {
    log.error(e.message)
  }
}

function registerCommand() {
  program
    .name(Object.keys(pkg.bin)[0])
    .usage('<command> [options]')
    .version(pkg.version)
    .option('-d, --debug', '是否开启调试模式', false)
    .option('-tp, --targetPath <targetPath>', '是否指定本地调试文件路径', '');

  program
    .command('init [projectName]')
    .option('-f, --force', '是否强制初始化项目')
    .action(exec);

  program
    .command('add [templateName]')
    .option('-f, --force', '是否强制添加代码')
    .action(exec);

  program
    .command('publish')
    .option('--refreshServer', '强制更新远程Git仓库')
    .option('--refreshToken', '强制更新远程仓库token')
    .option('--refreshOwner', '强制更新远程仓库类型')
    .option('--buildCmd <buildCmd>', '构建命令')
    .option('--prod', '是否正式发布')
    .option('--sshUser <sshUser>', '模板服务器用户名')
    .option('--sshIp <sshIp>', '模板服务器IP或域名')
    .option('--sshPath <sshPath>', '模板服务器上传路径')
    .action(exec);

  // 开启debug模式
  program.on('option:debug', function() {
    if (program.debug) {
      process.env.LOG_LEVEL = 'verbose';
    } else {
      process.env.LOG_LEVEL = 'info';
    }
    log.level = process.env.LOG_LEVEL;
  });

  // 指定targetPath
  program.on('option:targetPath', function() {
    process.env.CLI_TARGET_PATH = program.targetPath;
  });

  // 对未知命令监听
  program.on('command:*', function(obj) {
    const availableCommands = program.commands.map(cmd => cmd.name());
    console.log(colors.red('未知的命令：' + obj[0]));
    if (availableCommands.length > 0) {
      console.log(colors.red('可用命令：' + availableCommands.join(',')));
    }
  });

  program.parse(process.argv);

  if (program.args && program.args.length < 1) {
    program.outputHelp();
    console.log();
  }
}
async function prepare() {
  checkPkgVersion();
  checkRoot();
  checkUserHome();
  checkEnv();
  await checkGlobalUpdate();
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