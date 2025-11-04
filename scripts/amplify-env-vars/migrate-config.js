#!/usr/bin/env node

/**
 * Configuration Migration Tool
 * 
 * Migrates environment variables between different formats and systems
 */

const { AwsCliWrapper, SecurityHandler, Logger } = require('../../lib/amplify-env-vars');
const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  source: null,
  target: null,
  sourceFormat: null,
  targetFormat: null,
  appId: null,
  branch: null,
  mapping: null,
  transform: null,
  excludePattern: null,
  includePattern: null,
  dryRun: false,
  verbose: false
};

// Parse arguments
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  
  switch (arg) {
    case '--source':
      options.source = args[++i];
      break;
    case '--target':
      options.target = args[++i];
      break;
    case '--source-format':
      options.sourceFormat = args[++i];
      break;
    case '--target-format':
      options.targetFormat = args[++i];
      break;
    case '--app-id':
      options.appId = args[++i];
      break;
    case '--branch':
      options.branch = args[++i];
      break;
    case '--mapping':
      options.mapping = args[++i];
      break;
    case '--transform':
      options.transform = args[++i];
      break;
    case '--exclude-pattern':
      options.excludePattern = args[++i];
      break;
    case '--include-pattern':
      options.includePattern = args[++i];
      break;
    case '--dry-run':
      options.dryRun = true;
      break;
    case '--verbose':
      options.verbose = true;
      break;
    case '--help':
      showHelp();
      process.exit(0);
    default:
      if (arg.startsWith('--')) {
        console.error(`Unknown option: ${arg}`);
        process.exit(1);
      }
  }
}

// Validate required options
if (!options.source || !options.target) {
  console.error('❌ Error: --source and --target are required');
  showHelp();
  process.exit(1);
}

// Auto-detect formats if not specified
if (!options.sourceFormat) {
  options.sourceFormat = detectFormat(options.source);
}
if (!options.targetFormat) {
  options.targetFormat = detectFormat(options.target);
}

// Main function
async function main() {
  try {
    Logger.setLevel(options.verbose ? 'debug' : 'info');
    
    console.log(`🔄 Migrating configuration from ${options.source} to ${options.target}`);
    console.log(`📋 Source format: ${options.sourceFormat}, Target format: ${options.targetFormat}`);
    
    // Load source data
    const sourceData = await loadSourceData();
    console.log(`📊 Loaded ${Object.keys(sourceData).length} variables from source`);
    
    // Apply transformations
    const transformedData = await applyTransformations(sourceData);
    console.log(`🔧 Applied transformations, ${Object.keys(transformedData).length} variables after processing`);
    
    // Save to target
    if (options.dryRun) {
      console.log(`🔍 Dry run: Would save ${Object.keys(transformedData).length} variables to ${options.target}`);
      displayPreview(transformedData);
    } else {
      await saveTargetData(transformedData);
      console.log(`✅ Migration completed successfully`);
    }
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    if (options.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Detect format from file extension or source type
function detectFormat(source) {
  if (source === 'amplify' || source.startsWith('amplify:')) {
    return 'amplify';
  }
  
  const ext = path.extname(source).toLowerCase();
  switch (ext) {
    case '.json':
      return 'json';
    case '.yaml':
    case '.yml':
      return 'yaml';
    case '.env':
      return 'dotenv';
    case '.properties':
      return 'properties';
    case '.ini':
      return 'ini';
    case '.toml':
      return 'toml';
    default:
      return 'json'; // default fallback
  }
}

// Load source data
async function loadSourceData() {
  switch (options.sourceFormat) {
    case 'amplify':
      return await loadFromAmplify();
    case 'json':
      return await loadFromJson();
    case 'yaml':
      return await loadFromYaml();
    case 'dotenv':
      return await loadFromDotenv();
    case 'properties':
      return await loadFromProperties();
    case 'ini':
      return await loadFromIni();
    case 'toml':
      return await loadFromToml();
    default:
      throw new Error(`Unsupported source format: ${options.sourceFormat}`);
  }
}

// Load from AWS Amplify
async function loadFromAmplify() {
  if (!options.appId) {
    throw new Error('--app-id is required for Amplify source');
  }
  
  const branch = options.branch || 'staging';
  const result = await AwsCliWrapper.getEnvironmentVariables(options.appId, branch);
  
  if (!result.success) {
    throw new Error(`Failed to load from Amplify: ${result.error}`);
  }
  
  return result.variables || {};
}

// Load from JSON file
async function loadFromJson() {
  const content = fs.readFileSync(options.source, 'utf8');
  const data = JSON.parse(content);
  
  // Handle nested JSON structures
  if (typeof data === 'object' && data !== null) {
    return flattenObject(data);
  }
  
  return data;
}

// Load from YAML file
async function loadFromYaml() {
  const content = fs.readFileSync(options.source, 'utf8');
  const data = parseSimpleYaml(content);
  
  return flattenObject(data);
}

// Load from .env file
async function loadFromDotenv() {
  const content = fs.readFileSync(options.source, 'utf8');
  const variables = {};
  
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip comments and empty lines
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    
    const equalIndex = trimmed.indexOf('=');
    if (equalIndex > 0) {
      const key = trimmed.substring(0, equalIndex).trim();
      let value = trimmed.substring(equalIndex + 1).trim();
      
      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      
      variables[key] = value;
    }
  }
  
  return variables;
}

// Load from properties file
async function loadFromProperties() {
  const content = fs.readFileSync(options.source, 'utf8');
  const variables = {};
  
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip comments and empty lines
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('!')) {
      continue;
    }
    
    const equalIndex = trimmed.indexOf('=');
    const colonIndex = trimmed.indexOf(':');
    const separatorIndex = equalIndex > 0 ? equalIndex : colonIndex;
    
    if (separatorIndex > 0) {
      const key = trimmed.substring(0, separatorIndex).trim();
      const value = trimmed.substring(separatorIndex + 1).trim();
      variables[key] = value;
    }
  }
  
  return variables;
}

