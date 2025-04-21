'use strict';

const os = require('os');
const should = require('should');
const formatPath = require('../lib');

describe('测试formatPath的功能', () => {
  it('功能正确实现', function() {
    const platform = os.platform();
    if (platform === 'darwin' || platform === 'linux') {
      formatPath('/test').should.equal('/test');
    } else {
      formatPath('c:\\test').should.equal('c:/test');
    }
  });
});
