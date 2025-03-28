'use strict';
const axios = require('axios');
const urljoin = require('url-join').default;
const semver = require('semver');
async function getNpmInfo(npmName, registry) {
  if (!npmName) return null;
  const registryUrl = registry || getDefaultRegistry();
  const npmInfoUrl = urljoin(registryUrl, npmName);
  try {
    const res = await axios.get(npmInfoUrl);
    if (res.status === 200) {
      return res.data;
    }
    return null;
  } catch (error) {
    return Promise.reject(error);
  }
}
function getDefaultRegistry(isOriginal = true) {
  return isOriginal ? 'https://registry.npmjs.org' : 'https://registry.npm.taobao.org'
}
module.exports = {
  getNpmInfo
};