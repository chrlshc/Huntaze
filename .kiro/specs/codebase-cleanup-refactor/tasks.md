# Implementation Plan: Codebase Cleanup and Refactor

- [ ] 1. Analysis and Planning Phase (Non-Destructive)
  - Create analysis scripts to scan the codebase
  - Generate reports without making any changes
  - _Requirements: 2.1, 2.2, 2.3, 8.1, 8.2, 8.3_

- [ ] 1.1 Create file scanner script
  - Write script to identify backup files (.backup, .bak, .old, -backup, -old)
  - Scan for duplicate page files (page-backup.tsx, page-old-generic.tsx)
  - Identify test/demo files in production directories
  - Generate `cleanup-analysis-report.md` with findings
  - _Requirements: 2.1, 2.2, 2.3_

- [ ] 1.2 Create CSS analyzer script
  - Parse all CSS files in app/ and styles/ directories
  - Detect duplicate CSS properties across files
  - Identify inline styles that should use Tailwind
  - Analyze mobile CSS files for consolidation opportunities
  - Generate `css-consolidation-plan.md` with merge strategies
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 1.3 Create component analyzer script
  - Scan app/components/ for duplicate shadow effect components
  - Identify neon canvas component variants
  - Find atomic background component duplicates
  - Locate debug components in production directories
  - Generate `component-consolidation-plan.md` with mapping
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 1.4 Create documentation analyzer script
  - Scan .kiro/specs/ directories for completion files
  - Identify duplicate summary files per spec
  - Find scattered deployment documentation
  - Locate AWS-related documentation files
  - Count files per spec directory
  - Generate documentation consolidation recommendations
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4_

- [ ] 1.5 Write property test for file classification
  - **Property 1: CSS Import Uniqueness**
  - **Validates: Requirements 1.1**

- [ ] 1.6 Write property test for backup file detection
  - **Property 4: No Backup Files**
  - **Validates: Requirements 2.1**

- [ ] 2. CSS Consolidation and Design System Establishment
  - Consolidate CSS files following "God Tier" design principles
  - Establish design tokens from PUSH-COMPLETE guidelines
  - Convert inline CSS to Tailwind utilities
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 2.1 Create design tokens file
  - Create `styles/design-tokens.css` with standardized values
  - Define CSS custom properties for "God Tier" aesthetics:
    - Background: --bg-primary (zinc-950)
    - Card background: --bg-card (gradient from white/[0.03])
    - Border: --border-subtle (white/[0.08])
    - Inner glow: --shadow-inner-glow
    - Text colors: --text-primary, --text-secondary, --text-accent
  - Document each token's purpose and usage
  - _Requirements: 1.1_

- [ ] 2.2 Consolidate mobile CSS files
  - Merge app/mobile.css, app/mobile-optimized.css, app/mobile-emergency-fix.css, app/nuclear-mobile-fix.css
  - Remove duplicate viewport fixes and media queries
  - Convert media queries to Tailwind responsive utilities where possible
  - Keep only essential custom mobile styles
  - Update imports in app/layout.tsx
  - _Requirements: 1.4_

- [ ] 2.3 Refactor glass.css to Tailwind
  - Analyze current glass.css for patterns
  - Create Tailwind utility classes for glass effects
  - Standardize on: bg-white/5 backdrop-blur-xl border-white/10
  - Update components using glass effects to use new utilities
  - Document custom glass utilities in design-tokens.css
  - _Requirements: 1.2, 1.3_

- [ ] 2.4 Minimize and document animations.css
  - Identify animations that can use Tailwind animate-* utilities
  - Keep only custom animations not available in Tailwind
  - Add comments documenting purpose of each custom animation
  - Remove unused animation definitions
  - _Requirements: 1.2_

- [ ] 2.5 Update global CSS imports
  - Update app/globals.css to import consolidated files
  - Remove imports of deleted CSS files
  - Ensure correct import order (tokens → base → components → utilities)
  - Verify no duplicate imports
  - _Requirements: 1.1, 1.5_

