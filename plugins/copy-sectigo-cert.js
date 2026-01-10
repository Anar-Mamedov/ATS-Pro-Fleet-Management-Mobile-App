const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Expo config plugin to copy Sectigo intermediate certificate to Android raw resources
 * This ensures the certificate is included even after `rm -rf android` and `expo prebuild`
 */
const withSectigoCert = (config) => {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const platformProjectRoot = config.modRequest.platformProjectRoot;

      const sourcePath = path.join(projectRoot, 'sectigo_intermediate.pem');
      const targetDir = path.join(
        platformProjectRoot,
        'app',
        'src',
        'main',
        'res',
        'raw'
      );
      // Android raw resources: file must be named without extension to match @raw/sectigo_intermediate
      const targetPath = path.join(targetDir, 'sectigo_intermediate');

      // Create raw directory if it doesn't exist
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      // Copy certificate file
      if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, targetPath);
        console.log('✅ Sectigo intermediate certificate copied to Android raw resources');
      } else {
        console.warn('⚠️  Warning: sectigo_intermediate.pem not found in project root');
      }

      return config;
    },
  ]);
};

module.exports = withSectigoCert;
