'use strict';

const fs = require('fs');
const fse = require('fs-extra');
const should = require('should');

const Package = require('../lib');
const TARGET_PATH = '/Users/sam/Desktop/asd741-cli-dev/commands/init';
const TARGET_PATH2 = '/Users/sam/.asd741-cli-dev';
const STORE_DIR = '/Users/sam/.asd741-cli-dev/node_modules';
const PACKAGE_NAME = '@asd741-cli-dev/init';
const PACKAGE_NAME2 = '@asd741-cli/init';
const PACKAGE_NAME_CONVERT = '@asd741-cli-dev_init';
const PACKAGE_VERSION = '1.0.0';
const PACKAGE_LATEST_VERSION = 'latest';

function createPackageWithoutTargetPath() {
  return createPackageInstance({ haveTargetPath: false });
}

function createPackageInstance(options = { haveTargetPath: true }) {
  const packageVersion = options.latestVersion ? PACKAGE_LATEST_VERSION : PACKAGE_VERSION;
  const packageName = options.latestVersion ? PACKAGE_NAME2 : PACKAGE_NAME;
  const { haveTargetPath } = options;
  return haveTargetPath ? new Package({
    targetPath: TARGET_PATH,
    storeDir: STORE_DIR,
    packageName,
    packageVersion,
  }) : new Package({
    storeDir: STORE_DIR,
    packageName,
    packageVersion,
  });
}

describe('Package对象实例化', function() {
  it('options参数为空', function() {
    try {
      new Package();
    } catch (err) {
      err.message.should.equal('Package类的options参数不能为空！');
    }
  });
  it('options参数不为对象', function() {
    try {
      new Package(1);
    } catch (err) {
      err.message.should.equal('Package类的options参数必须为对象！');
    }
    try {
      new Package(function() {
      });
    } catch (err) {
      err.message.should.equal('Package类的options参数必须为对象！');
    }
  });
  it('带targetPath的实例化', function() {
    const packageInstance = createPackageInstance();
    packageInstance.should.have.property('targetPath', TARGET_PATH);
    packageInstance.should.have.property('storeDir', STORE_DIR);
    packageInstance.should.have.property('packageName', PACKAGE_NAME);
    packageInstance.should.have.property('packageVersion', PACKAGE_VERSION);
    packageInstance.should.have.property('cacheFilePathPrefix', PACKAGE_NAME_CONVERT);
  });
  it('不带targetPath的实例化', function() {
    const packageInstance = createPackageWithoutTargetPath();
    packageInstance.should.have.property('targetPath', undefined);
    packageInstance.should.have.property('storeDir', STORE_DIR);
    packageInstance.should.have.property('packageName', PACKAGE_NAME);
    packageInstance.should.have.property('packageVersion', PACKAGE_VERSION);
    packageInstance.should.have.property('cacheFilePathPrefix', PACKAGE_NAME_CONVERT);
  });
});

describe('Package prepare方法测试', function() {
  before(function() {
    if (fs.existsSync(STORE_DIR)) {
      fse.removeSync(STORE_DIR);
    }
  });
  it('storeDir不存在时，创建storeDir', async function() {
    fs.existsSync(STORE_DIR).should.be.false();
    const packageInstance = createPackageInstance();
    await packageInstance.prepare();
    fs.existsSync(STORE_DIR).should.be.true();
  });
  it('packageVersion为latest获取最新版本号', async function() {
    const packageInstance = createPackageInstance({ latestVersion: true });
    await packageInstance.prepare();
    packageInstance.packageVersion.should.equal('1.1.2');
  });
});

describe('Package cacheFilePath属性测试', function() {
  it('获取cacheFilePath属性', function() {
    const instance = createPackageInstance();
    instance.cacheFilePath.should.equal('/Users/sam/.asd741-cli-dev/node_modules/_@asd741-cli-dev_init@1.0.0@@asd741-cli-dev/init');
  });
});

describe('Package getSpecificCacheFilePath方法测试', function() {
  it('获取getSpecificCacheFilePath属性', function() {
    const instance = createPackageInstance();
    instance.getSpecificCacheFilePath('1.0.0').should.equal('/Users/sam/.asd741-cli-dev/node_modules/_@asd741-cli-dev_init@1.0.0@@asd741-cli-dev/init');
  });
});

describe('Package exists方法测试', function() {
  it('有targetPath时，正确判断package是否存在', async function() {
    const instance = createPackageInstance();
    delete instance.storeDir;
    (await instance.exists()).should.be.true();
  });
  it('无targetPath时，正确判断package是否存在', async function() {
    const instance = createPackageWithoutTargetPath();
    (await instance.exists()).should.be.false();
  });
});

describe('Package getRootFilePath方法测试', function() {
  it('有targetPath时，正确获取入口文件', async function() {
    const instance = createPackageInstance();
    delete instance.storeDir;
    (await instance.getRootFilePath()).should.equal(`${TARGET_PATH}/lib/index.js`);
  });
  it('入口文件不存在时，返回null', async function() {
    const instance = createPackageWithoutTargetPath();
    should.strictEqual(await instance.getRootFilePath(), null);
  });
});

describe('Package install方法测试', function() {
  it('能够正确install Package', async function() {
    this.timeout(10000);
    const instance = new Package({
      targetPath: TARGET_PATH2,
      storeDir: STORE_DIR,
      packageName: PACKAGE_NAME2,
      packageVersion: PACKAGE_LATEST_VERSION,
    });
    await instance.install();
    (await instance.getRootFilePath()).should.equal('/Users/sam/.asd741-cli-dev/node_modules/_@asd741-cli_init@1.1.2@@asd741-cli/init/lib/index.js');
  });
  after(function() {
    if (fs.existsSync(STORE_DIR)) {
      fse.removeSync(STORE_DIR);
    }
  });
});

describe('Package update方法测试', function() {
  it('能够正确install Package', async function() {
    this.timeout(10000);
    const instance = new Package({
      targetPath: TARGET_PATH2,
      storeDir: STORE_DIR,
      packageName: PACKAGE_NAME2,
      packageVersion: PACKAGE_VERSION,
    });
    await instance.update();
    (await instance.getRootFilePath()).should.equal('/Users/sam/.asd741-cli-dev/node_modules/_@asd741-cli_init@1.1.2@@asd741-cli/init/lib/index.js');
  });
  after(function() {
    if (fs.existsSync(STORE_DIR)) {
      fse.removeSync(STORE_DIR);
    }
  });
});
