const fs = require('fs');
const path = require('path');
const userHome = require('user-home');
const inquirer = require('inquirer');
const pathExists = require('path-exists');
const pkgUp = require('pkg-up');
const fse = require('fs-extra');
const glob = require('glob');
const ejs = require('ejs');
const semver = require('semver');
const Command = require('@asd741-cli-dev/command');
const Package = require('@asd741-cli-dev/package');
const request = require('@asd741-cli-dev/request');
const log = require('@asd741-cli-dev/log');
const { sleep, spinnerStart, execAsync } = require('@asd741-cli-dev/utils');

const ADD_MODE_SECTION = 'section';
const ADD_MODE_PAGE = 'page';

const TYPE_CUSTOM = 'custom';
const TYPE_NORMAL = 'normal';

process.on('unhandledRejection', e => {
});

class AddCommand extends Command {
  init() {
    // 获取add命令的初始化参数
  }

  async exec() {
    // 代码片段（区块）：以源码形式拷贝的vue组件
    // 1. 选择复用方式
    this.addMode = (await this.getAddMode()).addMode;
    if (this.addMode === ADD_MODE_SECTION) {
      await this.installSectionTemplate();
    } else {
      await this.installPageTemplate();
    }
  }

  getPageTemplate() {
    return request({
      url: '/page/template',
      method: 'get',
    });
  }

  async getSectionTemplate() {
    return request({
      url: '/section/template',
      method: 'get',
    });
  }

  async installSectionTemplate() {
    // 1. 获取页面安装文件夹
    this.dir = process.cwd();
    // 2. 选择代码片段模板
    this.sectionTemplate = await this.getTemplate(ADD_MODE_SECTION);
    // 3. 安装代码片段模板
    // 3.1 检查目录重名问题
    await this.prepare(ADD_MODE_SECTION);
    // 3.2 代码片段模板下载
    await this.downloadTemplate(ADD_MODE_SECTION);
    // 3.3 代码片段安装
    await this.installSection();
  }

  async installPageTemplate() {
    // 1. 获取页面安装文件夹
    this.dir = process.cwd();
    // 2. 选择页面模板
    this.pageTemplate = await this.getTemplate();
    // 3. 安装页面模板
    // 3.0 预检查（目录重名问题）
    await this.prepare();
    // 3.1 下载页面模板至缓存目录
    await this.downloadTemplate();
    // 3.2 将页面模板拷贝至指定目录
    // 4. 合并页面模板依赖
    // 5. 页面模板安装完成
    await this.installTemplate();
  }

  getAddMode() {
    return inquirer.prompt({
      type: 'list',
      name: 'addMode',
      message: '请选择代码复用模式',
      choices: [{
        name: '代码片段',
        value: ADD_MODE_SECTION,
      }, {
        name: '页面模板',
        value: ADD_MODE_PAGE,
      }],
    });
  }

