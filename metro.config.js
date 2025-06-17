const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Tamagui için gerekli dosya uzantıları
config.resolver.sourceExts.push('mjs');

module.exports = config;
