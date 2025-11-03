#!/usr/bin/env node

/**
 * Complete BIMI Setup Test
 * Tests all requirements for BIMI to work properly
 */

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔍 Testing Complete BIMI Setup for huntaze.com\n');
console.log('='.repeat(60) + '\n');

let allPassed = true;

// Test 1: DMARC Policy
console.log('1️⃣  Checking DMARC policy...');
try {
  const dmarc = execSync('dig TXT _dmarc.huntaze.com +short', { encoding: 'utf8' });
  console.log(`   ${dmarc.trim()}`);
  
  if (dmarc.includes('p=quarantine') || dmarc.includes('p=reject')) {
    console.log('   ✅ DMARC policy is strict enough (quarantine or reject)\n');
  } else {
    console.log('   ❌ DMARC policy must be "quarantine" or "reject" for BIMI\n');
    allPassed = false;
  }
} catch (error) {
  console.log('   ❌ DMARC record not found\n');
  allPassed = false;
}

// Test 2: BIMI DNS Record
console.log('2️⃣  Checking BIMI DNS record...');
try {
  const bimi = execSync('dig TXT default._bimi.huntaze.com +short', { encoding: 'utf8' });
  console.log(`   ${bimi.trim()}`);
  
  if (bimi.includes('v=BIMI1') && bimi.includes('l=https://')) {
    console.log('   ✅ BIMI DNS record found\n');
    
    // Extract logo URL
    const logoMatch = bimi.match(/l=(https:\/\/[^;]+)/);
    if (logoMatch) {
      const logoUrl = logoMatch[1];
      console.log(`   📍 Logo URL: ${logoUrl}\n`);
    }
  } else {
    console.log('   ❌ Invalid BIMI DNS record\n');
    allPassed = false;
  }
} catch (error) {
  console.log('   ❌ BIMI DNS record not found\n');
  allPassed = false;
}

// Test 3: SPF Record
console.log('3️⃣  Checking SPF record...');
try {
  const spf = execSync('dig TXT huntaze.com +short | grep "v=spf1"', { encoding: 'utf8' });
  console.log(`   ${spf.trim()}`);
  
  if (spf.includes('v=spf1')) {
    console.log('   ✅ SPF record found\n');
  } else {
    console.log('   ⚠️  SPF record not found (recommended)\n');
  }
} catch (error) {
  console.log('   ⚠️  SPF record not found (recommended)\n');
}

// Test 4: Local SVG File
console.log('4️⃣  Checking local BIMI logo file...');
const logoPath = './public/bimi-logo.svg';
if (fs.existsSync(logoPath)) {
  const stats = fs.statSync(logoPath);
  const sizeKB = (stats.size / 1024).toFixed(2);
  console.log(`   ✅ File exists: ${logoPath}`);
  console.log(`   📏 Size: ${sizeKB} KB (max: 32 KB)\n`);
  
  if (stats.size > 32 * 1024) {
    console.log('   ❌ File too large for BIMI\n');
    allPassed = false;
  }
} else {
  console.log(`   ❌ File not found: ${logoPath}\n`);
  allPassed = false;
}

// Test 5: SVG Content Validation
console.log('5️⃣  Validating SVG content...');
if (fs.existsSync(logoPath)) {
  const content = fs.readFileSync(logoPath, 'utf8');
  
  const checks = [
    { test: content.includes('xmlns="http://www.w3.org/2000/svg"'), msg: 'SVG namespace' },
    { test: content.includes('tiny-ps'), msg: 'Tiny-PS profile' },
    { test: !content.includes('<script'), msg: 'No scripts' },
    { test: !content.includes('<animate'), msg: 'No animations' },
    { test: content.includes('viewBox'), msg: 'ViewBox defined' },
  ];
  
  checks.forEach(check => {
    if (check.test) {
      console.log(`   ✅ ${check.msg}`);
    } else {
      console.log(`   ❌ ${check.msg}`);
      allPassed = false;
    }
  });
  console.log();
}

// Summary
console.log('='.repeat(60));
if (allPassed) {
  console.log('\n✨ All BIMI requirements passed!\n');
  console.log('📋 Next steps:');
  console.log('1. Deploy to production (Amplify will serve public/bimi-logo.svg)');
  console.log('2. Verify logo is accessible: curl https://huntaze.com/bimi-logo.svg');
  console.log('3. Send test emails: node scripts/test-email.js');
  console.log('4. Check Gmail inbox (logo may take 24-48h to appear)');
  console.log('5. Validate online: https://bimigroup.org/bimi-generator/\n');
} else {
  console.log('\n⚠️  Some BIMI requirements failed. Please fix the issues above.\n');
  process.exit(1);
}
