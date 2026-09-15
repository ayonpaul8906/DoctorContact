const path = require('path');

// Ensure module resolution in Babel plugins finds mobile workspace packages (like expo)
const mobileNodeModules = path.resolve(__dirname, 'node_modules');
if (!process.env.NODE_PATH || !process.env.NODE_PATH.includes(mobileNodeModules)) {
  process.env.NODE_PATH = [
    mobileNodeModules,
    process.env.NODE_PATH || '',
  ].filter(Boolean).join(path.delimiter);
  require('module').Module._initPaths();
}

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
  };
};