  async installSection() {
    // 1. 选择要插入的源码文件
    const files = fs.readdirSync(this.dir, { withFileTypes: true })
      .map(file => file.isFile() ? file.name : null)
      .filter(_ => _)
      .map(file => ({ name: file, value: file }));
    if (files.length === 0) {
      throw new Error('当前文件夹下没有文件！');
    }
    const codeFile = (await inquirer.prompt({
      type: 'list',
      message: '请选择要插入代码片段的源码文件',
      name: 'codeFile',
      choices: files,
    })).codeFile;
    // 2. 需要用户输入插入行数
    const lineNumber = (await inquirer.prompt({
      type: 'input',
      message: '请输入要插入的行数',
      name: 'lineNumber',
      validate: function(value) {
        const done = this.async();
        if (!value || !value.trim()) {
          done('插入的行数不能为空');
        } else if (value >= 0 && Math.floor(value) === Number(value)) {
          done(null, true);
        } else {
          done('插入的行数必须为整数');
        }
      },
    })).lineNumber;
    log.verbose('codeFile:', codeFile);
    log.verbose('lineNumber:', lineNumber);
    // 3. 对源码文件进行分割成数组
    const codeFilePath = path.resolve(this.dir, codeFile);
    const codeContent = fs.readFileSync(codeFilePath, 'utf-8');
    const codeContentArr = codeContent.split('\n');
    // 4. 以组件形式插入代码片段
    const componentName = this.sectionTemplate.sectionName.toLocaleLowerCase();
    const componentNameOriginal = this.sectionTemplate.sectionName;
    codeContentArr.splice(lineNumber, 0, `<${componentName}></${componentName}>`);
    // 5. 插入代码片段的import语句
    const scriptIndex = codeContentArr.findIndex(code => code.replace(/\s/g, '') === '<script>');
    codeContentArr.splice(scriptIndex + 1, 0, `import ${componentNameOriginal} from './components/${componentNameOriginal}/index.vue'`);
    log.verbose('codeContentArr', codeContentArr);
    // 6. 将代码还原为string
    const newCodeContent = codeContentArr.join('\n');
    fs.writeFileSync(codeFilePath, newCodeContent, 'utf-8');
    log.success('代码片段写入成功');
    // 7. 创建代码片段组件目录
    fse.ensureDirSync(this.targetPath);
    const templatePath = path.resolve(this.sectionTemplatePackage.cacheFilePath, 'template', this.sectionTemplate.targetPath ? this.sectionTemplate.targetPath : '');
    const targetPath = this.targetPath;
    fse.copySync(templatePath, targetPath);
    log.success('代码片段拷贝成功');
  }

  async installTemplate() {
    log.info('正在安装页面模板');
    log.verbose('pageTemplate', this.pageTemplate);
    // 模板路径
    const templatePath = path.resolve(this.pageTemplatePackage.cacheFilePath, 'template', this.pageTemplate.targetPath);
    // 目标路径
    const targetPath = this.targetPath;
    if (!await pathExists(templatePath)) {
      throw new Error('页面模板不存在！');
    }
    log.verbose('templatePath', templatePath);
    log.verbose('targetPath', targetPath);
    fse.ensureDirSync(templatePath);
    fse.ensureDirSync(targetPath);
    if (this.pageTemplate.type === TYPE_CUSTOM) {
      await this.installCustomPageTemplate({ templatePath, targetPath });
    } else {
      await this.installNormalPageTemplate({ templatePath, targetPath });
    }
  }

  async installCustomPageTemplate({ templatePath, targetPath }) {
    // 1. 获取自定义模板的入口文件
    const rootFile = this.pageTemplatePackage.getRootFilePath();
    if (fs.existsSync(rootFile)) {
      log.notice('开始执行自定义模板');
      const options = {
        templatePath,
        targetPath,
        pageTemplate: this.pageTemplate,
      };
      const code = `require('${rootFile}')(${JSON.stringify(options)})`;
      await execAsync('node', ['-e', code], { stdio: 'inherit', cwd: process.cwd() });
      log.success('自定义模板安装成功');
    } else {
      throw new Error('自定义模板入口文件不存在！');
    }
  }

  async installNormalPageTemplate({ templatePath, targetPath }) {
    fse.copySync(templatePath, targetPath);
    await this.ejsRender({ targetPath });
    await this.dependenciesMerge({ templatePath, targetPath });
    log.success('安装页面模板成功');
  }

