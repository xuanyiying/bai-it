const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);

  // 添加别名以支持 react-native-web
  config.resolve.alias = {
    ...config.resolve.alias,
    'react-native': 'react-native-web',
    'react-native/Libraries/EventEmitter/NativeEventEmitter': 'react-native-web/dist/exports/NativeEventEmitter',
    'react-native/Libraries/vendor/emitter/EventEmitter': 'react-native-web/dist/vendor/emitter/EventEmitter',
  };

  return config;
};
