#!/usr/bin/env node

/**
 * BIMI Logo Validation Script
 * Validates that the SVG logo meets BIMI requirements
 */

const fs = require('fs');
const path = require('path');

const BIMI_REQUIREMENTS = {
  maxSize: 32 * 1024, // 32KB
  requiredNamespace: 'http://www.w3.org/2000/svg',
  requiredProfile: 'tiny-ps',
  aspectRatio: 1, // Must be square (1:1)
};

function validateBIMILogo(svgPath) {
  console.log('🔍 Validating BIMI logo...\n');
  
  // Check file exists
  if (!fs.existsSync(svgPath)) {
    console.error('❌ File not found:', svgPath);
    return false;
  }
  
  // Check file size
  const stats = fs.statSync(svgPath);
  const sizeKB = (stats.size / 1024).toFixed(2);
  console.log(`📏 File size: ${sizeKB} KB`);
  
  if (stats.size > BIMI_REQUIREMENTS.maxSize) {
    console.error(`❌ File too large! Max: 32KB, Current: ${sizeKB}KB`);
    return false;
  }
  console.log('✅ Size check passed\n');
  
  // Read and parse SVG content
  const content = fs.readFileSync(svgPath, 'utf8');
  
  // Check for SVG namespace
  if (!content.includes(BIMI_REQUIREMENTS.requiredNamespace)) {
    console.error('❌ Missing required SVG namespace');
    return false;
  }
  console.log('✅ SVG namespace found\n');
  
  // Check for Tiny-PS profile
  if (!content.includes('tiny-ps')) {
    console.error('❌ Missing baseProfile="tiny-ps"');
    return false;
  }
  console.log('✅ Tiny-PS profile found\n');
  
  // Check for forbidden elements
  const forbidden = ['script', 'foreignObject', 'animation', 'animate'];
  const foundForbidden = forbidden.filter(tag => 
    content.toLowerCase().includes(`<${tag}`)
  );
  
  if (foundForbidden.length > 0) {
    console.error('❌ Forbidden elements found:', foundForbidden.join(', '));
    return false;
  }
  console.log('✅ No forbidden elements\n');
  
  // Check viewBox for square aspect ratio
  const viewBoxMatch = content.match(/viewBox="([^"]+)"/);
  if (viewBoxMatch) {
    const [, , , width, height] = viewBoxMatch[1].split(/\s+/).map(Number);
    if (width && height) {
      const ratio = width / height;
      console.log(`📐 Aspect ratio: ${width}x${height} (${ratio.toFixed(2)}:1)`);
      
      if (Math.abs(ratio - 1) > 0.01) {
        console.warn('⚠️  Warning: Logo should be square (1:1 ratio)');
      } else {
        console.log('✅ Square aspect ratio\n');
      }
    }
  }
  
  // Check for title and desc (recommended)
  const hasTitle = content.includes('<title>');
  const hasDesc = content.includes('<desc>');
  
  if (!hasTitle) {
    console.warn('⚠️  Warning: Missing <title> element (recommended)');
  } else {
    console.log('✅ Title element found');
  }
  
  if (!hasDesc) {
    console.warn('⚠️  Warning: Missing <desc> element (recommended)');
  } else {
    console.log('✅ Description element found');
  }
  
  console.log('\n✨ BIMI logo validation complete!\n');
  console.log('📋 Next steps:');
  console.log('1. Upload this SVG to: https://huntaze.com/bimi-logo.svg');
  console.log('2. Verify your BIMI DNS record points to this URL');
  console.log('3. Test with: https://bimigroup.org/bimi-generator/');
  console.log('4. Send test emails and check Gmail inbox\n');
  
  return true;
}

// Run validation
const logoPath = path.join(__dirname, '../public/bimi-logo.svg');
const isValid = validateBIMILogo(logoPath);

process.exit(isValid ? 0 : 1);
