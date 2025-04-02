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
async function getNpmVersions(npmName,registry){
  const data = await getNpmInfo(npmName,registry);
  if(data){
    return Object.keys(data.versions);
  }else{
    return [];
  }
}

function getSemverVersions(baseVersion,versions){
  return versions.filter(version => semver.satisfies(version,`^${baseVersion}`)).sort((a,b) => semver.gt(b,a));
}

async function getNpmSemverVersions(baseVersion,npmName,registry){
  const versions = await getNpmVersions(npmName,registry);
  const newVersions = getSemverVersions(baseVersion,versions);
  return newVersions.length > 0 ? newVersions[0] : null;
}

module.exports = {
  getNpmInfo,getNpmVersions,getNpmSemverVersions
};