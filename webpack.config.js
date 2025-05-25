const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const path = require('path');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);
  
  // Customize the config before returning it.
  config.resolve.alias = {
    ...config.resolve.alias,
    'react-native$': 'react-native-web',
    'react-native/Libraries/Utilities/Platform': path.resolve(__dirname, 'node_modules/react-native-web/src/vendor/react-native/Utilities/Platform.js'),
  };

  return config;
};
