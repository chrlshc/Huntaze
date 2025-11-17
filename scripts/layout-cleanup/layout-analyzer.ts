import path from 'path';
import { readFile, findFiles } from './utils/file-operations';
import { Logger } from './utils/logger';
import { ReportGenerator } from './report-generator';

/**
 * Analysis result for a single layout file
 */
export interface LayoutAnalysis {
  path: string;
  category: 'redundant' | 'necessary' | 'review';
  reason: string;
  hasLogic: boolean;
  hasStyles: boolean;
  hasImports: boolean;
  childrenOnly: boolean;
}

/**
 * Complete analysis report for all layouts
 */
export interface AnalysisReport {
  total: number;
  redundant: LayoutAnalysis[];
  necessary: LayoutAnalysis[];
  review: LayoutAnalysis[];
  timestamp: string;
}

/**
 * LayoutAnalyzer - Analyzes layout files to identify redundant layouts
 */
export class LayoutAnalyzer {
  private logger: Logger;
  private appDir: string;
  private reportGenerator: ReportGenerator;

  constructor(appDir: string = 'app', logger?: Logger) {
    this.appDir = appDir;
    this.logger = logger || new Logger('.kiro/build-logs', false);
    this.reportGenerator = new ReportGenerator();
  }

  /**
   * Analyze all layout files in the app directory
   */
  async analyzeAll(): Promise<AnalysisReport> {
    await this.logger.initialize();
    await this.logger.info('Starting layout analysis...');

    // Find all layout.tsx files
    const layoutFiles = await findFiles(
      this.appDir,
      /^layout\.tsx$/,
      true
    );

    await this.logger.info(`Found ${layoutFiles.length} layout files`);

    // Analyze each file
    const analyses: LayoutAnalysis[] = [];
    for (const filePath of layoutFiles) {
      try {
        const analysis = await this.analyzeFile(filePath);
        analyses.push(analysis);
        await this.logger.debug(`Analyzed: ${filePath}`, analysis);
      } catch (error) {
        await this.logger.error(`Failed to analyze ${filePath}`, { error });
      }
    }

    // Generate report
    const report = this.generateReport(analyses);
    await this.logger.success('Analysis complete');

    return report;
  }

  /**
   * Analyze a single layout file
   */
  async analyzeFile(filePath: string): Promise<LayoutAnalysis> {
    const content = await readFile(filePath);

    // Check if file is empty or has no meaningful content
    const trimmedContent = content.trim();
    if (!trimmedContent || !this.hasLayoutFunction(content)) {
      return {
        path: filePath,
        category: 'review',
        reason: 'File is empty or does not contain a valid layout function',
        hasLogic: false,
        hasStyles: false,
        hasImports: false,
        childrenOnly: false,
      };
    }

    // Check various characteristics
    const hasImports = this.hasImports(content);
    const hasLogic = this.hasBusinessLogic(content);
    const hasStyles = this.hasStyles(content);
    const childrenOnly = this.isChildrenOnly(content);

    // Determine category
    let category: 'redundant' | 'necessary' | 'review';
    let reason: string;

    if (childrenOnly && !hasLogic && !hasStyles) {
      category = 'redundant';
      reason = 'Layout only returns children without any logic, styles, or wrapping';
    } else if (hasLogic || hasStyles || !childrenOnly) {
      category = 'necessary';
      reason = this.getNecessaryReason(hasLogic, hasStyles, childrenOnly);
    } else if (hasImports && !hasLogic && !hasStyles) {
      category = 'review';
      reason = 'Layout has imports but no clear logic or styles - manual review needed';
    } else {
      category = 'review';
      reason = 'Unable to categorize automatically - manual review needed';
    }

    return {
      path: filePath,
      category,
      reason,
      hasLogic,
      hasStyles,
      hasImports,
      childrenOnly,
    };
  }

  /**
   * Check if file has a valid layout function
   */
  private hasLayoutFunction(content: string): boolean {
    return /export\s+default\s+function/.test(content) || 
           /export\s+default/.test(content);
  }

  /**
   * Check if layout only returns children
   */
  private isChildrenOnly(content: string): boolean {
    // Remove comments and whitespace for analysis
    const cleaned = this.removeCommentsAndStrings(content);

    // Pattern 1: return children;
    if (/return\s+children\s*;/.test(cleaned)) {
      return true;
    }

    // Pattern 2: return <>{children}</>;
    if (/return\s*<\s*>\s*\{\s*children\s*\}\s*<\s*\/\s*>/.test(cleaned)) {
      return true;
    }

    // Pattern 3: return (<>{children}</>);
    if (/return\s*\(\s*<\s*>\s*\{\s*children\s*\}\s*<\s*\/\s*>\s*\)/.test(cleaned)) {
      return true;
    }

    return false;
  }

