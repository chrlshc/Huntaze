#!/usr/bin/env node

/**
 * Check BIMI Production Status
 * Verifies that BIMI logo is accessible in production
 */

const https = require('https');
const { execSync } = require('child_process');

const LOGO_URL = 'https://huntaze.com/bimi-logo.svg';
const DOMAIN = 'huntaze.com';

console.log('🔍 Checking BIMI Production Status\n');
console.log('='.repeat(60) + '\n');

let allPassed = true;

// Test 1: Logo Accessibility
console.log('1️⃣  Checking logo accessibility...');
console.log(`   URL: ${LOGO_URL}`);

https.get(LOGO_URL, (res) => {
  const { statusCode, headers } = res;
  
  if (statusCode === 200) {
    console.log(`   ✅ Logo is accessible (HTTP ${statusCode})`);
    console.log(`   📄 Content-Type: ${headers['content-type']}`);
    
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      const sizeKB = (data.length / 1024).toFixed(2);
      console.log(`   📏 Size: ${sizeKB} KB\n`);
      
      // Validate SVG content
      if (data.includes('xmlns="http://www.w3.org/2000/svg"')) {
        console.log('   ✅ Valid SVG content\n');
      } else {
        console.log('   ❌ Invalid SVG content\n');
        allPassed = false;
      }
      
      runDNSChecks();
    });
  } else {
    console.log(`   ❌ Logo not accessible (HTTP ${statusCode})\n`);
    allPassed = false;
    runDNSChecks();
  }
}).on('error', (err) => {
  console.log(`   ❌ Error accessing logo: ${err.message}\n`);
  allPassed = false;
  runDNSChecks();
});

function runDNSChecks() {
  // Test 2: BIMI DNS Record
  console.log('2️⃣  Checking BIMI DNS record...');
  try {
    const bimi = execSync(`dig TXT default._bimi.${DOMAIN} +short`, { encoding: 'utf8' });
    console.log(`   ${bimi.trim()}`);
    
    if (bimi.includes('v=BIMI1') && bimi.includes(LOGO_URL)) {
      console.log('   ✅ BIMI DNS record correct\n');
    } else if (bimi.includes('v=BIMI1')) {
      console.log('   ⚠️  BIMI DNS record found but URL mismatch\n');
      console.log(`   Expected: ${LOGO_URL}`);
      allPassed = false;
    } else {
      console.log('   ❌ Invalid BIMI DNS record\n');
      allPassed = false;
    }
  } catch (error) {
    console.log('   ❌ BIMI DNS record not found\n');
    allPassed = false;
  }

  // Test 3: DMARC Policy
  console.log('3️⃣  Checking DMARC policy...');
  try {
    const dmarc = execSync(`dig TXT _dmarc.${DOMAIN} +short`, { encoding: 'utf8' });
    console.log(`   ${dmarc.trim()}`);
    
    if (dmarc.includes('p=quarantine') || dmarc.includes('p=reject')) {
      console.log('   ✅ DMARC policy is strict enough\n');
    } else if (dmarc.includes('p=none')) {
      console.log('   ❌ DMARC policy is "none" - must be "quarantine" or "reject"\n');
      console.log('   See: docs/DMARC_UPDATE_REQUIRED.md\n');
      allPassed = false;
    } else {
      console.log('   ❌ Invalid DMARC policy\n');
      allPassed = false;
    }
  } catch (error) {
    console.log('   ❌ DMARC record not found\n');
    allPassed = false;
  }

  // Test 4: SPF Record
  console.log('4️⃣  Checking SPF record...');
  try {
    const spf = execSync(`dig TXT ${DOMAIN} +short | grep "v=spf1"`, { encoding: 'utf8' });
    console.log(`   ${spf.trim()}`);
    console.log('   ✅ SPF record found\n');
  } catch (error) {
    console.log('   ⚠️  SPF record not found (recommended)\n');
  }

  // Summary
  console.log('='.repeat(60));
  if (allPassed) {
    console.log('\n✨ BIMI is fully configured and ready!\n');
    console.log('📧 Send test emails and check Gmail inbox');
    console.log('⏰ Logo may take 24-48 hours to appear first time');
    console.log('🔗 Validate online: https://bimigroup.org/bimi-generator/\n');
  } else {
    console.log('\n⚠️  Some issues found. Please fix them:\n');
    console.log('1. Ensure logo is deployed to production');
    console.log('2. Update DMARC policy if needed (see docs/DMARC_UPDATE_REQUIRED.md)');
    console.log('3. Wait for DNS propagation (5-30 minutes)');
    console.log('4. Run this script again to verify\n');
    process.exit(1);
  }
}
