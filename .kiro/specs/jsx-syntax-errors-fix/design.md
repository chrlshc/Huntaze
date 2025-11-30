# Design Document

## Overview

This design document outlines the architecture and implementation strategy for a JSX syntax error detection and correction system for the Huntaze application. The system will systematically identify, categorize, and fix JSX syntax errors across 30+ files, with a focus on mismatched tags, duplicate attributes, unescaped emojis, and improper multi-line formatting. The solution prioritizes marketing-related files to unblock the build process while establishing patterns for preventing future errors.

## Architecture

### High-Level Architecture

The system follows a three-phase pipeline architecture:

1. **Detection Phase**: Static analysis of TSX files to identify JSX syntax errors
2. **Correction Phase**: Automated fixes with manual review checkpoints for ambiguous cases
3. **Validation Phase**: Verification that all fixes compile and maintain functionality

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  Detection  │────▶│  Correction  │────▶│ Validation  │
│   Engine    │     │    Engine    │     │   Engine    │
└─────────────┘     └──────────────┘     └─────────────┘
      │                    │                     │
      ▼                    ▼                     ▼
  Error Report      Fixed Files         Compliance Report
```

### Component Interaction

- **File Scanner**: Traverses directory structure to identify TSX files
- **AST Parser**: Parses JSX into Abstract Syntax Tree for analysis
- **Error Detector**: Identifies specific JSX syntax violations
- **Fix Applicator**: Applies corrections while preserving functionality
- **Build Validator**: Runs compilation checks on fixed files

## Components and Interfaces

### 1. File Scanner Component

**Purpose**: Identify all TSX files requiring analysis

**Interface**:
```typescript
interface FileScanner {
  scanDirectory(path: string, options: ScanOptions): Promise<string[]>
  prioritizeFiles(files: string[], priority: PriorityRule[]): string[]
}

interface ScanOptions {
  includePatterns: string[]
  excludePatterns: string[]
  recursive: boolean
}

interface PriorityRule {
  pattern: string
  weight: number
}
```

### 2. JSX Error Detector Component

**Purpose**: Analyze JSX syntax and identify errors

**Interface**:
```typescript
interface JSXErrorDetector {
  detectErrors(filePath: string): Promise<JSXError[]>
  categorizeErrors(errors: JSXError[]): ErrorReport
}

interface JSXError {
  type: ErrorType
  filePath: string
  line: number
  column: number
  message: string
  snippet: string
  severity: 'critical' | 'high' | 'medium' | 'low'
}

type ErrorType = 
  | 'mismatched-tag'
  | 'duplicate-attribute'
  | 'unescaped-emoji'
  | 'malformed-multiline'
  | 'missing-closing-tag'

interface ErrorReport {
  totalErrors: number
  errorsByType: Map<ErrorType, JSXError[]>
  errorsByFile: Map<string, JSXError[]>
  priorityFiles: string[]
}
```

### 3. Fix Applicator Component

**Purpose**: Apply automated corrections to JSX syntax errors

**Interface**:
```typescript
interface FixApplicator {
  applyFix(error: JSXError): Promise<FixResult>
  applyBatchFixes(errors: JSXError[]): Promise<BatchFixResult>
  requiresManualReview(error: JSXError): boolean
}

interface FixResult {
  success: boolean
  filePath: string
  originalCode: string
  fixedCode: string
  error?: string
}

interface BatchFixResult {
  totalAttempted: number
  successful: number
  failed: number
  requiresReview: number
  results: FixResult[]
}
```

### 4. Build Validator Component

**Purpose**: Verify fixes don't break compilation

**Interface**:
```typescript
interface BuildValidator {
  validateFile(filePath: string): Promise<ValidationResult>
  validateBuild(): Promise<BuildResult>
  generateComplianceReport(): Promise<ComplianceReport>
}

interface ValidationResult {
  filePath: string
  compiles: boolean
  errors: string[]
  warnings: string[]
}

interface BuildResult {
  success: boolean
  duration: number
  errors: string[]
  warnings: string[]
}

