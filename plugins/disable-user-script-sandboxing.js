const { IOSConfig, withXcodeProject } = require('@expo/config-plugins');

const withDisableUserScriptSandboxing = (config) => {
  return withXcodeProject(config, (config) => {
    const project = config.modResults;
    const nativeTargets = IOSConfig.Target.getNativeTargets(project);

    nativeTargets.forEach(([, nativeTarget]) => {
      if (
        !IOSConfig.Target.isTargetOfType(
          nativeTarget,
          IOSConfig.Target.TargetType.APPLICATION
        )
      ) {
        return;
      }

      IOSConfig.XcodeUtils.getBuildConfigurationsForListId(
        project,
        nativeTarget.buildConfigurationList
      ).forEach(([, buildConfig]) => {
        buildConfig.buildSettings = buildConfig.buildSettings || {};
        buildConfig.buildSettings.ENABLE_USER_SCRIPT_SANDBOXING = 'NO';
      });
    });

    return config;
  });
};

module.exports = withDisableUserScriptSandboxing;
