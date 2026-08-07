const { withDangerousMod, withXcodeProject } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const nativeFiles = [
  {
    source: 'native_plugins/manual_live_activity/App/TimeTrackingModule.swift',
    destination: 'TimeTrackingModule.swift',
  },
  {
    source: 'native_plugins/manual_live_activity/App/TimeTrackingModuleHeader.mm',
    destination: 'TimeTrackingModuleHeader.mm',
  },
  {
    source: 'targets/TimeTrackingPlayer/TimeTrackingPlayerAttributes.swift',
    destination: 'TimeTrackingPlayerAttributes.swift',
  },
];

module.exports = function withTimeTrackingModule(config) {
  config = withDangerousMod(config, [
    'ios',
    async (modConfig) => {
      for (const file of nativeFiles) {
        fs.copyFileSync(
          path.join(modConfig.modRequest.projectRoot, file.source),
          path.join(modConfig.modRequest.platformProjectRoot, file.destination),
        );
      }
      return modConfig;
    },
  ]);

  return withXcodeProject(config, (modConfig) => {
    const project = modConfig.modResults;
    const target = project.getFirstTarget().uuid;
    const mainGroup = project.getFirstProject().firstProject.mainGroup;

    for (const { destination } of nativeFiles) {
      const exists = Object.values(project.hash.project.objects.PBXFileReference || {})
        .some((reference) => reference.path === destination);
      if (!exists) project.addSourceFile(destination, { target }, mainGroup);
    }

    return modConfig;
  });
};
