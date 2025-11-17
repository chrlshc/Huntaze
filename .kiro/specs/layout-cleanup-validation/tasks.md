# Implementation Plan

- [x] 1. Setup project structure and utilities
  - Create directory structure for scripts and logs
  - Setup TypeScript configuration for scripts
  - Create shared utilities for file operations and logging
  - _Requirements: 1.1, 1.2_

- [x] 2. Implement Layout Analyzer
  - [x] 2.1 Create LayoutAnalyzer class with file parsing
    - Write TypeScript interfaces for LayoutAnalysis and AnalysisReport
    - Implement file reading and AST parsing logic
    - Create detection logic for redundant layouts (return children only)
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 2.2 Add categorization logic
    - Implement hasBusinessLogic() method to detect imports, hooks, logic
    - Implement hasStyles() method to detect className or style props
    - Create category assignment (redundant/necessary/review)
    - _Requirements: 1.4_

  - [x] 2.3 Generate analysis report
    - Implement report generation with statistics
    - Create JSON output format
    - Add console output with colors and formatting
    - _Requirements: 1.3_

  - [x] 2.4 Write unit tests for analyzer
    - Test redundant layout detection
    - Test necessary layout preservation
    - Test edge cases (empty files, syntax errors)
    - _Requirements: 1.1, 1.2_

- [x] 3. Implement Layout Cleaner
  - [x] 3.1 Create LayoutCleaner class with backup system
    - Write CleanupOptions and CleanupResult interfaces
    - Implement backup file creation in .kiro/backups/
    - Create restore functionality from backup
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 3.2 Implement incremental deletion with validation
    - Delete one layout at a time
    - Run npm run build after each deletion
    - Implement rollback on build failure
    - Log each operation (success/failure)
    - _Requirements: 2.3, 2.4, 2.5_

  - [x] 3.3 Add dry-run mode and reporting
    - Implement --dry-run flag to simulate without changes
    - Generate cleanup report with statistics
    - Add progress bar for user feedback
    - _Requirements: 4.3, 4.4, 4.5_

  - [x] 3.4 Write integration tests for cleaner
    - Test successful cleanup flow
    - Test rollback on build failure
    - Test dry-run mode
    - _Requirements: 2.1, 2.2, 2.3_

- [x] 4. Implement Build Validator
  - [x] 4.1 Create BuildValidator class
    - Write BuildResult, BuildError, and BuildStats interfaces
    - Implement runBuild() to execute npm run build
    - Capture stdout and stderr output
    - _Requirements: 3.1, 3.2_

  - [x] 4.2 Parse build output and extract errors
    - Parse Next.js build output format
    - Extract layout-specific errors
    - Identify file, line, column from error messages
    - Categorize error types (layout/component/type/other)
    - _Requirements: 3.2, 3.3_

  - [x] 4.3 Extract build statistics and metrics
    - Parse build stats (pages, routes, bundle size)
    - Calculate build duration
    - Extract warnings count
    - _Requirements: 3.4, 3.5_

  - [x] 4.4 Implement logging system
    - Create log directory .kiro/build-logs/
    - Write JSON logs with timestamp
    - Implement log rotation (max 100MB)
    - Create symlink to latest.log
    - _Requirements: 3.4, 3.5, 5.5_

  - [x] 4.5 Write unit tests for validator
    - Test build output parsing
    - Test error extraction
    - Test stats calculation
    - _Requirements: 3.1, 3.2_

- [x] 5. Create CLI scripts
  - [x] 5.1 Create analyze-layouts.ts script
    - Setup CLI argument parsing (--verbose, --json)
    - Instantiate LayoutAnalyzer
    - Run analysis and display results
    - Save report to .kiro/reports/layout-analysis.json
    - _Requirements: 1.1, 1.3, 4.1_

  - [x] 5.2 Create cleanup-layouts.ts script
    - Setup CLI argument parsing (--dry-run, --no-backup, --skip-validation)
    - Instantiate LayoutCleaner with options
    - Run cleanup with progress display
    - Generate and display final report
    - _Requirements: 2.1, 4.2, 4.3, 4.4_

  - [x] 5.3 Create validate-build.ts script
    - Setup CLI for standalone build validation
    - Run BuildValidator
    - Display results with colors
    - Exit with appropriate code (0 success, 1 failure)
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 5.4 Add npm scripts to package.json
    - Add "layouts:analyze" script
    - Add "layouts:cleanup" script with options
    - Add "build:validate" script
    - Add "hooks:install" script
    - _Requirements: 4.1, 4.2_

- [x] 6. Implement Git Hook
  - [x] 6.1 Install and configure Husky
    - Add husky to devDependencies
    - Run npx husky install
    - Create .husky directory structure
    - _Requirements: 5.1_

  - [x] 6.2 Create pre-commit hook script
    - Write .husky/pre-commit bash script
    - Call npm run build:validate
    - Handle exit codes (0 = allow, 1 = block)
    - Display helpful error messages
    - _Requirements: 5.2, 5.3_

  - [x] 6.3 Add bypass documentation
    - Document --no-verify flag usage
    - Add warning about bypassing validation
    - Create logging for bypass attempts
    - _Requirements: 5.4_

  - [x] 6.4 Create install script
    - Write scripts/install-git-hooks.sh
    - Automate Husky setup
    - Test hook installation
    - _Requirements: 5.1_

- [-] 7. Execute cleanup on current codebase
  - [x] 7.1 Run analysis on all layouts
    - Execute npm run layouts:analyze
    - Review generated report
    - Identify all redundant layouts
    - _Requirements: 1.1, 1.3_

  - [x] 7.2 Perform dry-run cleanup
    - Execute npm run layouts:cleanup --dry-run
    - Verify list of layouts to be removed
    - Check for any false positives
    - _Requirements: 4.5_

  - [x] 7.3 Execute actual cleanup
    - Run npm run layouts:cleanup with backup
    - Monitor progress and build validation
    - Verify all builds pass
    - Review cleanup report
    - _Requirements: 2.1, 2.2, 2.3, 3.1_

  - [x] 7.4 Commit and push changes
    - Stage all deleted layout files
    - Commit with descriptive message
    - Push to staging branch
    - Verify Amplify build succeeds
    - _Requirements: 3.1, 3.3_

- [x] 8. Documentation and monitoring
  - [x] 8.1 Create user documentation
    - Write README for layout cleanup system
    - Document all CLI commands and options
    - Add troubleshooting guide
    - Create examples for common scenarios
    - _Requirements: 4.1, 4.2_

  - [x] 8.2 Setup monitoring and alerts
    - Create script to check build log health
    - Add statistics dashboard (layouts count, build time)
    - Document backup retention policy
    - _Requirements: 3.5, 5.5_

  - [x] 8.3 Write end-to-end tests
    - Test full workflow from analysis to cleanup
    - Test Git hook blocking commits
    - Test rollback scenarios
    - _Requirements: 3.1, 5.2_