// Load from INI file
async function loadFromIni() {
  const content = fs.readFileSync(options.source, 'utf8');
  const variables = {};
  let currentSection = '';
  
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip comments and empty lines
    if (!trimmed || trimmed.startsWith(';') || trimmed.startsWith('#')) {
      continue;
    }
    
    // Handle sections
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      currentSection = trimmed.slice(1, -1);
      continue;
    }
    
    const equalIndex = trimmed.indexOf('=');
    if (equalIndex > 0) {
      const key = trimmed.substring(0, equalIndex).trim();
      const value = trimmed.substring(equalIndex + 1).trim();
      const fullKey = currentSection ? `${currentSection}.${key}` : key;
      variables[fullKey] = value;
    }
  }
  
  return variables;
}

// Load from TOML file (basic implementation)
async function loadFromToml() {
  console.log('⚠️  TOML parsing is basic. Consider using a proper TOML library for complex files.');
  
  const content = fs.readFileSync(options.source, 'utf8');
  const variables = {};
  let currentSection = '';
  
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip comments and empty lines
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    
    // Handle sections
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      currentSection = trimmed.slice(1, -1);
      continue;
    }
    
    const equalIndex = trimmed.indexOf('=');
    if (equalIndex > 0) {
      const key = trimmed.substring(0, equalIndex).trim();
      let value = trimmed.substring(equalIndex + 1).trim();
      
      // Remove quotes
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      
      const fullKey = currentSection ? `${currentSection}.${key}` : key;
      variables[fullKey] = value;
    }
  }
  
  return variables;
}

// Apply transformations
async function applyTransformations(data) {
  let transformedData = { ...data };
  
  // Apply include/exclude patterns
  if (options.includePattern) {
    const regex = new RegExp(options.includePattern);
    transformedData = Object.fromEntries(
      Object.entries(transformedData).filter(([key]) => regex.test(key))
    );
  }
  
  if (options.excludePattern) {
    const regex = new RegExp(options.excludePattern);
    transformedData = Object.fromEntries(
      Object.entries(transformedData).filter(([key]) => !regex.test(key))
    );
  }
  
  // Apply key mapping
  if (options.mapping) {
    const mapping = await loadMapping(options.mapping);
    const mappedData = {};
    
    Object.entries(transformedData).forEach(([key, value]) => {
      const newKey = mapping[key] || key;
      mappedData[newKey] = value;
    });
    
    transformedData = mappedData;
  }
  
  // Apply custom transformations
  if (options.transform) {
    transformedData = await applyCustomTransform(transformedData, options.transform);
  }
  
  return transformedData;
}

