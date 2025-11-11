#!/usr/bin/env node

const fs = require('fs');

const filePath = 'lib/amplify-env-vars/backupRestoreService.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Pattern pour logger.error avec error dans un catch
content = content.replace(
  /catch \(error\) \{[\s\S]*?logger\.error\(([^,]+),\s*error\)/g,
  (match) => {
    return match.replace(
      /logger\.error\(([^,]+),\s*error\)/,
      'logger.error($1, error instanceof Error ? error : new Error(String(error)))'
    );
  }
);

fs.writeFileSync(filePath, content);
console.log('✅ Fixed logger.error calls in backupRestoreService.ts');
