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
    if (fs.existsSync(stubPath)) return; // Already patched.

    const contents = `export * from "./${entry}.js"; export { default } from "./${entry}.js";\n`;

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
}

main();

