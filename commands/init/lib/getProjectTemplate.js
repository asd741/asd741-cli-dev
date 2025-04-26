const request = require('@asd741-cli-dev/request');

module.exports = function() {
  return request({
    url: '/project/template',
  });
};
