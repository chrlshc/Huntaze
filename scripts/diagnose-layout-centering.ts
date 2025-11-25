#!/usr/bin/env ts-node

/**
 * Layout Centering Diagnostic Script
 * 
 * This script helps identify elements that might be causing horizontal overflow
 * and centering issues on the homepage.
 */

interface LayoutIssue {
  component: string;
  issue: string;
  location: string;
  fix: string;
}

const issues: LayoutIssue[] = [];

// Check for fixed-width background glows
console.log('🔍 Checking for layout issues...\n');

// Issue 1: Background glows with fixed widths
issues.push({
  component: 'HeroSection',
  issue: 'Background glow with fixed width (600px) may overflow on mobile',
  location: 'components/home/HeroSection.tsx:32',
  fix: 'Use max-w-[600px] instead of w-[600px] or use percentage-based width'
});

issues.push({
  component: 'InteractiveDashboardDemo',
  issue: 'Background glow with fixed width (600px) may overflow',
  location: 'components/home/InteractiveDashboardDemo.tsx:~line 200',
  fix: 'Use max-w-[600px] instead of w-[600px]'
});

// Issue 2: Missing overflow-hidden on sections
issues.push({
  component: 'HeroSection',
  issue: 'Section has overflow-hidden but background glow may still cause issues',
  location: 'components/home/HeroSection.tsx:28',
  fix: 'Ensure parent container also has overflow-hidden'
});

// Issue 3: Absolute positioned elements
issues.push({
  component: 'InteractiveDashboardDemo',
  issue: 'Tooltips with absolute positioning may extend beyond viewport',
  location: 'components/home/InteractiveDashboardDemo.tsx:~line 50',
  fix: 'Add boundary checks or use max-w constraints'
});

// Issue 4: Container widths
issues.push({
  component: 'HomePageContent',
  issue: 'Root div has w-full mx-auto which is redundant',
  location: 'components/home/HomePageContent.tsx:9',
  fix: 'Remove mx-auto or ensure proper max-width constraint'
});

// Display issues
console.log('📋 Found potential layout issues:\n');
issues.forEach((issue, index) => {
  console.log(`${index + 1}. ${issue.component}`);
  console.log(`   Issue: ${issue.issue}`);
  console.log(`   Location: ${issue.location}`);
  console.log(`   Fix: ${issue.fix}`);
  console.log('');
});

console.log('\n✅ Diagnostic complete!');
console.log('\n📝 Recommended fixes:');
console.log('1. Replace all w-[XXXpx] with max-w-[XXXpx] for background glows');
console.log('2. Ensure all sections with absolute children have overflow-hidden');
console.log('3. Add overflow-x-hidden to root container if not present');
console.log('4. Test on mobile viewports (375px, 414px) after each fix');
