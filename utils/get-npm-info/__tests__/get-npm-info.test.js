'use strict';

const should = require('should');
const npm = require('../lib');

const PACKAGE_NAME = '@asd741-cli/init';
const LATEST_VERSION = '1.1.2';
const BASE_VERSION = '1.1.0';

describe('npm方法测试', () => {
  it('getNpmInfo方法', async function() {
    const pkg = await npm.getNpmInfo(PACKAGE_NAME);
    pkg.should.not.be.null();
    pkg.name.should.equal(PACKAGE_NAME);
  });
  it('getNpmVersions方法', async function() {
    const versions = await npm.getNpmVersions(PACKAGE_NAME);
    Array.isArray(versions).should.be.true();
    versions.length.should.greaterThanOrEqual(1);
    versions[0].should.equal(LATEST_VERSION);
  });
  it('getNpmSemverVersion方法', async function() {
    const version = await npm.getNpmSemverVersion(BASE_VERSION, PACKAGE_NAME);
    version.should.not.be.null();
    version.should.equal(LATEST_VERSION);
  });
  it('getDefaultRegistry方法', async function() {
    const registry = await npm.getDefaultRegistry(true);
    registry.should.equal('https://registry.npmjs.org');
    const registry2 = await npm.getDefaultRegistry();
    registry2.should.equal('https://registry.npm.taobao.org');
  });
  it('getNpmLatestVersion方法', async function() {
    const version = await npm.getNpmLatestVersion(PACKAGE_NAME);
    version.should.not.be.null();
    version.should.equal(LATEST_VERSION);
  });
});
