const axios = require('axios');
const log = require('@asd741-cli-dev/log');

module.exports = {
  createComponent: async function(component) {
    try {
      const response = await axios.post('http://book.youbaobao.xyz:7001/api/v1/components', component);
      log.verbose('response', response);
      const { data } = response;
      if (data.code === 0) {
        return data.data;
      }
      return null;
    } catch (e) {
      throw e;
    }
  },
};
