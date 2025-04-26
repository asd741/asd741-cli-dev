'use strict';

const fs = require('fs');
const Git = require('../lib');
const Gitee = require('../lib/Gitee');
const GiteeRequest = require('../lib/GiteeRequest');
const should = require('should');

const GIT_TOKEN_PATH = '/Users/sam/.asd741-cli-dev/.git/.git_token';
const PROJECT_VUE2_TEST = 'vue2-test';

function createGiteeInstance() {
  const token = fs.readFileSync(GIT_TOKEN_PATH).toString();
  const gitee = new Gitee();
  gitee.setToken(token);
  return gitee;
}

function createGitInstance({ complexName = false, isComponent = false, isProd = false } = {}) {
  if (!complexName) {
    if (isComponent) {
      if (isProd) {
        return new Git({
          name: '@asd741-cli-dev/component-test5',
          version: '1.0.0',
          dir: '/Users/sam/Desktop/test/component-test8',
        }, {});
      } else {
        return new Git({
          name: '@asd741-cli-dev/component-test',
          version: '1.0.5',
          dir: '/Users/sam/Desktop/test/component-test4',
        }, {});
      }
    } else {
      return new Git({
        name: 'vue3-test',
        version: '0.1.0',
        dir: '/Users/sam/Desktop/test/vue3-test',
      }, {});
    }
  } else {
    return new Git({
      name: '@asd741-cli/vue3-test',
      version: '0.1.0',
      dir: '/Users/sam/Desktop/test/vue3-test',
    }, {});
  }
}

describe('Gitee类实例化', () => {
  it('实例化检查', function() {
    const gitee = new Gitee();
    gitee.setToken('123456');
    gitee.type.should.equal('gitee');
    gitee.token.should.equal('123456');
    gitee.request.should.not.equal(null);
    gitee.request.__proto__.should.equal(GiteeRequest.prototype);
  });
});

describe('Gitee获取个人或组织信息', function() {
  it('获取个人信息', async function() {
    const instance = createGiteeInstance();
    const user = await instance.getUser();
    user.login.should.equal('sam9831');
  });
  it('获取组织信息', async function() {
    const instance = createGiteeInstance();
    const user = await instance.getUser();
    const org = await instance.getOrg(user.login);
    org.length.should.equal(1);
    org[0].login.should.equal('asd741-project');
  });
});

describe('Gitee获取仓库信息', function() {
  it('获取指定仓库信息', async function() {
    const instance = createGiteeInstance();
    const user = await instance.getUser();
    const { login } = user;
    const repo = await instance.getRepo(login, PROJECT_VUE2_TEST);
    repo.full_name.should.equal(`${login}/${PROJECT_VUE2_TEST}`);
  });
});

describe('Gitee创建仓库', function() {
  it('创建个人仓库', async function() {
    this.skip();
    const instance = createGiteeInstance();
    const projectName = `test${new Date().getTime()}`;
    await instance.createRepo(projectName);
    const user = await instance.getUser();
    const { login } = user;
    const repo = await instance.getRepo(login, projectName);
    repo.full_name.should.equal(`${login}/${projectName}`);
  });
  it('创建组织仓库', async function() {
    this.skip();
    const instance = createGiteeInstance();
    const projectName = `test${new Date().getTime()}`;
    const user = await instance.getUser();
    const org = await instance.getOrg(user.login);
    const orgName = org[0].login;
    await instance.createOrgRepo(projectName, orgName);
    const repo = await instance.getRepo(orgName, projectName);
    repo.full_name.should.equal(`${orgName}/${projectName}`);
  });
});

describe('其他功能测试', function() {
  it('remote方法测试', async function() {
    const instance = createGiteeInstance();
    const user = await instance.getUser();
    instance.getRemote(user.login, PROJECT_VUE2_TEST).should.equal(`git@gitee.com:${user.login}/${PROJECT_VUE2_TEST}.git`);
  });
  it('帮助文档测试', function() {
    const instance = createGiteeInstance();
    instance.getTokenUrl().should.equal('https://gitee.com/personal_access_tokens');
    instance.getTokenHelpUrl().should.equal('https://gitee.com/help/articles/4191');
  });
});

describe('Git类测试', function() {
  it('Git类实例化测试', function() {
    const instance = createGitInstance({ complexName: true });
    instance.name.should.equal('asd741-cli_vue3-test');
  });

  it('获取正确的分支号（未上线项目）', async function() {
    const instance = createGitInstance();
    await instance.getCorrectVersion();
    instance.version.should.equal('0.1.0');
  });

  it('检查项目是否为组件', async function() {
    const instance = createGitInstance({ isComponent: true });
    Object.prototype.toString.call(instance.isComponent()).should.equal('[object Object]');
  });

  it('获取package.json', function() {
    const instance = createGitInstance({ isComponent: true });
    const pkg = instance.getPackageJson();
    Object.prototype.toString.call(pkg).should.equal('[object Object]');
    pkg.version.should.equal(instance.version);
  })
});
