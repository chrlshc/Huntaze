const baseConfig = require('./.lighthouserc.json');

const kb = (value) => value * 1024;

const resourceAssertions = {
  'resource-summary:script:size': ['error', { maxNumericValue: kb(300) }],
  'resource-summary:stylesheet:size': ['error', { maxNumericValue: kb(50) }],
  'resource-summary:total:size': ['error', { maxNumericValue: kb(1000) }],
};

module.exports = {
  ...baseConfig,
  ci: {
    ...baseConfig.ci,
    assert: {
      ...baseConfig.ci?.assert,
      assertions: {
        ...(baseConfig.ci?.assert?.assertions || {}),
        ...resourceAssertions,
      },
    },
  },
};