interface ComplianceReport {
  totalFilesFixed: number
  remainingErrors: number
  buildStatus: 'passing' | 'failing'
  fileResults: Map<string, ValidationResult>
}
```

## Data Models

### JSX Error Model

```typescript
class JSXSyntaxError {
  id: string
  type: ErrorType
  filePath: string
  location: {
    line: number
    column: number
    startOffset: number
    endOffset: number
  }
  context: {
    before: string
    error: string
    after: string
  }
  severity: ErrorSeverity
  suggestedFix?: string
  requiresManualReview: boolean
  metadata: {
    detectedAt: Date
    fixedAt?: Date
    fixedBy?: 'automated' | 'manual'
  }
}
```

### Fix Strategy Model

```typescript
interface FixStrategy {
  errorType: ErrorType
  pattern: RegExp
  replacement: (match: RegExpMatchArray) => string
  validate: (original: string, fixed: string) => boolean
  preserveChecks: PreservationCheck[]
}

interface PreservationCheck {
  name: string
  check: (original: string, fixed: string) => boolean
  description: string
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Acceptance Criteria Testing Prework

1.1 WHEN a JSX element is opened with a specific tag THEN the system SHALL close it with the matching closing tag
Thoughts: This is a universal rule about JSX syntax - for any opening tag, there must be a matching closing tag. We can generate random JSX structures and verify that every opening tag has a corresponding closing tag of the same type.
Testable: yes - property

1.2 WHEN a Card component is used THEN the system SHALL close it with </Card> not </div>
Thoughts: This is a specific instance of the general tag matching rule. It's an edge case that our property test generators should handle by ensuring component names match.
Testable: edge-case

1.3 WHEN a Button component is used THEN the system SHALL close it with </Button> not </div>
Thoughts: Another specific instance of tag matching. Edge case covered by generators.
Testable: edge-case

1.4 WHEN scanning JSX files THEN the system SHALL detect all mismatched opening and closing tags
Thoughts: This is about the detection capability - for any JSX file with mismatched tags, the detector should find them all. We can generate files with known mismatches and verify detection.
Testable: yes - property

1.5 WHEN fixing mismatched tags THEN the system SHALL preserve all content and attributes between the tags
Thoughts: This is an invariant - the content between tags should remain unchanged after fixing. We can verify that only the tag names change, not the content.
Testable: yes - property

2.1 WHEN defining JSX attributes THEN the system SHALL ensure each attribute appears only once per element
Thoughts: This is a universal rule - for any JSX element, each attribute name should be unique. We can generate elements and verify uniqueness.
Testable: yes - property

2.2 WHEN duplicate attributes are detected THEN the system SHALL keep only the last occurrence
Thoughts: This is a specific rule about how to resolve duplicates. We can test that given duplicates, only the last one remains.
Testable: yes - property

2.3 WHEN scanning JSX elements THEN the system SHALL detect all duplicate attribute definitions
Thoughts: Detection capability - for any element with duplicate attributes, the detector should find them all.
Testable: yes - property

2.4 WHEN fixing duplicate attributes THEN the system SHALL preserve the intended functionality
Thoughts: This is vague - "intended functionality" is not precisely defined. However, we can test that the fix maintains valid JSX.
Testable: yes - property

2.5 WHEN attributes have different values THEN the system SHALL flag for manual review to determine correct value
Thoughts: This is about the system's behavior when encountering ambiguous cases. We can test that conflicting values trigger the manual review flag.
Testable: yes - property

3.1 WHEN emojis are used in JSX content THEN the system SHALL wrap them in curly braces as strings
Thoughts: Universal rule for emoji handling. For any emoji in JSX content, it should be wrapped as {"emoji"}.
Testable: yes - property

3.2 WHEN emojis are in text content THEN the system SHALL convert them to {"emoji"} format
Thoughts: Same as 3.1, redundant.
Testable: redundant with 3.1

3.3 WHEN scanning JSX files THEN the system SHALL detect all unescaped emoji characters
Thoughts: Detection capability for emojis. For any file with unescaped emojis, detector should find them.
Testable: yes - property

3.4 WHEN fixing emoji issues THEN the system SHALL maintain the visual appearance
Thoughts: This is an invariant - the emoji character itself should remain the same, just wrapped differently.
Testable: yes - property

3.5 WHEN emojis are in attributes THEN the system SHALL properly escape them as string values
Thoughts: Specific case of emoji handling in attributes. Edge case for generators.
Testable: edge-case

4.1 WHEN JSX content spans multiple lines THEN the system SHALL wrap it in parentheses
Thoughts: Universal rule for multi-line JSX. Any multi-line JSX should have parentheses.
Testable: yes - property

4.2 WHEN JSX expressions are complex THEN the system SHALL use proper indentation
Thoughts: This is about code formatting, which is subjective. We can test that indentation is consistent.
Testable: yes - property

4.3 WHEN scanning JSX files THEN the system SHALL detect improperly formatted multi-line content
Thoughts: Detection capability for multi-line formatting issues.
Testable: yes - property

4.4 WHEN fixing formatting issues THEN the system SHALL preserve code readability
Thoughts: "Readability" is subjective, but we can test that indentation levels are maintained.
Testable: yes - property

4.5 WHEN JSX is nested deeply THEN the system SHALL maintain consistent indentation levels
Thoughts: Invariant about indentation - each nesting level should have consistent indentation.
Testable: yes - property

5.1-5.6 Priority file fixes
Thoughts: These are specific examples of applying fixes to particular files, not general properties.
Testable: yes - example

6.1 WHEN running detection script THEN the system SHALL scan all TSX files for JSX syntax errors
Thoughts: This is about completeness - the scanner should find all TSX files in the directory tree.
Testable: yes - property

6.2 WHEN JSX errors are found THEN the system SHALL report file path, line number, and error type
Thoughts: For any detected error, the report should contain these required fields.
Testable: yes - property

6.3 WHEN generating reports THEN the system SHALL categorize errors by type
Thoughts: All errors should be categorized into one of the defined error types.
Testable: yes - property

6.4 WHEN displaying errors THEN the system SHALL show the problematic code snippet
Thoughts: For any error, the report should include the code snippet.
Testable: yes - property

6.5 WHEN prioritizing fixes THEN the system SHALL rank files by number and severity of errors
Thoughts: The ranking should be deterministic based on error count and severity.
Testable: yes - property

7.1-7.5 Preservation requirements
Thoughts: These are all invariants - specific parts of the code should remain unchanged after fixes.
Testable: yes - property (can be combined)

8.1 WHEN all JSX errors are fixed THEN the system SHALL compile without syntax errors
Thoughts: This is the ultimate goal - after fixes, compilation should succeed.
Testable: yes - example

8.2-8.4 Build validation
Thoughts: These are specific checks that should pass after fixes.
Testable: yes - example

8.5 WHEN the build completes THEN the system SHALL generate a success report with files fixed
Thoughts: The system should produce a report listing all fixed files.
Testable: yes - property

9.1-9.5 Documentation requirements
Thoughts: These are about documentation generation, not functional correctness.
Testable: no

10.1 WHEN validation runs THEN the system SHALL re-scan all previously problematic files
Thoughts: The validation should check all files that had errors.
Testable: yes - property

10.2 WHEN validation runs THEN the system SHALL verify zero JSX syntax errors remain
Thoughts: After fixes, re-running detection should find no errors.
Testable: yes - property

10.3 WHEN validation runs THEN the system SHALL test that each fixed file compiles individually
Thoughts: Each file should compile on its own.
Testable: yes - property

10.4 WHEN validation runs THEN the system SHALL generate a compliance report
Thoughts: The validation should produce a report.
Testable: yes - property

10.5 WHEN validation fails THEN the system SHALL provide detailed information about remaining issues
Thoughts: If errors remain, the report should include details.
Testable: yes - property

### Property Reflection

After reviewing all properties, several can be consolidated:

- Properties 3.1 and 3.2 are redundant (both about wrapping emojis)
- Properties 7.1-7.5 can be combined into a single "preservation invariant" property
- Properties 8.2-8.4 are specific build checks that can be combined
- Properties 10.1-10.5 can be combined into a comprehensive "validation completeness" property

The consolidated set focuses on:
1. Tag matching correctness
2. Attribute uniqueness
3. Emoji escaping
4. Multi-line formatting
5. Content preservation during fixes
6. Detection completeness
7. Build success after fixes

### Correctness Properties

Property 1: Tag matching correctness
*For any* JSX element with an opening tag, the closing tag must have the same tag name
**Validates: Requirements 1.1, 1.2, 1.3**

Property 2: Mismatched tag detection completeness
*For any* JSX file containing mismatched tags, the detector must identify all mismatches
**Validates: Requirements 1.4**

Property 3: Content preservation during tag fixes
*For any* JSX element with mismatched tags, fixing the tags must preserve all content and attributes between them
**Validates: Requirements 1.5**

Property 4: Attribute uniqueness
*For any* JSX element, each attribute name must appear at most once
**Validates: Requirements 2.1**

Property 5: Duplicate attribute resolution
*For any* JSX element with duplicate attributes, the fix must keep only the last occurrence
**Validates: Requirements 2.2**

Property 6: Duplicate attribute detection completeness
*For any* JSX element with duplicate attributes, the detector must identify all duplicates
**Validates: Requirements 2.3**

Property 7: Conflicting attribute flagging
*For any* JSX element with duplicate attributes having different values, the system must flag it for manual review
**Validates: Requirements 2.5**

Property 8: Emoji escaping correctness
*For any* emoji character in JSX content, it must be wrapped in curly braces as a string literal
**Validates: Requirements 3.1, 3.2**

Property 9: Unescaped emoji detection completeness
*For any* JSX file containing unescaped emojis, the detector must identify all occurrences
**Validates: Requirements 3.3**

Property 10: Emoji character preservation
*For any* emoji in JSX, fixing the escaping must preserve the exact emoji character
**Validates: Requirements 3.4**

Property 11: Multi-line JSX parentheses requirement
*For any* JSX expression spanning multiple lines, it must be wrapped in parentheses
**Validates: Requirements 4.1**

Property 12: Indentation consistency
*For any* JSX element, all children at the same nesting level must have the same indentation
**Validates: Requirements 4.2, 4.5**

Property 13: Multi-line formatting detection completeness
*For any* JSX file with improperly formatted multi-line content, the detector must identify all occurrences
**Validates: Requirements 4.3**

Property 14: Code preservation during formatting
*For any* JSX element, fixing formatting must preserve all event handlers, props, conditional logic, and data bindings
**Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5**

Property 15: TSX file discovery completeness
*For any* directory tree, the scanner must discover all .tsx files
**Validates: Requirements 6.1**

Property 16: Error report completeness
*For any* detected JSX error, the report must include file path, line number, error type, and code snippet
**Validates: Requirements 6.2, 6.4**

Property 17: Error categorization correctness
*For any* detected JSX error, it must be categorized into exactly one error type
**Validates: Requirements 6.3**

Property 18: Priority ranking determinism
*For any* set of files with errors, the priority ranking must be deterministic based on error count and severity
**Validates: Requirements 6.5**

Property 19: Validation completeness
*For any* file that was fixed, the validation must re-scan it and verify zero JSX syntax errors remain
**Validates: Requirements 10.1, 10.2, 10.3**

Property 20: Compliance report generation
*For any* validation run, the system must generate a compliance report listing all fixed files and remaining issues
**Validates: Requirements 10.4, 10.5**

## Error Handling

### Error Categories

1. **Parsing Errors**: File cannot be parsed as valid TypeScript/JSX
   - Strategy: Report file for manual review, skip automated fixes
   - Recovery: Provide detailed error location and context

2. **Ambiguous Fixes**: Multiple valid corrections possible
   - Strategy: Flag for manual review with all options presented
   - Recovery: Apply conservative fix that maintains compilation

3. **Fix Application Failures**: Automated fix causes new errors
   - Strategy: Rollback fix, flag for manual review
   - Recovery: Preserve original file, log failure details

4. **Build Validation Failures**: Fixed file doesn't compile
   - Strategy: Rollback fix, analyze compilation errors
   - Recovery: Report specific compilation issues for manual resolution

### Error Recovery Strategies

```typescript
interface ErrorRecoveryStrategy {
  canRecover(error: Error): boolean
  recover(error: Error, context: RecoveryContext): Promise<RecoveryResult>
  fallback(): Promise<void>
}

interface RecoveryContext {
  filePath: string
  originalContent: string
  attemptedFix: string
  errorDetails: string
}

interface RecoveryResult {
  success: boolean
  recoveredContent?: string
  requiresManualIntervention: boolean
  message: string
}
```

### Rollback Mechanism

- Maintain backup of original file before applying fixes
- Track all changes in a transaction log
- Support atomic rollback of individual fixes or entire batch
- Preserve rollback history for audit trail

## Testing Strategy

### Unit Testing

Unit tests will verify specific examples and edge cases:

1. **Tag Matching Tests**
   - Test specific examples of mismatched tags (Card/div, Button/div)
   - Test self-closing tags
   - Test fragments

2. **Attribute Handling Tests**
   - Test duplicate attribute detection with same values
   - Test duplicate attribute detection with different values
   - Test attribute preservation during fixes

3. **Emoji Handling Tests**
   - Test common emojis (😊, 🎉, ❤️)
   - Test emojis in different positions (content, attributes)
   - Test already-escaped emojis (should not double-escape)

4. **Multi-line Formatting Tests**
   - Test JSX with 2, 3, 5+ lines
   - Test nested multi-line JSX
   - Test indentation with tabs vs spaces

5. **Integration Tests**
   - Test end-to-end fix application on sample files
   - Test build validation after fixes
   - Test rollback mechanism

### Property-Based Testing

Property-based tests will verify universal properties across all inputs using **fast-check** library for TypeScript. Each test will run a minimum of 100 iterations.

1. **Property Test: Tag Matching Correctness**
   - Generate random JSX structures with various tag types
   - Verify every opening tag has matching closing tag
   - **Feature: jsx-syntax-errors-fix, Property 1: Tag matching correctness**

2. **Property Test: Content Preservation**
   - Generate JSX with mismatched tags and random content
   - Apply fixes and verify content unchanged
   - **Feature: jsx-syntax-errors-fix, Property 3: Content preservation during tag fixes**

3. **Property Test: Attribute Uniqueness**
   - Generate JSX elements with random attributes
   - Verify each attribute name appears at most once after fixes
   - **Feature: jsx-syntax-errors-fix, Property 4: Attribute uniqueness**

4. **Property Test: Emoji Escaping**
   - Generate JSX with random emoji placements
   - Verify all emojis are properly escaped after fixes
   - **Feature: jsx-syntax-errors-fix, Property 8: Emoji escaping correctness**

5. **Property Test: Detection Completeness**
   - Generate files with known error counts
   - Verify detector finds all errors
   - **Feature: jsx-syntax-errors-fix, Property 2: Mismatched tag detection completeness**

6. **Property Test: Indentation Consistency**
   - Generate nested JSX with various indentation
   - Verify consistent indentation at each level after fixes
   - **Feature: jsx-syntax-errors-fix, Property 12: Indentation consistency**

7. **Property Test: Code Preservation**
   - Generate JSX with event handlers, props, conditionals
   - Verify all functional code preserved after formatting fixes
   - **Feature: jsx-syntax-errors-fix, Property 14: Code preservation during formatting**

### Test Configuration

```typescript
// fast-check configuration
const fcConfig = {
  numRuns: 100, // Minimum iterations per property test
  verbose: true,
  seed: Date.now(), // For reproducibility
  endOnFailure: false // Continue to find all failures
}
```

### Testing Priorities

1. **Critical Path**: Tag matching and content preservation (blocks build)
2. **High Priority**: Attribute handling and emoji escaping (common errors)
3. **Medium Priority**: Multi-line formatting and indentation (code quality)
4. **Low Priority**: Documentation and reporting (non-functional)

## Implementation Phases

### Phase 1: Detection Infrastructure (Priority: Critical)
- Implement file scanner with priority rules
- Build JSX error detector using TypeScript compiler API
- Create error categorization and reporting system
- Target: Marketing folder files first

### Phase 2: Core Fix Applicators (Priority: Critical)
- Implement tag matching fixes
- Implement duplicate attribute resolution
- Implement emoji escaping
- Apply fixes to priority files

### Phase 3: Validation and Safety (Priority: High)
- Implement build validator
- Create rollback mechanism
- Add manual review flagging for ambiguous cases
- Verify all priority files compile

### Phase 4: Comprehensive Coverage (Priority: Medium)
- Extend fixes to all remaining files
- Implement multi-line formatting fixes
- Add indentation consistency fixes
- Complete full codebase scan

### Phase 5: Prevention and Documentation (Priority: Low)
- Generate error pattern documentation
- Create prevention guidelines
- Integrate with ESLint rules
- Produce final compliance report

## Performance Considerations

- **Parallel Processing**: Process multiple files concurrently (limit: 10 concurrent)
- **Incremental Fixes**: Apply fixes file-by-file with validation checkpoints
- **Caching**: Cache AST parsing results for repeated analysis
- **Early Exit**: Stop processing file if critical parsing error encountered
- **Memory Management**: Process large files in streaming mode if needed

## Security Considerations

- **File System Safety**: Validate all file paths to prevent directory traversal
- **Backup Integrity**: Ensure backups cannot be overwritten or deleted accidentally
- **Code Injection**: Sanitize any dynamic code generation during fixes
- **Audit Trail**: Log all file modifications with timestamps and change details

## Deployment Strategy

1. **Development Environment**: Test on sample files first
2. **Staging Validation**: Run on full codebase in staging
3. **Production Rollout**: Apply fixes in batches with validation between each
4. **Monitoring**: Track build success rate and error reduction metrics
5. **Rollback Plan**: Maintain ability to revert all changes if critical issues found
