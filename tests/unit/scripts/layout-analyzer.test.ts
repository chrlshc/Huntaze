import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import { LayoutAnalyzer } from '../../../scripts/layout-cleanup/layout-analyzer';
import { Logger } from '../../../scripts/layout-cleanup/utils/logger';

describe('LayoutAnalyzer', () => {
  const testDir = path.join(process.cwd(), 'tests/fixtures/layouts');
  let analyzer: LayoutAnalyzer;
  let logger: Logger;

  beforeEach(async () => {
    // Create test directory
    await fs.mkdir(testDir, { recursive: true });
    
    // Create logger with minimal output
    logger = new Logger('.kiro/build-logs', false);
    analyzer = new LayoutAnalyzer(testDir, logger);
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Redundant Layout Detection', () => {
    it('should identify layout that only returns children', async () => {
      const layoutContent = `
export default function RedundantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
`;
      const layoutPath = path.join(testDir, 'layout.tsx');
      await fs.writeFile(layoutPath, layoutContent);

      const result = await analyzer.analyzeFile(layoutPath);

      expect(result.category).toBe('redundant');
      expect(result.childrenOnly).toBe(true);
      expect(result.hasLogic).toBe(false);
      expect(result.hasStyles).toBe(false);
    });

    it('should identify layout that returns children in fragment', async () => {
      const layoutContent = `
export default function RedundantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
`;
      const layoutPath = path.join(testDir, 'layout.tsx');
      await fs.writeFile(layoutPath, layoutContent);

      const result = await analyzer.analyzeFile(layoutPath);

      expect(result.category).toBe('redundant');
      expect(result.childrenOnly).toBe(true);
    });

    it('should identify layout with only export const dynamic', async () => {
      const layoutContent = `
export const dynamic = 'force-dynamic';

export default function RedundantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
`;
      const layoutPath = path.join(testDir, 'layout.tsx');
      await fs.writeFile(layoutPath, layoutContent);

      const result = await analyzer.analyzeFile(layoutPath);

      expect(result.category).toBe('redundant');
      expect(result.childrenOnly).toBe(true);
    });
  });

  describe('Necessary Layout Preservation', () => {
    it('should preserve layout with business logic (hooks)', async () => {
      const layoutContent = `
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = useSession();
  
  if (!session) {
    redirect('/auth');
  }
  
  return <div>{children}</div>;
}
`;
      const layoutPath = path.join(testDir, 'layout.tsx');
      await fs.writeFile(layoutPath, layoutContent);

      const result = await analyzer.analyzeFile(layoutPath);

      expect(result.category).toBe('necessary');
      expect(result.hasLogic).toBe(true);
      expect(result.hasImports).toBe(true);
    });

    it('should preserve layout with styles', async () => {
      const layoutContent = `
export default function StyledLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="container mx-auto">{children}</div>;
}
`;
      const layoutPath = path.join(testDir, 'layout.tsx');
      await fs.writeFile(layoutPath, layoutContent);

      const result = await analyzer.analyzeFile(layoutPath);

      expect(result.category).toBe('necessary');
      expect(result.hasStyles).toBe(true);
    });

    it('should preserve layout with wrapper components', async () => {
      const layoutContent = `
import { AppShell } from '@/components/layout/AppShell';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
`;
      const layoutPath = path.join(testDir, 'layout.tsx');
      await fs.writeFile(layoutPath, layoutContent);

      const result = await analyzer.analyzeFile(layoutPath);

      expect(result.category).toBe('necessary');
      expect(result.hasImports).toBe(true);
      expect(result.childrenOnly).toBe(false);
    });

    it('should preserve layout with conditional rendering', async () => {
      const layoutContent = `
export default function ConditionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isReady = true;
  
  return isReady ? <div>{children}</div> : null;
}
`;
      const layoutPath = path.join(testDir, 'layout.tsx');
      await fs.writeFile(layoutPath, layoutContent);

      const result = await analyzer.analyzeFile(layoutPath);

      expect(result.category).toBe('necessary');
      expect(result.hasLogic).toBe(true);
    });

    it('should preserve layout with inline styles', async () => {
      const layoutContent = `
export default function InlineStyledLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div style={{ padding: '20px' }}>{children}</div>;
}
`;
      const layoutPath = path.join(testDir, 'layout.tsx');
      await fs.writeFile(layoutPath, layoutContent);

      const result = await analyzer.analyzeFile(layoutPath);

      expect(result.category).toBe('necessary');
      expect(result.hasStyles).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty file', async () => {
      const layoutPath = path.join(testDir, 'layout.tsx');
      await fs.writeFile(layoutPath, '');

      const result = await analyzer.analyzeFile(layoutPath);

      expect(result.category).toBe('review');
    });

    it('should handle file with only comments', async () => {
      const layoutContent = `
// This is a comment
/* Multi-line
   comment */
`;
      const layoutPath = path.join(testDir, 'layout.tsx');
      await fs.writeFile(layoutPath, layoutContent);

      const result = await analyzer.analyzeFile(layoutPath);

      expect(result.category).toBe('review');
    });

    it('should handle layout with complex JSX', async () => {
      const layoutContent = `
export default function ComplexLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <header>Header</header>
      <main>{children}</main>
      <footer>Footer</footer>
    </div>
  );
}
`;
      const layoutPath = path.join(testDir, 'layout.tsx');
      await fs.writeFile(layoutPath, layoutContent);

      const result = await analyzer.analyzeFile(layoutPath);

      expect(result.category).toBe('necessary');
      expect(result.childrenOnly).toBe(false);
    });

    it('should handle layout with metadata export', async () => {
      const layoutContent = `
export const metadata = {
  title: 'My App',
  description: 'App description',
};

export default function MetadataLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
`;
      const layoutPath = path.join(testDir, 'layout.tsx');
      await fs.writeFile(layoutPath, layoutContent);

      const result = await analyzer.analyzeFile(layoutPath);

      // Should be review because it has exports but returns children only
      expect(result.category).toBe('redundant');
    });

    it('should handle syntax errors gracefully', async () => {
      const layoutContent = `
export default function BrokenLayout({
  children
}) {
  return children
  // Missing semicolon and closing brace
`;
      const layoutPath = path.join(testDir, 'layout.tsx');
      await fs.writeFile(layoutPath, layoutContent);

      const result = await analyzer.analyzeFile(layoutPath);

      // Should still analyze what it can
      expect(result).toBeDefined();
      expect(result.path).toBe(layoutPath);
    });
  });

  describe('Analysis Report Generation', () => {
    it('should generate complete analysis report', async () => {
      // Create multiple test layouts
      const redundantLayout = path.join(testDir, 'redundant', 'layout.tsx');
      const necessaryLayout = path.join(testDir, 'necessary', 'layout.tsx');
      
      await fs.mkdir(path.join(testDir, 'redundant'), { recursive: true });
      await fs.mkdir(path.join(testDir, 'necessary'), { recursive: true });

      await fs.writeFile(redundantLayout, `
export default function RedundantLayout({ children }: { children: React.ReactNode }) {
  return children;
}
`);

      await fs.writeFile(necessaryLayout, `
export default function NecessaryLayout({ children }: { children: React.ReactNode }) {
  return <div className="container">{children}</div>;
}
`);

      const report = await analyzer.analyzeAll();

      expect(report.total).toBe(2);
      expect(report.redundant.length).toBe(1);
      expect(report.necessary.length).toBe(1);
      expect(report.timestamp).toBeDefined();
    });

    it('should handle directory with no layouts', async () => {
      const report = await analyzer.analyzeAll();

      expect(report.total).toBe(0);
      expect(report.redundant.length).toBe(0);
      expect(report.necessary.length).toBe(0);
      expect(report.review.length).toBe(0);
    });

    it('should categorize multiple layouts correctly', async () => {
      // Create test layouts
      await fs.mkdir(path.join(testDir, 'test1'), { recursive: true });
      await fs.mkdir(path.join(testDir, 'test2'), { recursive: true });
      await fs.mkdir(path.join(testDir, 'test3'), { recursive: true });

      await fs.writeFile(path.join(testDir, 'test1', 'layout.tsx'), `
export default function Layout1({ children }: { children: React.ReactNode }) {
  return children;
}
`);

      await fs.writeFile(path.join(testDir, 'test2', 'layout.tsx'), `
export default function Layout2({ children }: { children: React.ReactNode }) {
  return <div className="wrapper">{children}</div>;
}
`);

      await fs.writeFile(path.join(testDir, 'test3', 'layout.tsx'), `
import { useSession } from 'next-auth/react';
export default function Layout3({ children }: { children: React.ReactNode }) {
  const session = useSession();
  return <div>{children}</div>;
}
`);

      const report = await analyzer.analyzeAll();

      expect(report.total).toBe(3);
      expect(report.redundant.length).toBe(1);
      expect(report.necessary.length).toBe(2);
    });
  });

  describe('Import Detection', () => {
    it('should detect non-React imports', async () => {
      const layoutContent = `
import { AppShell } from '@/components/layout/AppShell';
import { redirect } from 'next/navigation';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
`;
      const layoutPath = path.join(testDir, 'layout.tsx');
      await fs.writeFile(layoutPath, layoutContent);

      const result = await analyzer.analyzeFile(layoutPath);

      expect(result.hasImports).toBe(true);
    });

    it('should ignore React imports', async () => {
      const layoutContent = `
import React from 'react';

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
`;
      const layoutPath = path.join(testDir, 'layout.tsx');
      await fs.writeFile(layoutPath, layoutContent);

      const result = await analyzer.analyzeFile(layoutPath);

      expect(result.hasImports).toBe(false);
    });

    it('should ignore type imports', async () => {
      const layoutContent = `
import type { ReactNode } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
`;
      const layoutPath = path.join(testDir, 'layout.tsx');
      await fs.writeFile(layoutPath, layoutContent);

      const result = await analyzer.analyzeFile(layoutPath);

      expect(result.hasImports).toBe(false);
    });
  });
});
