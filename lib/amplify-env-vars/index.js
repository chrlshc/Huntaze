/**
 * AWS Amplify Environment Variables Management System
 * Main entry point for the library
 */

// Load available modules safely
const modules = {};

// Try to load each module, skip if not available
const moduleList = [
  'awsCliWrapper',
  'validationEngine', 
  'securityHandler',
  'syncService',
  'monitoringSystem',
  'backupRestoreService',
  'gitIntegration',
  'configParser',
  'logger',
  'connectivityTester',
  'validationReporter',
  'types',
  'interfaces',
  'constants',
  'errors'
];

moduleList.forEach(moduleName => {
  try {
    modules[moduleName] = require(`./${moduleName}`);
  } catch (error) {
    // Module not available, skip it
    console.warn(`Module ${moduleName} not available:`, error.message);
  }
});

module.exports = {
  // Export available modules
  ...modules,
  
  // Version info
  version: '1.0.0',
  name: 'AWS Amplify Environment Variables Management System',
  
  // Available modules list
  availableModules: Object.keys(modules)
};