- [ ] 2.6 Write property test for CSS consolidation
  - **Property 2: No Duplicate CSS Properties**
  - **Validates: Requirements 1.2**

- [ ] 2.7 Write property test for Tailwind usage
  - **Property 3: Tailwind-First Styling**
  - **Validates: Requirements 1.3**

- [ ] 3. Checkpoint - Verify CSS consolidation
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Component Organization and Consolidation
  - Consolidate duplicate components into unified versions
  - Organize components by functionality
  - Update all imports across the codebase
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 4.1 Consolidate shadow effect components
  - Review all 7 shadow effect components in app/components/
  - Identify the most optimized version (likely HuntazeShadowEffect.tsx)
  - Create components/effects/ShadowEffect.tsx with variant props
  - Add TypeScript types for variant options
  - Export single default component
  - _Requirements: 5.1_

- [ ] 4.2 Update shadow effect imports
  - Find all files importing shadow effect components
  - Update imports to use new components/effects/ShadowEffect
  - Pass appropriate variant prop based on old component used
  - Remove old shadow effect component files
  - _Requirements: 5.1_

- [ ] 4.3 Consolidate neon canvas components
  - Keep OptimizedNeonCanvas.tsx as the production version
  - Create components/effects/NeonCanvas.tsx
  - Remove SimpleNeonCanvas.tsx and SimpleNeonTest.tsx
  - Update all imports to use new location
  - _Requirements: 5.3_

- [ ] 4.4 Consolidate atomic background components
  - Identify production-ready atomic background component
  - Create components/effects/AtomicBackground.tsx
  - Remove test and simple variants
  - Update all imports
  - _Requirements: 5.2_

- [ ] 4.5 Move debug components
  - Create components/debug/ directory
  - Move all components with 'debug' in name to debug directory
  - Update imports in files using debug components
  - Add README.md in debug directory explaining purpose
  - _Requirements: 5.4_

- [ ] 4.6 Create component barrel exports
  - Create components/effects/index.ts with exports
  - Create components/debug/index.ts with exports
  - Update imports to use barrel exports where appropriate
  - _Requirements: 5.1, 5.2, 5.3_

- [ ] 4.7 Write property test for debug component location
  - **Property 7: Debug Component Isolation**
  - **Validates: Requirements 5.4**

- [ ] 5. Checkpoint - Verify component consolidation
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Documentation Cleanup - Spec Directories
  - Consolidate documentation in completed spec directories
  - Archive task completion files
  - Remove duplicate summaries
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 6.1 Consolidate dashboard-home-analytics-fix documentation
  - Create FINAL-REPORT.md consolidating all completion reports
  - Move TASK-*-COMPLETE.md files to archive/ subdirectory
  - Remove duplicate summaries (RÉSUMÉ-FINAL.md, 🎉-PROJET-TERMINÉ.md)
  - Keep only: README.md, requirements.md, design.md, tasks.md, FINAL-REPORT.md
  - Consolidate deployment guides if multiple exist
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 6.2 Consolidate dashboard-routing-fix documentation
  - Create FINAL-REPORT.md consolidating all completion reports
  - Move TASK-*-COMPLETE.md files to archive/ subdirectory
  - Remove duplicate summaries (✅-RÉSUMÉ-COMPLET.md, PROJECT-COMPLETE.md, 🎉-PUSH-COMPLETE.md)
  - Keep only essential documentation in root
  - Archive visual summaries and intermediate reports
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 6.3 Consolidate dashboard-performance-real-fix documentation
  - Create FINAL-REPORT.md consolidating all completion reports
  - Move TASK-*-COMPLETE.md files to archive/ subdirectory
  - Remove duplicate summaries and deployment guides
  - Consolidate multiple deployment guides into single DEPLOYMENT.md
  - Keep only essential documentation in root
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 6.4 Consolidate performance-optimization-aws documentation
  - Create FINAL-REPORT.md consolidating all completion reports
  - Move TASK-*-COMPLETE.md files to archive/ subdirectory
  - Remove duplicate summaries (RÉSUMÉ-FINAL-FR.md, PROJECT-COMPLETE.md, 🎉-PROJET-TERMINÉ.md)
  - Consolidate deployment documentation
  - Keep only essential documentation in root
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 6.5 Consolidate dashboard-shopify-migration documentation
  - Create FINAL-REPORT.md consolidating phase summaries
  - Move phase completion files to archive/ subdirectory
  - Remove duplicate quick-start and status files
  - Keep only essential documentation in root
  - _Requirements: 3.1, 3.2, 3.3, 3.5_

