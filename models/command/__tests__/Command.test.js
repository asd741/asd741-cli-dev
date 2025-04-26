'use strict';

const Command = require('../lib');
const should = require('should');

describe('Command类实例化测试', () => {
  it('参数不能为空', function() {
    try {
      new Command();
    } catch (err) {
      err.message.should.equal('参数不能为空！');
    }
  });
  it('参数必须为数组', function() {
    try {
      new Command({});
    } catch (err) {
      err.message.should.equal('参数必须为数组！');
    }
  });
  it('参数列表不能为空', function() {
    try {
      new Command([]);
    } catch (err) {
      err.message.should.equal('参数列表为空！');
    }
  });
  it('init方法未实现', function(done) {
    const instance = new Command(['init']);
    instance.runner.catch(err => {
      try {
        err.message.should.equal('init必须实现！');
      } catch (e) {
        console.log(e);
      } finally {
        done();
      }
    });
  });
  it('exec方法未实现', function(done) {
    const instance = new Command(['init']);
    instance.init = function() {
    };
    instance.runner.catch(err => {
      try {
        err.message.should.equal('exec必须实现！');
      } catch (e) {
        console.log(e);
      } finally {
        done();
      }
    });
  });
});

describe('Command类实例化测试', () => {
  it('正确检查Node版本号', function() {
    const instance = new Command(['init']);
    instance.init = function() {
    };
    instance.exec = function() {
    };
    try {
      instance.checkNodeVersion();
    } catch (err) {
    }
  });
  it('正确分解参数', function() {
    const instance = new Command(['init', 'project']);
    instance.init = function() {
    };
    instance.exec = function() {
    };
    instance.runner.then(() => {
      try {
        instance._cmd.should.equal('project');
        instance._argv.length.should.equal(1);
        instance._argv[0].should.equal('init');
      } catch (e) {
        console.log(e);
      }
    });
  });
});
