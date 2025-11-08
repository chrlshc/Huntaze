#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Import our error utilities
const { getErrorMessage } = require('../lib/errors/index.js');

/**
 * Fix logger.error calls that pass error as second parameter
 */
function fixLoggerErrors() {
  console.log('🔍 Searching for logger.error issues...');
  
  // Find all TypeScript files with logger.error calls
  const files = [
    'lib/smart-onboarding/services/aiHelpGenerator.ts',
    'lib/workers/dataProcessingWorker.ts',
    'lib/smart-onboarding/services/learningPathOptimizer.ts',
    'lib/smart-onboarding/services/modelDeploymentService.ts',
    'lib/smart-onboarding/services/mlTrainingPipeline.ts',
    'lib/smart-onboarding/services/userConsentManager.ts',
    'lib/smart-onboarding/services/proactiveAssistanceService.ts',
    'lib/smart-onboarding/services/dataWarehouseService.ts',
    'lib/smart-onboarding/services/dataValidationService.ts',
    'lib/smart-onboarding/services/returningUserOptimizer.ts'
  ];
  
  let totalFixed = 0;
  
  files.forEach(filePath => {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return;
    }
    
    console.log(`📝 Processing: ${filePath}`);
    
    let content = fs.readFileSync(filePath, 'utf8');
    let fixCount = 0;
    
    // Pattern 1: logger.error('message', error) -> logger.error('message', { error: getErrorMessage(error) })
    const pattern1 = /logger\.error\(([^,]+),\s*error\s*\)/g;
    content = content.replace(pattern1, (match, message) => {
      fixCount++;
      return `logger.error(${message}, { error: error instanceof Error ? error.message : String(error) })`;
    });
    
    // Pattern 2: logger.error('message:', error) -> logger.error('message', { error: getErrorMessage(error) })
    const pattern2 = /logger\.error\(([^,]+):\s*,\s*error\s*\)/g;
    content = content.replace(pattern2, (match, message) => {
      fixCount++;
      return `logger.error(${message}, { error: error instanceof Error ? error.message : String(error) })`;
    });
    
    // Pattern 3: logger.error(`message ${variable}:`, error) -> logger.error(`message ${variable}`, { error: getErrorMessage(error) })
    const pattern3 = /logger\.error\((`[^`]+`):\s*,\s*error\s*\)/g;
    content = content.replace(pattern3, (match, message) => {
      fixCount++;
      return `logger.error(${message}, { error: error instanceof Error ? error.message : String(error) })`;
    });
    
    if (fixCount > 0) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed ${fixCount} logger.error calls in ${filePath}`);
      totalFixed += fixCount;
    } else {
      console.log(`✨ No issues found in ${filePath}`);
    }
  });
  
  console.log(`\n🎉 Total fixes applied: ${totalFixed}`);
}

// Run the fix
fixLoggerErrors();