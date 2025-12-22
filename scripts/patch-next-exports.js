/* Patch Next.js ESM entrypoints for Auth.js v5 on Node 22+/Next 16
 *
 * next-auth@5 imports the following bare specifiers:
 *   - "next/server"
 *   - "next/headers"
 *   - "next/navigation"
 *
 * On some Node/ESM setups these resolve to file URLs without the .js extension,
 * e.g. file:///.../node_modules/next/server, which fails to load because only
 * server.js / headers.js / navigation.js exist.
 *
 * This script creates small re-export stubs:
 *   node_modules/next/server     -> ./server.js
 *   node_modules/next/headers    -> ./headers.js
 *   node_modules/next/navigation -> ./navigation.js
 *
 * It is safe to run multiple times; existing stubs are left untouched.
 */

const fs = require('fs');
const path = require('path');

function main() {
  let nextPkgPath;
  try {
    nextPkgPath = require.resolve('next/package.json', { paths: [process.cwd()] });
  } catch (err) {
    // Next.js not installed (or resolution failed) – nothing to patch.
    return;
  }

  const nextDir = path.dirname(nextPkgPath);

  /** Create a stub file that re-exports from "<entry>.js" */
  function ensureStub(entry) {
    const jsPath = path.join(nextDir, `${entry}.js`);
    if (!fs.existsSync(jsPath)) return; // Nothing to patch for this entry.

    const stubPath = path.join(nextDir, entry);
    const contents = [
      `import * as mod from "./${entry}.js";`,
      // Re-export all named exports
      `export * from "./${entry}.js";`,
      // Provide a safe default export as the namespace object (works even without a native default)
      `export default mod;`,
      '',
    ].join('\n');

    try {
      fs.writeFileSync(stubPath, contents, 'utf8');
      // eslint-disable-next-line no-console
      console.log(`[patch-next-exports] Created stub for next/${entry}`);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(`[patch-next-exports] Failed to create stub for next/${entry}:`, err?.message || err);
    }
  }

  ['server', 'headers', 'navigation'].forEach(ensureStub);

  // Next.js 16 bundles a compiled Browserslist build that can emit a noisy warning
  // about baseline-browser-mapping data freshness during every build.
  // Patch it out to keep CI/local builds clean.
  try {
    const browserslistPath = path.join(nextDir, 'dist', 'compiled', 'browserslist', 'index.js');
    if (fs.existsSync(browserslistPath)) {
      const contents = fs.readFileSync(browserslistPath, 'utf8');
      const warningNeedle = '[baseline-browser-mapping] The data in this module is over two months old.';

      if (contents.includes(warningNeedle)) {
        const patched = contents.replace(
          /\d+<\(new Date\)\.setMonth\(\(new Date\)\.getMonth\(\)-2\)&&console\.warn\("\[baseline-browser-mapping\][^"]*"\);/g,
          '0;'
        );

        if (patched !== contents) {
          fs.writeFileSync(browserslistPath, patched, 'utf8');
          // eslint-disable-next-line no-console
          console.log('[patch-next-exports] Suppressed baseline-browser-mapping warning in Next.js compiled browserslist');
        }
      }
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[patch-next-exports] Failed to patch baseline warning:', err?.message || err);
  }
}

main();