- [ ] 6.6 Write property test for spec documentation limits
  - **Property 8: Spec Documentation Limit**
  - **Validates: Requirements 3.5**

- [ ] 6.7 Write property test for deployment guide uniqueness
  - **Property 9: Single Deployment Guide**
  - **Validates: Requirements 3.4**

- [ ] 7. Documentation Cleanup - Root Directory
  - Consolidate root-level documentation
  - Organize by concern (deployment, getting started, AWS)
  - Establish bilingual naming convention
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 7.1 Consolidate deployment status files
  - Merge DEPLOYMENT-STATUS-NOV-27.md, DEPLOYMENT_STATUS.md into single DEPLOYMENT-STATUS.md
  - Include latest deployment information
  - Remove old deployment status files
  - _Requirements: 4.1_

- [ ] 7.2 Consolidate getting started guides
  - Merge COMMENCER-ICI.md, START_HERE.md, QUICK_START.md into main README.md
  - Add "Getting Started" section to README.md with essential steps
  - Remove redundant start guides
  - _Requirements: 4.2_

- [ ] 7.3 Organize AWS documentation
  - Create docs/aws/ directory if it doesn't exist
  - Move all AWS-related guides to docs/aws/:
    - AWS_SETUP_COMPLETE_SUMMARY.md
    - AWS_SERVICES_GUIDE_SIMPLE.md
    - AWS_VERIFICATION_REPORT.md
    - GUIDE_AWS_S3_SES_CLOUDWATCH.md
    - GUIDE_RAPIDE_SES.md
  - Create docs/aws/README.md as index
  - _Requirements: 4.3_

- [ ] 7.4 Consolidate CSRF documentation
  - Merge CSRF_*.md files into single docs/CSRF-GUIDE.md
  - Include all fixes, solutions, and debugging information
  - Remove individual CSRF documentation files
  - _Requirements: 4.4_

- [ ] 7.5 Organize bilingual documentation
  - Rename French versions with -FR suffix:
    - COMMENCER-ICI.md → README-FR.md (if keeping separate)
    - COMMENT-DÉPLOYER.md → DEPLOYMENT-GUIDE-FR.md
    - DÉPLOYER-MAINTENANT.md → QUICK-DEPLOY-FR.md
  - Keep English as default, French as alternative
  - Update cross-references between language versions
  - _Requirements: 4.5_

- [ ] 7.6 Write property test for AWS documentation location
  - **Property 12: AWS Documentation Location**
  - **Validates: Requirements 4.3**

- [ ] 8. Checkpoint - Verify documentation cleanup
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Configuration and Environment Cleanup
  - Consolidate environment files
  - Document configuration files
  - Remove obsolete configs
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 9.1 Create environment file guide
  - Create ENV-GUIDE.md documenting purpose of each .env file:
    - .env.local (local development)
    - .env.production (production settings)
    - .env.test (test environment)
    - .env.example (template with all variables)
  - Document which variables are required vs optional
  - Explain environment-specific configurations
  - _Requirements: 6.1, 6.4_

- [ ] 9.2 Remove environment backup files
  - Delete .env.bak after verifying .env.local is current
  - Remove any other .env backup files
  - _Requirements: 6.2_

- [ ] 9.3 Consolidate environment example files
  - Merge all .env.*.example files into comprehensive .env.example
  - Add detailed comments for each variable
  - Group variables by concern (database, AWS, auth, etc.)
  - Include example values that are safe to commit
  - _Requirements: 6.3_

