const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Web 平台配置
config.resolver.alias = {
  ...config.resolver.alias,
  'react-native': 'react-native-web',
};

// 确保 Web 平台能正确解析
config.resolver.sourceExts = ['jsx', 'js', 'ts', 'tsx', 'json', 'mjs', 'web.js', 'web.ts', 'web.tsx'];

module.exports = config;
