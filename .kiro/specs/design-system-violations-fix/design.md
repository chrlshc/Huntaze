# Design Document - Design System Violations Fix

## Overview

This design document outlines the approach to systematically fix all design system violations detected by property-based tests. The solution involves automated detection scripts, migration tools, and manual fixes for complex cases, ensuring 100% compliance with the design system standards.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Violation Detection                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Font Tokens  │  │   Colors     │  │  Components  │  │
│  │   Scanner    │  │   Scanner    │  │   Scanner    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                  Violation Reporting                     │
│  • Categorized by type (tokens/components/colors)       │
│  • File paths and line numbers                          │
│  • Fix suggestions with examples                        │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                  Automated Migration                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Replace    │  │   Convert    │  │   Preserve   │  │
│  │  Hardcoded   │  │  Components  │  │Functionality │  │
│  │   Values     │  │              │  │              │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                Property-Based Validation                 │
│  • Run all test suites                                   │
│  • Verify 100% compliance                                │
│  • Generate compliance report                            │
└─────────────────────────────────────────────────────────┘
```

### Component Interaction

1. **Detection Phase**: Scanners analyze codebase for violations
2. **Reporting Phase**: Generate detailed reports with fix suggestions
3. **Migration Phase**: Automated scripts fix common patterns
4. **Validation Phase**: Property-based tests verify compliance
5. **Manual Review**: Complex cases flagged for developer review

## Components and Interfaces

### 1. Violation Detection System

#### FontTokenScanner
```typescript
interface FontTokenScanner {
  scanFiles(patterns: string[]): ViolationReport;
  detectHardcodedFonts(content: string): Violation[];
  suggestTokenReplacement(value: string): string;
}
```

#### ColorPaletteScanner
```typescript
interface ColorPaletteScanner {
  scanFiles(patterns: string[]): ViolationReport;
  detectUnapprovedColors(content: string): Violation[];
  findClosestApprovedColor(color: string): string;
}
```

#### ComponentUsageScanner
```typescript
interface ComponentUsageScanner {
  scanFiles(patterns: string[]): ViolationReport;
  detectRawElements(content: string, elementType: string): Violation[];
  suggestComponentMigration(element: string): string;
}
```

### 2. Migration System

#### AutomaticMigrator
```typescript
interface AutomaticMigrator {
  migrateFile(filePath: string, violations: Violation[]): MigrationResult;
  replaceHardcodedValues(content: string, replacements: Map<string, string>): string;
  convertToComponent(element: string, componentName: string): string;
  preserveFormatting(original: string, migrated: string): string;
}
```

#### ManualReviewQueue
```typescript
interface ManualReviewQueue {
  addForReview(filePath: string, reason: string): void;
  getReviewItems(): ReviewItem[];
  markResolved(itemId: string): void;
}
```

### 3. Reporting System

#### ViolationReporter
```typescript
interface ViolationReporter {
  generateReport(violations: Violation[]): Report;
  categorizeByType(violations: Violation[]): Map<string, Violation[]>;
  formatForConsole(report: Report): string;
  exportToJSON(report: Report): string;
}
```

## Data Models

### Violation
```typescript
interface Violation {
  filePath: string;
  lineNumber: number;
  column: number;
  type: 'font-token' | 'typography' | 'color-palette' | 'component';
  severity: 'error' | 'warning';
  currentValue: string;
  suggestedFix: string;
  context: string; // surrounding code
}
```

### ViolationReport
```typescript
interface ViolationReport {
  totalFiles: number;
  totalViolations: number;
  violationsByType: Map<string, number>;
  violations: Violation[];
  complianceRate: number;
}
```

### MigrationResult
```typescript
interface MigrationResult {
  filePath: string;
  success: boolean;
  violationsFixed: number;
  violationsRemaining: number;
  changes: Change[];
  requiresManualReview: boolean;
  reviewReason?: string;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property Reflection

After analyzing all acceptance criteria, several redundancies were identified:
- Properties 2.1 and 1.2 both check font-size uses tokens → Combine into Property 1
- Properties 2.2 and 1.4 both check inline styles use CSS variables → Combine into Property 2
- Properties 4.4, 5.4, 6.4, 7.4, and 9.3 all check props preservation → Combine into Property 8
- Requirements 10.1-10.5 are examples of running existing tests, not new properties

### Property 1: Font Token Usage Compliance
*For any* CSS or TypeScript file, all font-family and font-size declarations should reference design tokens from design-tokens.css or use standard Tailwind classes (text-sm, text-base, etc.), not hardcoded values.
**Validates: Requirements 1.1, 1.2, 2.1**

### Property 2: Inline Style Token Usage
*For any* React component with inline styles, fontSize properties should use CSS variables like var(--text-base) instead of hardcoded pixel or rem values.
**Validates: Requirements 1.4, 2.2**

### Property 3: Tailwind Class Standardization
*For any* Tailwind text class, it should use standard utility classes (text-xs through text-9xl) instead of arbitrary values like text-[14px].
**Validates: Requirements 1.5**

### Property 4: Migration Value Replacement
*For any* file containing hardcoded font values, after migration, all hardcoded values should be replaced with equivalent design tokens while maintaining visual consistency.
**Validates: Requirements 1.3, 2.5**

### Property 5: Arbitrary Class Conversion
*For any* Tailwind arbitrary class like text-[14px], the migration should convert it to the equivalent standard class (text-sm).
**Validates: Requirements 2.3**

### Property 6: Detection Completeness
*For any* file with hardcoded font-size values, the scanner should detect and report all violations with file paths and line numbers.
**Validates: Requirements 2.4, 8.2**

### Property 7: Color Palette Compliance
*For any* color value in CSS (hex, rgba, or CSS variable), it should either reference an approved design token or match an approved palette value exactly.
**Validates: Requirements 3.1, 3.2, 3.5**

### Property 8: Migration Preservation
*For any* component migration (Button, Input, Select, Card), all original props, event handlers, and accessibility attributes should be preserved in the migrated component.
**Validates: Requirements 4.4, 5.4, 6.4, 7.4, 9.3**

### Property 9: Component Usage Compliance
*For any* interactive element (button, input, select, card-like div), it should use the corresponding design system component (Button, Input, Select, Card) instead of raw HTML elements.
**Validates: Requirements 4.1, 5.1, 6.1, 7.1**

### Property 10: Component Detection
*For any* React file, the scanner should detect all raw HTML elements (<button>, <input>, <select>) and card-like div patterns that should use design system components.
**Validates: Requirements 4.2, 5.2, 6.2, 7.2**

### Property 11: Component Variant Mapping
*For any* raw element with custom styling (className="btn-primary"), the migration should map it to the appropriate component variant (<Button variant="primary">).
**Validates: Requirements 4.3, 5.3, 6.3, 7.3**

### Property 12: Semantic Structure Preservation
*For any* Card component, it should use appropriate sub-components (CardHeader, CardContent, CardFooter) to maintain semantic structure.
**Validates: Requirements 7.5**

### Property 13: Accessibility Compliance
*For any* Input or Select component, it should have proper accessibility attributes (labels, ARIA attributes, keyboard navigation).
**Validates: Requirements 5.5, 6.5**

### Property 14: Button Variant Validity
*For any* Button component, the variant prop should be one of the valid options: primary, secondary, outline, or ghost.
**Validates: Requirements 4.5**

### Property 15: Color Suggestion Quality
*For any* unapproved color value, the system should suggest the closest approved palette color based on color distance calculation.
**Validates: Requirements 3.4**

### Property 16: Violation Categorization
*For any* violation report, violations should be properly categorized by type (font-token, typography, color-palette, component) with accurate counts.
**Validates: Requirements 8.3**

### Property 17: Fix Suggestion Completeness
*For any* detected violation, the report should include a suggested fix with before/after examples.
**Validates: Requirements 8.4**

### Property 18: Scanner Coverage
*For any* relevant file type (CSS, TypeScript, TSX), the scanner should process it when detecting violations.
**Validates: Requirements 8.1**

### Property 19: CI/CD Integration
*For any* build with critical violations detected, the system should exit with a non-zero exit code to fail the build.
**Validates: Requirements 8.5**

### Property 20: Migration Coverage
*For any* common violation pattern (hardcoded fonts, raw buttons, arbitrary classes), the automatic migrator should fix it without manual intervention.
**Validates: Requirements 9.1**

### Property 21: Code Formatting Preservation
*For any* migrated file, the code formatting (indentation, line breaks, spacing) should be preserved.
**Validates: Requirements 9.2**

### Property 22: Migration Summary Completeness
*For any* completed migration, the summary report should include files processed, violations fixed, violations remaining, and files flagged for review.
**Validates: Requirements 9.4**

### Property 23: Manual Review Flagging
*For any* migration that cannot be completed automatically (complex patterns, ambiguous cases), the file should be flagged for manual review with a clear reason.
**Validates: Requirements 9.5**

## Error Handling

### Detection Errors
- **File Read Errors**: Log warning and continue with other files
- **Parse Errors**: Flag file for manual review, don't crash scanner
- **Invalid Patterns**: Report as potential false positive, allow override

### Migration Errors
- **Syntax Errors**: Rollback changes, flag for manual review
- **Component Import Errors**: Add missing imports automatically
- **Prop Mapping Errors**: Use conservative defaults, flag for review

### Validation Errors
- **Test Failures**: Generate detailed failure report with examples
- **Regression Detection**: Compare before/after screenshots for visual changes
- **Performance Impact**: Monitor bundle size and runtime performance

## Testing Strategy

### Unit Testing
- Test individual scanner functions with known violation patterns
- Test migration functions with before/after code samples
- Test report generation with mock violation data
- Test color distance calculations for palette suggestions

### Property-Based Testing
- Use existing property-based test suite as validation
- Each correctness property should have a corresponding PBT
- Run tests with 100+ iterations to ensure robustness
- Test edge cases: empty files, malformed code, edge values

### Integration Testing
- Test full detection → migration → validation pipeline
- Test with real codebase files
- Verify no regressions in functionality
- Test CI/CD integration with sample builds

### Visual Regression Testing
- Capture screenshots before and after migration
- Compare visual output to ensure consistency
- Flag any visual differences for manual review
- Use Playwright for automated visual testing

## Migration Strategy

### Phase 1: Detection and Reporting
1. Run all scanners to detect violations
2. Generate comprehensive violation report
3. Categorize violations by severity and type
4. Identify quick wins vs. complex cases

### Phase 2: Automated Migration
1. Start with font token violations (lowest risk)
2. Migrate typography tokens
3. Migrate color palette
4. Migrate components (Button → Input → Select → Card)
5. Run tests after each category

### Phase 3: Manual Review
1. Review flagged files
2. Handle complex component migrations
3. Verify visual consistency
4. Update documentation

### Phase 4: Validation
1. Run full property-based test suite
2. Verify 100% compliance
3. Run visual regression tests
4. Performance testing

## Performance Considerations

### Scanner Performance
- Use parallel processing for file scanning
- Cache parsed ASTs to avoid re-parsing
- Use incremental scanning for CI/CD (only changed files)
- Optimize regex patterns for speed

### Migration Performance
- Process files in batches
- Use worker threads for parallel migration
- Implement dry-run mode for testing
- Add progress indicators for long operations

### Memory Management
- Stream large files instead of loading entirely
- Clear caches periodically
- Limit concurrent file operations
- Monitor memory usage during migration

## Rollback Strategy

### Automatic Rollback
- Keep backup of original files before migration
- Rollback on syntax errors or test failures
- Preserve git history for manual rollback
- Generate rollback script for each migration

### Manual Rollback
- Document all changes in migration report
- Provide file-by-file rollback capability
- Keep detailed logs of all transformations
- Test rollback process before production use

## Documentation Updates

### Developer Documentation
- Update design system documentation with examples
- Create migration guide for future violations
- Document common patterns and anti-patterns
- Add troubleshooting guide

### Code Comments
- Add comments explaining token usage
- Document component variant choices
- Explain complex migrations
- Reference design system documentation

## Success Metrics

### Compliance Metrics
- 100% of property-based tests passing
- 0 critical violations remaining
- < 5 warnings for edge cases
- 100% of components using design system

### Quality Metrics
- No visual regressions detected
- No functionality broken
- Code formatting preserved
- Bundle size unchanged or reduced

### Process Metrics
- < 10% of files requiring manual review
- Migration time < 1 hour for full codebase
- CI/CD integration working smoothly
- Developer satisfaction with tooling