// Load key mapping file
async function loadMapping(mappingPath) {
  const content = fs.readFileSync(mappingPath, 'utf8');
  
  if (mappingPath.endsWith('.json')) {
    return JSON.parse(content);
  } else if (mappingPath.endsWith('.yaml') || mappingPath.endsWith('.yml')) {
    return parseSimpleYaml(content);
  } else {
    // Assume simple key=value format
    const mapping = {};
    const lines = content.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [oldKey, newKey] = trimmed.split('=').map(s => s.trim());
        if (oldKey && newKey) {
          mapping[oldKey] = newKey;
        }
      }
    }
    
    return mapping;
  }
}

// Apply custom transformation
async function applyCustomTransform(data, transformPath) {
  console.log('⚠️  Custom transformations not implemented yet. Data unchanged.');
  return data;
}

// Save target data
async function saveTargetData(data) {
  switch (options.targetFormat) {
    case 'amplify':
      await saveToAmplify(data);
      break;
    case 'json':
      await saveToJson(data);
      break;
    case 'yaml':
      await saveToYaml(data);
      break;
    case 'dotenv':
      await saveToDotenv(data);
      break;
    case 'properties':
      await saveToProperties(data);
      break;
    case 'ini':
      await saveToIni(data);
      break;
    case 'toml':
      await saveToToml(data);
      break;
    default:
      throw new Error(`Unsupported target format: ${options.targetFormat}`);
  }
}

// Save to AWS Amplify
async function saveToAmplify(data) {
  if (!options.appId) {
    throw new Error('--app-id is required for Amplify target');
  }
  
  const branch = options.branch || 'staging';
  const variablesString = Object.entries(data)
    .map(([key, value]) => `${key}=${value}`)
    .join(',');
  
  const result = await AwsCliWrapper.setEnvironmentVariables(
    options.appId,
    branch,
    variablesString
  );
  
  if (!result.success) {
    throw new Error(`Failed to save to Amplify: ${result.error}`);
  }
}

// Save to JSON file
async function saveToJson(data) {
  const content = JSON.stringify(data, null, 2);
  fs.writeFileSync(options.target, content, 'utf8');
}

// Save to YAML file
async function saveToYaml(data) {
  const lines = Object.entries(data).map(([key, value]) => `${key}: "${value}"`);
  const content = lines.join('\n');
  fs.writeFileSync(options.target, content, 'utf8');
}

