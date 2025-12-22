/**
 * PostCSS plugin to remove invalid Tailwind duration utility
 *
 * Tailwind v4 can emit a template rule for arbitrary duration utilities:
 *   .duration-[var(--transition-*)] {
 *     --tw-duration: var(--transition-*);
 *     transition-duration: var(--transition-*);
 *   }
 *
 * The "var(--transition-*)" syntax is not valid CSS and breaks LightningCSS /
 * Next.js' CSS parser. This plugin strips any rule containing that pattern.
 */

module.exports = () => ({
  postcssPlugin: 'remove-invalid-transition-utility',
  Once(root) {
    root.walkRules((rule) => {
      const hasInvalidSelector =
        typeof rule.selector === 'string' &&
        rule.selector.includes('duration-[var(--transition-*)]');

      let hasInvalidDecl = false;
      rule.walkDecls((decl) => {
        if (
          typeof decl.value === 'string' &&
          decl.value.includes('var(--transition-*)')
        ) {
          hasInvalidDecl = true;
        }
      });

      if (hasInvalidSelector || hasInvalidDecl) {
        rule.remove();
      }
    });
  },
});

module.exports.postcss = true;