  async ejsRender(options) {
    const { targetPath } = options;
    const pageTemplate = this.pageTemplate;
    const { ignore } = pageTemplate;
    return new Promise((resolve, reject) => {
      glob('**', {
        cwd: targetPath,
        nodir: true,
        ignore: ignore || '',
      }, function(err, files) {
        log.verbose('files', files);
        if (err) {
          reject(err);
        } else {
          Promise.all(files.map(file => {
            // 获取文件的真实路径
            const filePath = path.resolve(targetPath, file);
            return new Promise((resolve1, reject1) => {
              // ejs文件渲染，重新拼接render的参数
              ejs.renderFile(filePath, {
                name: pageTemplate.pageName.toLocaleLowerCase(),
              }, {}, (err, result) => {
                if (err) {
                  reject1(err);
                } else {
                  // 重新写入文件信息
                  fse.writeFileSync(filePath, result);
                  resolve1(result);
                }
              });
            });
          }))
            .then(resolve)
            .catch(e => reject(e));
        }
      });
    });
  }

  async dependenciesMerge(options) {
    function objToArray(o) {
      const arr = [];
      Object.keys(o).forEach(key => {
        arr.push({
          key,
          value: o[key],
        });
      });
      return arr;
    }

    function arrayToObj(arr) {
      const o = {};
      arr.forEach(item => o[item.key] = item.value);
      return o;
    }

    function depDiff(templateDepArr, targetDepArr) {
      let finalDep = [...targetDepArr];
      // 1.场景1：模板中存在依赖，项目中不存在（拷贝依赖）
      // 2.场景2：模板中存在依赖，项目也存在（不会拷贝依赖，但是会在脚手架中给予提示，让开发者手动进行处理）
      templateDepArr.forEach(templateDep => {
        const duplicatedDep = targetDepArr.find(targetDep => templateDep.key === targetDep.key);
        if (duplicatedDep) {
          log.verbose('查询到重复依赖：', duplicatedDep);
          const templateRange = semver.validRange(templateDep.value).split('<')[1];
          const targetRange = semver.validRange(duplicatedDep.value).split('<')[1];
          if (templateRange !== targetRange) {
            log.warn(`${templateDep.key}冲突，${templateDep.value} => ${duplicatedDep.value}`);
          }
        } else {
          log.verbose('查询到新依赖：', templateDep);
          finalDep.push(templateDep);
        }
      });
      return finalDep;
    }

    // 处理依赖合并问题
    // 1. 获取package.json
    const { templatePath, targetPath } = options;
    const templatePkgPath = pkgUp.sync({ cwd: templatePath });
    const targetPkgPath = pkgUp.sync({ cwd: targetPath });
    const templatePkg = fse.readJsonSync(templatePkgPath);
    const targetPkg = fse.readJsonSync(targetPkgPath);
    // 2. 获取dependencies
    const templateDep = templatePkg.dependencies || {};
    const targetDep = targetPkg.dependencies || {};
    // 3. 将对象转化为数组
    const templateDepArr = objToArray(templateDep);
    const targetDepArr = objToArray(targetDep);
    // 4. 实现dep之间的diff
    const newDep = depDiff(templateDepArr, targetDepArr);
    targetPkg.dependencies = arrayToObj(newDep);
    fse.writeJsonSync(targetPkgPath, targetPkg, { spaces: 2 });
    // 5. 自动安装依赖
    log.info('正在安装页面模板的依赖');
    await this.execCommand('npm install', path.dirname(targetPkgPath));
    log.success('安装页面模板依赖成功');
  }

  async execCommand(command, cwd) {
    let ret;
    if (command) {
      // npm install => [npm, install] => npm, [install]
      const cmdArray = command.split(' ');
      const cmd = cmdArray[0];
      const args = cmdArray.slice(1);
      ret = await execAsync(cmd, args, {
        stdio: 'inherit',
        cwd,
      });
    }
    if (ret !== 0) {
      throw new Error(command + ' 命令执行失败');
    }
    return ret;
  }

  async prepare(addMode = ADD_MODE_PAGE) {
    // 生成最终拷贝路径
    if (addMode === ADD_MODE_PAGE) {
      this.targetPath = path.resolve(this.dir, this.pageTemplate.pageName);
    } else {
      this.targetPath = path.resolve(this.dir, 'components', this.sectionTemplate.sectionName);
    }
    if (await pathExists(this.targetPath)) {
      throw new Error('页面文件夹已经存在');
    }
  }