  /**
   * Check if file has imports (excluding React and types)
   */
  private hasImports(content: string): boolean {
    const lines = content.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Skip React and type imports
      if (trimmed.startsWith('import') && 
          !trimmed.includes('from "react"') &&
          !trimmed.includes("from 'react'") &&
          !trimmed.includes('React.ReactNode') &&
          !trimmed.includes('type ') &&
          !trimmed.includes('import type')) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Check if layout has business logic
   */
  private hasBusinessLogic(content: string): boolean {
    const cleaned = this.removeCommentsAndStrings(content);

    // Check for hooks
    const hookPatterns = [
      /use[A-Z]\w+\s*\(/,  // useSession, useState, etc.
      /useEffect/,
      /useMemo/,
      /useCallback/,
      /useContext/,
      /useReducer/,
      /useRef/,
    ];

    for (const pattern of hookPatterns) {
      if (pattern.test(cleaned)) {
        return true;
      }
    }

    // Check for conditional logic (but not ternary in JSX)
    if (/if\s*\(/.test(cleaned)) {
      return true;
    }

    // Check for function calls (excluding JSX and common patterns)
    const functionCallPattern = /\w+\([^<>]*\)/;
    if (functionCallPattern.test(cleaned)) {
      // Exclude common non-logic patterns
      const excludePatterns = [
        /export\s+default\s+function/,
        /function\s+\w+\s*\(/,
        /return/,
      ];
      
      let hasRealFunctionCall = functionCallPattern.test(cleaned);
      for (const exclude of excludePatterns) {
        if (exclude.test(cleaned)) {
          hasRealFunctionCall = false;
        }
      }
      
      if (hasRealFunctionCall) {
        return true;
      }
    }

    // Check for variable declarations with logic (but not export const)
    const varPattern = /(const|let|var)\s+\w+\s*=\s*[^{;]/;
    if (varPattern.test(cleaned)) {
      // Exclude export const declarations
      if (!/export\s+const/.test(cleaned)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if layout has styles
   */
  private hasStyles(content: string): boolean {
    const cleaned = this.removeCommentsAndStrings(content);

    // Check for className prop
    if (/className\s*=/.test(cleaned)) {
      return true;
    }

    // Check for style prop
    if (/style\s*=\s*\{/.test(cleaned)) {
      return true;
    }

    // Check for styled components or CSS modules
    if (/styled\./i.test(cleaned) || /\.module\./i.test(cleaned)) {
      return true;
    }

    return false;
  }

  /**
   * Remove comments and string literals for cleaner analysis
   */
  private removeCommentsAndStrings(content: string): string {
    // Remove single-line comments
    let cleaned = content.replace(/\/\/.*$/gm, '');
    
    // Remove multi-line comments
    cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, '');
    
    // Remove string literals (simple approach)
    cleaned = cleaned.replace(/"[^"]*"/g, '""');
    cleaned = cleaned.replace(/'[^']*'/g, "''");
    cleaned = cleaned.replace(/`[^`]*`/g, '``');
    
    return cleaned;
  }

  /**
   * Get reason for necessary categorization
   */
  private getNecessaryReason(hasLogic: boolean, hasStyles: boolean, childrenOnly: boolean): string {
    const reasons: string[] = [];
    
    if (hasLogic) {
      reasons.push('contains business logic');
    }
    if (hasStyles) {
      reasons.push('applies styles');
    }
    if (!childrenOnly) {
      reasons.push('wraps children with components');
    }
    
    return `Layout is necessary: ${reasons.join(', ')}`;
  }

  /**
   * Generate analysis report with statistics
   */
  private generateReport(analyses: LayoutAnalysis[]): AnalysisReport {
    const redundant = analyses.filter(a => a.category === 'redundant');
    const necessary = analyses.filter(a => a.category === 'necessary');
    const review = analyses.filter(a => a.category === 'review');

    return {
      total: analyses.length,
      redundant,
      necessary,
      review,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get the report generator instance
   */
  getReportGenerator(): ReportGenerator {
    return this.reportGenerator;
  }
}
