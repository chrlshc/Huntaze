#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');

// Find all Shadow effect files
const files = execSync('find app/components -name "*Shadow*.tsx" -type f')
  .toString()
  .trim()
  .split('\n')
  .filter(f => f);

console.log(`Found ${files.length} Shadow effect files to fix`);

function addNullCheck(content, functionName, checkVars = ['ctx', 'canvas']) {
  const checkStr = checkVars.map(v => `!${v}`).join(' || ');
  const regex = new RegExp(`(${functionName}\\s*[=:]?\\s*\\([^)]*\\)\\s*\\{)\\s*(?!if \\(!(?:ctx|canvas))`, 'g');
  
  return content.replace(regex, `$1\n        if (${checkStr}) return;\n        `);
}

function fixFile(filePath) {
  console.log(`\nFixing ${filePath}...`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Fix resizeCanvas
  if (content.includes('resizeCanvas()') && !content.match(/resizeCanvas\(\)[^{]*\{\s*if \(!canvas\)/)) {
    content = addNullCheck(content, 'resizeCanvas', ['canvas']);
    modified = true;
    console.log('  ✓ Fixed resizeCanvas');
  }

  // Fix animate function
  if (content.includes('function animate()') && !content.match(/function animate\(\)[^{]*\{\s*if \(!(?:ctx|canvas)\)/)) {
    content = addNullCheck(content, 'function animate', ['ctx', 'canvas']);
    modified = true;
    console.log('  ✓ Fixed animate function');
  }

  // Fix animate arrow function
  if (content.includes('animate = ()') && !content.match(/animate = \(\)[^{]*\{\s*if \(!(?:ctx|canvas)\)/)) {
    content = addNullCheck(content, 'animate = \\(\\)', ['ctx', 'canvas']);
    modified = true;
    console.log('  ✓ Fixed animate arrow function');
  }

  // Fix createShadowLines
  if (content.includes('createShadowLines()') && !content.match(/createShadowLines\(\)[^{]*\{\s*if \(!canvas\)/)) {
    content = addNullCheck(content, 'createShadowLines', ['canvas']);
    modified = true;
    console.log('  ✓ Fixed createShadowLines');
  }

  // Fix createFloatingOrbs
  if (content.includes('createFloatingOrbs()') && !content.match(/createFloatingOrbs\(\)[^{]*\{\s*if \(!canvas\)/)) {
    content = addNullCheck(content, 'createFloatingOrbs', ['canvas']);
    modified = true;
    console.log('  ✓ Fixed createFloatingOrbs');
  }

  // Fix createLines
  if (content.includes('createLines()') && !content.match(/createLines\(\)[^{]*\{\s*if \(!canvas\)/)) {
    content = addNullCheck(content, 'createLines', ['canvas']);
    modified = true;
    console.log('  ✓ Fixed createLines');
  }

  // Fix createOrbs
  if (content.includes('createOrbs()') && !content.match(/createOrbs\(\)[^{]*\{\s*if \(!canvas\)/)) {
    content = addNullCheck(content, 'createOrbs', ['canvas']);
    modified = true;
    console.log('  ✓ Fixed createOrbs');
  }

  // Fix drawLine
  if (content.includes('drawLine(') && !content.match(/drawLine\([^)]*\)[^{]*\{\s*if \(!(?:ctx|canvas)\)/)) {
    content = addNullCheck(content, 'drawLine\\([^)]*\\)', ['ctx', 'canvas']);
    modified = true;
    console.log('  ✓ Fixed drawLine');
  }

  // Fix drawOrb
  if (content.includes('drawOrb(') && !content.match(/drawOrb\([^)]*\)[^{]*\{\s*if \(!(?:ctx|canvas)\)/)) {
    content = addNullCheck(content, 'drawOrb\\([^)]*\\)', ['ctx', 'canvas']);
    modified = true;
    console.log('  ✓ Fixed drawOrb');
  }

  // Fix drawShadowLine
  if (content.includes('drawShadowLine(') && !content.match(/drawShadowLine\([^)]*\)[^{]*\{\s*if \(!(?:ctx|canvas)\)/)) {
    content = addNullCheck(content, 'drawShadowLine\\([^)]*\\)', ['ctx', 'canvas']);
    modified = true;
    console.log('  ✓ Fixed drawShadowLine');
  }

  // Fix drawFloatingOrb
  if (content.includes('drawFloatingOrb(') && !content.match(/drawFloatingOrb\([^)]*\)[^{]*\{\s*if \(!(?:ctx|canvas)\)/)) {
    content = addNullCheck(content, 'drawFloatingOrb\\([^)]*\\)', ['ctx', 'canvas']);
    modified = true;
    console.log('  ✓ Fixed drawFloatingOrb');
  }

  // Fix triggerEnergyBeam
  if (content.includes('triggerEnergyBeam()') && !content.match(/triggerEnergyBeam\(\)[^{]*\{\s*if \(!canvas\)/)) {
    content = addNullCheck(content, 'triggerEnergyBeam', ['canvas']);
    modified = true;
    console.log('  ✓ Fixed triggerEnergyBeam');
  }

  // Fix drawEnergyBeam
  if (content.includes('drawEnergyBeam(') && !content.match(/drawEnergyBeam\([^)]*\)[^{]*\{\s*if \(!(?:beam\.active|ctx|canvas)\)/)) {
    content = addNullCheck(content, 'drawEnergyBeam\\([^)]*\\)', ['ctx', 'canvas']);
    modified = true;
    console.log('  ✓ Fixed drawEnergyBeam');
  }

  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed: ${filePath}`);
    return true;
  }
  
  console.log(`⏭️  No changes needed: ${filePath}`);
  return false;
}

// Main
let fixedCount = 0;
for (const file of files) {
  if (fs.existsSync(file)) {
    if (fixFile(file)) {
      fixedCount++;
    }
  }
}

console.log(`\n🎉 Fixed ${fixedCount} files!`);
