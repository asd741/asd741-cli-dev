'use strict';

const fs = require('fs');
const Git = require('@asd741-cli-dev/git');
const should = require('should');
const request = require('@asd741-cli-dev/request');
const CloudBuild = require('../lib');

const codePath = '/Users/sam/Desktop/test/vue3-test';
const codePath2 = '/Users/sam/Desktop/test/test';
const buildCmd = 'npm run build';
const prod = false;
const TIME_OUT = 5 * 60 * 1000;
const GIT_TOKEN_PATH = '/Users/sam/.asd741-cli-dev/.git/.git_token';

const Gitee = Git.Gitee;

function createCloudBuildInstance({ gitPath = codePath, name = 'vue3-test', version = '1.0.0' } = {}) {
  const git = new Git({
    name: name,
    version: version,
    dir: gitPath,
  }, {});
  const options = {
    buildCmd,
    prod,
  };
  return new CloudBuild(git, options);
}

function createGiteeInstance() {
  const token = fs.readFileSync(GIT_TOKEN_PATH).toString();
  const gitee = new Gitee();
  gitee.setToken(token);
  return gitee;
}

describe('CloudBuild实例化', () => {
  it('正确实例化', function() {
    const instance = createCloudBuildInstance();
    instance.git.should.not.be.null();
    instance.buildCmd.should.equal(buildCmd);
    instance.timeout.should.equal(TIME_OUT);
    instance.prod.should.equal(prod);
  });
});

describe('CloudBuild获取OSS文件', () => {
  it('正确判断OSS中不存在的项目', async function() {
    const instance = createCloudBuildInstance();
    const projectName = instance.git.name;
    const projectType = instance.prod ? 'prod' : 'dev';
    const ossProject = await request({
      url: '/project/oss',
      params: {
        name: projectName,
        type: projectType,
      },
    });
    ossProject.code.should.equal(0);
    ossProject.message.should.equal('获取项目文件失败');
  });
  it('正确判断OSS中存在的项目', async function() {
    const instance = createCloudBuildInstance({ gitPath: codePath2, name: 'test', version: '1.1.15' });
    const projectName = instance.git.name;
    const projectType = instance.prod ? 'prod' : 'dev';
    const ossProject = await request({
      url: '/project/oss',
      params: {
        name: projectName,
        type: projectType,
      },
    });
    ossProject.code.should.equal(0);
    ossProject.message.should.equal('获取项目文件成功');
    ossProject.data.length.should.greaterThan(0);
  });
});

describe('CloudBuild云构建', () => {
  it('正确执行云构建流程', async function() {
    const gitee = createGiteeInstance();
    const user = await gitee.getUser();
    const org = await gitee.getOrg(user.login);
    const repo = await gitee.getRepo(org[0].login, 'test');
    const remote = await gitee.getRemote(org[0].login, 'test');
    this.timeout(120 * 1000);
    const instance = createCloudBuildInstance({ gitPath: codePath2, name: 'test', version: '1.1.16' });
    instance.repo = repo;
    instance.git.remote = remote;
    instance.git.branch = 'dev/1.1.16';
    await instance.init();
    const ret = await instance.build();
    should.strictEqual(ret, true);
  });
});
