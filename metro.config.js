// Metro config para resolver importações de Platform em react-native-web
const { getDefaultConfig } = require('@expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);
config.resolver.sourceExts.push('cjs');
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  'react-native/Libraries/Utilities/Platform': path.resolve(
    __dirname,
    'node_modules/react-native-web/src/vendor/react-native/Utilities/Platform.js'
  ),
};

module.exports = config;