  async downloadTemplate(addMode = ADD_MODE_PAGE) {
    // 获取模板名称
    const name = addMode === ADD_MODE_PAGE ? '页面' : '代码片段';
    // 缓存文件夹
    const targetPath = path.resolve(userHome, '.asd741-cli-dev', 'template');
    // 缓存真实路径
    const storeDir = path.resolve(targetPath, 'node_modules');
    const { npmName, version } = addMode === ADD_MODE_PAGE ? this.pageTemplate : this.sectionTemplate;
    // 构建Package对象
    const templatePackage = new Package({
      targetPath,
      storeDir,
      packageName: npmName,
      packageVersion: version,
    });
    // 页面模板是否存在
    if (!await templatePackage.exists()) {
      const spinner = spinnerStart('正在下载' + name + '模板...');
      await sleep();
      // 下载页面模板
      try {
        await templatePackage.install();
      } catch (e) {
        throw e;
      } finally {
        spinner.stop(true);
        if (await templatePackage.exists()) {
          log.success('下载' + name + '模板成功');
          if (addMode === ADD_MODE_PAGE) {
            this.pageTemplatePackage = templatePackage;
          } else {
            this.sectionTemplatePackage = templatePackage;
          }
        }
      }
    } else {
      const spinner = spinnerStart('正在更新' + name + '模板...');
      await sleep();
      // 更新页面模板
      try {
        await templatePackage.update();
      } catch (e) {
        throw e;
      } finally {
        spinner.stop(true);
        if (await templatePackage.exists()) {
          log.success('更新' + name + '模板成功');
          if (addMode === ADD_MODE_PAGE) {
            this.pageTemplatePackage = templatePackage;
          } else {
            this.sectionTemplatePackage = templatePackage;
          }
        }
      }
    }
  }

  async getTemplate(addMode = ADD_MODE_PAGE) {
    const name = addMode === ADD_MODE_PAGE ? '页面' : '代码片段';
    // 通过API获取模板列表
    if (addMode === ADD_MODE_PAGE) {
      const pageTemplateData = await this.getPageTemplate();
      this.pageTemplateData = pageTemplateData;
    } else {
      const sectionTemplateData = await this.getSectionTemplate();
      this.sectionTemplateData = sectionTemplateData;
    }
    const TEMPLATE = addMode === ADD_MODE_PAGE ? this.pageTemplateData : this.sectionTemplateData;
    const pageTemplateName = (await inquirer.prompt({
      type: 'list',
      name: 'pageTemplate',
      message: '请选择' + name + '模板',
      choices: this.createChoices(addMode),
    })).pageTemplate;
    // 2.1 输入页面名称
    const pageTemplate = TEMPLATE.find(item => item.npmName === pageTemplateName);
    if (!pageTemplate) {
      throw new Error(name + '模板不存在！');
    }
    const { pageName } = await inquirer.prompt({
      type: 'input',
      name: 'pageName',
      message: '请输入' + name + '名称',
      default: '',
      validate: function(value) {
        const done = this.async();
        if (!value || !value.trim()) {
          done('请输入页面名称');
          return;
        }
        done(null, true);
      },
    });
    if (addMode === ADD_MODE_PAGE) {
      pageTemplate.pageName = pageName.trim();
    } else {
      pageTemplate.sectionName = pageName.trim();
    }
    return pageTemplate;
  }

  createChoices(addMode) {
    return addMode === ADD_MODE_PAGE ?
      this.pageTemplateData.map(item => ({
        name: item.name,
        value: item.npmName,
      })) : this.sectionTemplateData.map(item => ({
        name: item.name,
        value: item.npmName,
      }));
  }
}

function add(argv) {
  log.verbose('argv', argv);
  return new AddCommand(argv);
}

module.exports = add;
module.exports.AddCommand = AddCommand;
