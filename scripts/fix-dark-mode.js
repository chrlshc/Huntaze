// Script to fix dark mode classes in all components
const fs = require('fs');
const path = require('path');

// Patterns to fix
const replacements = [
  // Backgrounds
  { from: /className="([^"]*\s)?bg-white(\s[^"]*)?"/g, to: 'className="$1bg-white dark:bg-gray-800$2"' },
  { from: /className="([^"]*\s)?bg-gray-50(\s[^"]*)?"/g, to: 'className="$1bg-gray-50 dark:bg-gray-900$2"' },
  { from: /className="([^"]*\s)?bg-gray-100(\s[^"]*)?"/g, to: 'className="$1bg-gray-100 dark:bg-gray-800$2"' },
  { from: /className="([^"]*\s)?bg-purple-600(\s[^"]*)?"/g, to: 'className="$1bg-purple-600 dark:bg-purple-500$2"' },
  { from: /className="([^"]*\s)?bg-purple-50(\s[^"]*)?"/g, to: 'className="$1bg-purple-50 dark:bg-gray-900$2"' },
  
  // Text colors
  { from: /className="([^"]*\s)?text-gray-900(\s[^"]*)?"/g, to: 'className="$1text-gray-900 dark:text-white$2"' },
  { from: /className="([^"]*\s)?text-gray-800(\s[^"]*)?"/g, to: 'className="$1text-gray-800 dark:text-gray-100$2"' },
  { from: /className="([^"]*\s)?text-gray-700(\s[^"]*)?"/g, to: 'className="$1text-gray-700 dark:text-gray-300$2"' },
  { from: /className="([^"]*\s)?text-gray-600(\s[^"]*)?"/g, to: 'className="$1text-gray-600 dark:text-gray-400$2"' },
  { from: /className="([^"]*\s)?text-gray-500(\s[^"]*)?"/g, to: 'className="$1text-gray-500 dark:text-gray-400$2"' },
  { from: /className="([^"]*\s)?text-black(\s[^"]*)?"/g, to: 'className="$1text-black dark:text-white$2"' },
  
  // Borders
  { from: /className="([^"]*\s)?border-gray-200(\s[^"]*)?"/g, to: 'className="$1border-gray-200 dark:border-gray-700$2"' },
  { from: /className="([^"]*\s)?border-gray-300(\s[^"]*)?"/g, to: 'className="$1border-gray-300 dark:border-gray-600$2"' },
  
  // Hover states
  { from: /hover:bg-gray-50/g, to: 'hover:bg-gray-50 dark:hover:bg-gray-700' },
  { from: /hover:bg-gray-100/g, to: 'hover:bg-gray-100 dark:hover:bg-gray-700' },
  { from: /hover:text-gray-900/g, to: 'hover:text-gray-900 dark:hover:text-white' },
];

// Function to process file
function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  
  replacements.forEach(({ from, to }) => {
    const newContent = content.replace(from, to);
    if (newContent !== content) {
      content = newContent;
      changed = true;
    }
  });
  
  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed: ${filePath}`);
  }
}

// Process all component files
const componentsDir = path.join(__dirname, '../components/sections');
const files = fs.readdirSync(componentsDir);

files.forEach(file => {
  if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
    processFile(path.join(componentsDir, file));
  }
});

console.log('Dark mode fixes complete!');