// Save to .env file
async function saveToDotenv(data) {
  const lines = Object.entries(data).map(([key, value]) => {
    // Quote values that contain spaces or special characters
    const needsQuotes = /[\s"'\\]/.test(value);
    const quotedValue = needsQuotes ? `"${value.replace(/"/g, '\\"')}"` : value;
    return `${key}=${quotedValue}`;
  });
  
  const content = lines.join('\n');
  fs.writeFileSync(options.target, content, 'utf8');
}

// Save to properties file
async function saveToProperties(data) {
  const lines = Object.entries(data).map(([key, value]) => `${key}=${value}`);
  const content = lines.join('\n');
  fs.writeFileSync(options.target, content, 'utf8');
}

// Save to INI file
async function saveToIni(data) {
  const sections = {};
  
  // Group by sections (keys with dots)
  Object.entries(data).forEach(([key, value]) => {
    const dotIndex = key.indexOf('.');
    if (dotIndex > 0) {
      const section = key.substring(0, dotIndex);
      const subKey = key.substring(dotIndex + 1);
      
      if (!sections[section]) {
        sections[section] = {};
      }
      sections[section][subKey] = value;
    } else {
      if (!sections['']) {
        sections[''] = {};
      }
      sections[''][key] = value;
    }
  });
  
  const lines = [];
  
  // Write sections
  Object.entries(sections).forEach(([section, vars]) => {
    if (section) {
      lines.push(`[${section}]`);
    }
    
    Object.entries(vars).forEach(([key, value]) => {
      lines.push(`${key}=${value}`);
    });
    
    lines.push(''); // Empty line between sections
  });
  
  const content = lines.join('\n');
  fs.writeFileSync(options.target, content, 'utf8');
}

// Save to TOML file
async function saveToToml(data) {
  console.log('⚠️  TOML generation is basic. Consider using a proper TOML library for complex structures.');
  
  const lines = Object.entries(data).map(([key, value]) => {
    const needsQuotes = typeof value === 'string' && /[\s"'\\]/.test(value);
    const quotedValue = needsQuotes ? `"${value.replace(/"/g, '\\"')}"` : value;
    return `${key} = ${quotedValue}`;
  });
  
  const content = lines.join('\n');
  fs.writeFileSync(options.target, content, 'utf8');
}

// Display preview of what would be migrated
function displayPreview(data) {
  console.log(`\n📋 Preview of variables to migrate:`);
  
  const entries = Object.entries(data);
  const maxKeyLength = Math.max(...entries.map(([key]) => key.length));
  
  entries.forEach(([key, value]) => {
    const displayValue = SecurityHandler.isSensitive(key, value) ? 
                        SecurityHandler.maskSensitiveData(key, value) : 
                        value;
    console.log(`   ${key.padEnd(maxKeyLength)} = ${displayValue}`);
  });
}

// Utility functions
function flattenObject(obj, prefix = '') {
  const flattened = {};
  
  Object.entries(obj).forEach(([key, value]) => {
    const newKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      Object.assign(flattened, flattenObject(value, newKey));
    } else {
      flattened[newKey] = String(value);
    }
  });
  
  return flattened;
}

function parseSimpleYaml(content) {
  const data = {};
  const lines = content.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes(':')) {
      const [key, ...valueParts] = trimmed.split(':');
      const value = valueParts.join(':').trim().replace(/^["']|["']$/g, '');
      data[key.trim()] = value;
    }
  }
  
  return data;
}

// Show help information
function showHelp() {
  console.log(`
Configuration Migration Tool

Usage:
  node migrate-config.js --source <source> --target <target> [options]

Options:
  --source <path>           Source file or 'amplify' for AWS Amplify
  --target <path>           Target file or 'amplify' for AWS Amplify
  --source-format <format>  Source format (auto-detected if not specified)
  --target-format <format>  Target format (auto-detected if not specified)
  --app-id <id>            AWS Amplify app ID (required for Amplify source/target)
  --branch <name>          Branch name (default: staging)
  --mapping <path>         Key mapping file (JSON, YAML, or key=value format)
  --transform <path>       Custom transformation script
  --include-pattern <regex> Include only keys matching pattern
  --exclude-pattern <regex> Exclude keys matching pattern
  --dry-run               Show what would be migrated without making changes
  --verbose               Show detailed output
  --help                  Show this help message

Supported Formats:
  - amplify: AWS Amplify environment variables
  - json: JSON configuration files
  - yaml: YAML configuration files
  - dotenv: .env files
  - properties: Java properties files
  - ini: INI configuration files
  - toml: TOML configuration files

Examples:
  # Migrate from .env to Amplify
  node migrate-config.js --source .env --target amplify --app-id d123abc --branch staging

  # Migrate from Amplify to JSON
  node migrate-config.js --source amplify --target config.json --app-id d123abc --branch staging

  # Migrate with key mapping
  node migrate-config.js --source old-config.json --target new-config.yaml --mapping key-mapping.json

  # Migrate with filtering
  node migrate-config.js --source config.json --target .env --include-pattern "^API_"

  # Dry run migration
  node migrate-config.js --source .env --target amplify --app-id d123abc --dry-run
`);
}

// Run the main function
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  });
}

module.exports = { main, loadSourceData, saveTargetData, applyTransformations };