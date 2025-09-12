// Percy visual regression tests for theme states
const percySnapshot = require('@percy/puppeteer');
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  // Set viewport
  await page.setViewport({ width: 1280, height: 720 });
  
  // Test homepage in different theme states
  const pages = [
    { url: 'http://localhost:3000', name: 'Homepage' },
    { url: 'http://localhost:3000/pricing', name: 'Pricing' },
    { url: 'http://localhost:3000/dashboard', name: 'Dashboard' },
  ];
  
  for (const testPage of pages) {
    await page.goto(testPage.url, { waitUntil: 'networkidle0' });
    
    // Dark mode snapshot
    await page.evaluate(() => {
      localStorage.setItem('theme', 'dark');
      document.documentElement.classList.add('dark-mode', 'theme-dark');
    });
    await page.waitForTimeout(300); // Wait for transitions
    await percySnapshot(page, `${testPage.name} - Dark Mode`);
    
    // Light mode snapshot
    await page.evaluate(() => {
      localStorage.setItem('theme', 'light');
      document.documentElement.classList.remove('dark-mode');
      document.documentElement.classList.add('theme-light');
    });
    await page.waitForTimeout(300);
    await percySnapshot(page, `${testPage.name} - Light Mode`);
    
    // AMOLED mode snapshot
    await page.evaluate(() => {
      localStorage.setItem('theme', 'dark');
      document.documentElement.classList.add('dark-mode', 'amoled');
    });
    await page.waitForTimeout(300);
    await percySnapshot(page, `${testPage.name} - AMOLED Mode`);
    
    // Colorblind mode snapshots
    const colorblindModes = ['protanopia', 'deuteranopia', 'tritanopia'];
    for (const mode of colorblindModes) {
      await page.evaluate((mode) => {
        document.documentElement.classList.add('colorblind-safe');
        document.body.style.filter = `url(#${mode}-filter)`;
      }, mode);
      await page.waitForTimeout(300);
      await percySnapshot(page, `${testPage.name} - Colorblind ${mode}`);
      
      // Reset
      await page.evaluate(() => {
        document.documentElement.classList.remove('colorblind-safe');
        document.body.style.filter = '';
      });
    }
  }
  
  await browser.close();
})();