- [ ] 9.4 Archive migration environment files
  - Create config/archive/ directory
  - Move .env.migration and .env.migration.example to archive
  - Document in ENV-GUIDE.md that migration is complete
  - _Requirements: 6.5_

- [ ] 9.5 Document TypeScript configurations
  - Create CONFIG-GUIDE.md documenting each tsconfig file:
    - tsconfig.json (base configuration)
    - tsconfig.typecheck.json (type checking)
    - tsconfig.typecheck.api-*.json (API-specific type checking)
  - Explain when each config is used
  - Document any custom compiler options
  - _Requirements: 7.1_

- [ ] 9.6 Remove unused TypeScript configs
  - Identify tsconfig files not referenced in package.json or other configs
  - Verify they're not used by any build or test scripts
  - Remove unused configs after verification
  - _Requirements: 7.1_

- [ ] 9.7 Organize test configurations
  - Ensure test configs follow naming convention:
    - vitest.config.ts (unit tests)
    - vitest.config.integration.ts (integration tests)
    - vitest.config.e2e.ts (end-to-end tests)
  - Document each config in CONFIG-GUIDE.md
  - _Requirements: 7.3_

- [ ] 9.8 Consolidate lighthouse configuration
  - Keep only .lighthouserc.json (appears to be active)
  - Remove lighthouserc.config.js if duplicate
  - Verify lighthouse configuration works
  - _Requirements: 7.4_

- [ ] 9.9 Document buildspec files
  - Add section to CONFIG-GUIDE.md for buildspec files:
    - buildspec.yml (main build)
    - buildspec-loadtest.yml (load testing)
  - Explain when each is used (CI/CD, AWS CodeBuild)
  - _Requirements: 7.5_

- [ ] 9.10 Write property test for TypeScript config documentation
  - **Property 14: TypeScript Config Documentation**
  - **Validates: Requirements 7.1**

- [ ] 10. Final Verification and Reporting
  - Verify build succeeds
  - Check for broken imports
  - Generate cleanup metrics
  - Create final documentation
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 10.1 Verify build succeeds
  - Run `npm run build` and ensure no errors
  - Check build output for warnings
  - Verify bundle sizes are reasonable
  - _Requirements: 8.5_

- [ ] 10.2 Check for broken imports
  - Run TypeScript compiler in check mode
  - Use `tsc --noEmit` to find broken imports
  - Fix any import errors found
  - _Requirements: 8.4_

- [ ] 10.3 Run all tests
  - Execute unit tests: `npm run test`
  - Execute integration tests: `npm run test:integration`
  - Execute e2e tests: `npm run test:e2e`
  - Ensure all tests pass
  - _Requirements: 8.5_

- [ ] 10.4 Generate cleanup metrics report
  - Count files removed (before/after comparison)
  - Calculate total codebase size reduction
  - Count CSS duplications resolved
  - Measure bundle size reduction
  - Create CLEANUP-REPORT.md with all metrics
  - _Requirements: 8.1, 8.2, 8.3_

- [ ] 10.5 Update main README
  - Add section on new project structure
  - Document location of consolidated documentation
  - Explain design system and CSS organization
  - Add links to key documentation files
  - _Requirements: 4.2_

- [ ] 10.6 Create maintenance guidelines
  - Document pre-commit hooks to prevent backup files
  - Add CI checks for CSS duplication
  - Establish spec documentation guidelines
  - Schedule quarterly codebase health audits
  - Create scripts for future cleanup runs

- [ ] 10.7 Write property test for import resolution
  - **Property 16: No Broken Imports**
  - **Validates: Requirements 8.4**

- [ ] 10.8 Write property test for build success
  - **Property 17: Build Success**
  - **Validates: Requirements 8.5**

- [x] 11. Final Checkpoint - Project Complete
  - Ensure all tests pass, ask the user if questions arise.
