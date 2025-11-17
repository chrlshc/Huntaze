import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import { LayoutCleaner, CleanupOptions } from '../../../scripts/layout-cleanup/layout-cleaner';
import { Logger } from '../../../scripts/layout-cleanup/utils/logger';
import { fileExists } from '../../../scripts/layout-cleanup/utils/file-operations';

describe('LayoutCleaner Integration Tests', () => {
  const testDir = path.join(process.cwd(), 'tests/fixtures/cleanup-test');
  const backupDir = path.join(process.cwd(), '.kiro/backups/layouts-test');
  let logger: Logger;

  beforeEach(async () => {
    // Clean up any existing test directories first
    try {
      await fs.rm(testDir, { recursive: true, force: true });
      await fs.rm(backupDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
    
    // Create fresh test directory structure
    await fs.mkdir(testDir, { recursive: true });
    await fs.mkdir(backupDir, { recursive: true });
    
    // Create logger with minimal output
    logger = new Logger('.kiro/build-logs', false);
  });

  afterEach(async () => {
    // Clean up test directories
    try {
      await fs.rm(testDir, { recursive: true, force: true });
      await fs.rm(backupDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Successful Cleanup Flow', () => {
    it('should successfully clean up redundant layouts in dry-run mode', async () => {
      // Create test layouts
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

      const options: CleanupOptions = {
        dryRun: true,
        backup: true,
        validate: false,
        verbose: false,
      };

      const cleaner = new LayoutCleaner(options, testDir, logger);
      const result = await cleaner.cleanup();

      // Verify results
      expect(result.removed.length).toBe(1);
      expect(result.failed.length).toBe(0);
      expect(result.restored.length).toBe(0);
      expect(result.buildSuccess).toBe(true);
      expect(result.redundantFound).toBe(1);

      // Verify files still exist (dry-run)
      expect(fileExists(redundantLayout)).toBe(true);
      expect(fileExists(necessaryLayout)).toBe(true);
    });

    it('should successfully clean up redundant layouts with backup', async () => {
      // Create test layouts
      const redundantLayout = path.join(testDir, 'redundant', 'layout.tsx');
      
      await fs.mkdir(path.join(testDir, 'redundant'), { recursive: true });

      await fs.writeFile(redundantLayout, `
export default function RedundantLayout({ children }: { children: React.ReactNode }) {
  return children;
}
`);

      const options: CleanupOptions = {
        dryRun: false,
        backup: true,
        validate: false,
        verbose: false,
      };

      const cleaner = new LayoutCleaner(options, testDir, logger);
      const result = await cleaner.cleanup();

      // Verify results
      expect(result.removed.length).toBe(1);
      expect(result.failed.length).toBe(0);
      expect(result.buildSuccess).toBe(true);

      // Verify file was deleted
      expect(fileExists(redundantLayout)).toBe(false);

      // Verify backup was created
      const operations = cleaner.getOperations();
      expect(operations.length).toBe(1);
      expect(operations[0].backupPath).toBeDefined();
      if (operations[0].backupPath) {
        expect(fileExists(operations[0].backupPath)).toBe(true);
      }
    });

    it('should handle multiple redundant layouts', async () => {
      // Create multiple redundant layouts
      const layouts = [
        path.join(testDir, 'layout1', 'layout.tsx'),
        path.join(testDir, 'layout2', 'layout.tsx'),
        path.join(testDir, 'layout3', 'layout.tsx'),
      ];

      for (const layoutPath of layouts) {
        await fs.mkdir(path.dirname(layoutPath), { recursive: true });
        await fs.writeFile(layoutPath, `
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
`);
      }

      const options: CleanupOptions = {
        dryRun: false,
        backup: true,
        validate: false,
        verbose: false,
      };

      const cleaner = new LayoutCleaner(options, testDir, logger);
      const result = await cleaner.cleanup();

      // Verify all were removed
      expect(result.removed.length).toBe(3);
      expect(result.failed.length).toBe(0);
      expect(result.redundantFound).toBe(3);

      // Verify all files were deleted
      for (const layoutPath of layouts) {
        expect(fileExists(layoutPath)).toBe(false);
      }
    });

    it('should skip necessary layouts', async () => {
      // Create necessary layout
      const necessaryLayout = path.join(testDir, 'necessary', 'layout.tsx');
      
      await fs.mkdir(path.join(testDir, 'necessary'), { recursive: true });

      await fs.writeFile(necessaryLayout, `
import { AppShell } from '@/components/layout/AppShell';

export default function NecessaryLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
`);

      const options: CleanupOptions = {
        dryRun: false,
        backup: true,
        validate: false,
        verbose: false,
      };

      const cleaner = new LayoutCleaner(options, testDir, logger);
      const result = await cleaner.cleanup();

      // Verify nothing was removed
      expect(result.removed.length).toBe(0);
      expect(result.failed.length).toBe(0);
      expect(result.redundantFound).toBe(0);

      // Verify file still exists
      expect(fileExists(necessaryLayout)).toBe(true);
    });
  });

  describe('Rollback on Build Failure', () => {
    it('should restore file when build validation fails', async () => {
      // Create redundant layout
      const redundantLayout = path.join(testDir, 'redundant', 'layout.tsx');
      
      await fs.mkdir(path.join(testDir, 'redundant'), { recursive: true });

      await fs.writeFile(redundantLayout, `
export default function RedundantLayout({ children }: { children: React.ReactNode }) {
  return children;
}
`);

      const options: CleanupOptions = {
        dryRun: false,
        backup: true,
        validate: true, // Enable validation
        verbose: false,
      };

      const cleaner = new LayoutCleaner(options, testDir, logger);
      
      // Mock the validateBuild method to always fail
      // @ts-ignore - accessing private method for testing
      cleaner['validateBuild'] = vi.fn().mockResolvedValue(false);

      const result = await cleaner.cleanup();

      // Verify file was restored
      expect(result.removed.length).toBe(0);
      expect(result.failed.length).toBe(1);
      expect(result.restored.length).toBe(1);
      expect(result.buildSuccess).toBe(false);

      // Verify file exists (was restored)
      expect(fileExists(redundantLayout)).toBe(true);
    });

    it('should continue with other files after one fails', async () => {
      // Create multiple redundant layouts
      const layout1 = path.join(testDir, 'layout1', 'layout.tsx');
      const layout2 = path.join(testDir, 'layout2', 'layout.tsx');
      
      await fs.mkdir(path.join(testDir, 'layout1'), { recursive: true });
      await fs.mkdir(path.join(testDir, 'layout2'), { recursive: true });

      await fs.writeFile(layout1, `
export default function Layout1({ children }: { children: React.ReactNode }) {
  return children;
}
`);

      await fs.writeFile(layout2, `
export default function Layout2({ children }: { children: React.ReactNode }) {
  return children;
}
`);

      const options: CleanupOptions = {
        dryRun: false,
        backup: true,
        validate: true,
        verbose: false,
      };

      const cleaner = new LayoutCleaner(options, testDir, logger);
      
      // Mock validateBuild to fail on first call, succeed on second
      let callCount = 0;
      // @ts-ignore - accessing private method for testing
      cleaner['validateBuild'] = vi.fn().mockImplementation(() => {
        callCount++;
        return Promise.resolve(callCount > 1);
      });

      const result = await cleaner.cleanup();

      // Verify one succeeded and one failed
      expect(result.removed.length).toBe(1);
      expect(result.failed.length).toBe(1);
      expect(result.restored.length).toBe(1);
    });
  });

  describe('Dry-Run Mode', () => {
    it('should not modify any files in dry-run mode', async () => {
      // Create redundant layout
      const redundantLayout = path.join(testDir, 'redundant', 'layout.tsx');
      
      await fs.mkdir(path.join(testDir, 'redundant'), { recursive: true });

      const originalContent = `
export default function RedundantLayout({ children }: { children: React.ReactNode }) {
  return children;
}
`;
      await fs.writeFile(redundantLayout, originalContent);

      const options: CleanupOptions = {
        dryRun: true,
        backup: true,
        validate: false,
        verbose: false,
      };

      const cleaner = new LayoutCleaner(options, testDir, logger);
      const result = await cleaner.cleanup();

      // Verify file still exists
      expect(fileExists(redundantLayout)).toBe(true);

      // Verify content unchanged
      const content = await fs.readFile(redundantLayout, 'utf-8');
      expect(content).toBe(originalContent);

      // Verify no backups created
      const operations = cleaner.getOperations();
      expect(operations[0].backupPath).toBeUndefined();
    });

    it('should report what would be removed in dry-run', async () => {
      // Create multiple redundant layouts
      const layouts = [
        path.join(testDir, 'layout1', 'layout.tsx'),
        path.join(testDir, 'layout2', 'layout.tsx'),
      ];

      for (const layoutPath of layouts) {
        await fs.mkdir(path.dirname(layoutPath), { recursive: true });
        await fs.writeFile(layoutPath, `
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
`);
      }

      const options: CleanupOptions = {
        dryRun: true,
        backup: false,
        validate: false,
        verbose: false,
      };

      const cleaner = new LayoutCleaner(options, testDir, logger);
      const result = await cleaner.cleanup();

      // Verify report shows what would be removed
      expect(result.removed.length).toBe(2);
      expect(result.redundantFound).toBe(2);

      // Verify all files still exist
      for (const layoutPath of layouts) {
        expect(fileExists(layoutPath)).toBe(true);
      }
    });
  });

  describe('Report Generation', () => {
    it('should generate detailed cleanup report', async () => {
      // Create test layout
      const redundantLayout = path.join(testDir, 'redundant', 'layout.tsx');
      
      await fs.mkdir(path.join(testDir, 'redundant'), { recursive: true });

      await fs.writeFile(redundantLayout, `
export default function RedundantLayout({ children }: { children: React.ReactNode }) {
  return children;
}
`);

      const options: CleanupOptions = {
        dryRun: true,
        backup: true,
        validate: false,
        verbose: false,
      };

      const cleaner = new LayoutCleaner(options, testDir, logger);
      const result = await cleaner.cleanup();

      const report = cleaner.generateReport(result);

      // Verify report contains key information
      expect(report).toContain('LAYOUT CLEANUP REPORT');
      expect(report).toContain('DRY RUN');
      expect(report).toContain('Total Layouts Analyzed');
      expect(report).toContain('Redundant Found');
      expect(report).toContain('Successfully Removed');
      expect(report).toContain(redundantLayout);
    });

    it('should show success status when all operations succeed', async () => {
      const options: CleanupOptions = {
        dryRun: true,
        backup: false,
        validate: false,
        verbose: false,
      };

      const cleaner = new LayoutCleaner(options, testDir, logger);
      const result = await cleaner.cleanup();

      const report = cleaner.generateReport(result);

      expect(report).toContain('✓ SUCCESS');
    });

    it('should show failure status when operations fail', async () => {
      // Create redundant layout
      const redundantLayout = path.join(testDir, 'redundant', 'layout.tsx');
      
      await fs.mkdir(path.join(testDir, 'redundant'), { recursive: true });

      await fs.writeFile(redundantLayout, `
export default function RedundantLayout({ children }: { children: React.ReactNode }) {
  return children;
}
`);

      const options: CleanupOptions = {
        dryRun: false,
        backup: true,
        validate: true,
        verbose: false,
      };

      const cleaner = new LayoutCleaner(options, testDir, logger);
      
      // Mock validateBuild to fail
      // @ts-ignore
      cleaner['validateBuild'] = vi.fn().mockResolvedValue(false);

      const result = await cleaner.cleanup();
      const report = cleaner.generateReport(result);

      expect(report).toContain('✗ PARTIAL FAILURE');
      expect(report).toContain('FAILED FILES');
      expect(report).toContain('RESTORED FILES');
    });
  });

  describe('Error Handling', () => {
    it('should handle file deletion errors gracefully', async () => {
      // Create redundant layout
      const redundantLayout = path.join(testDir, 'redundant', 'layout.tsx');
      
      await fs.mkdir(path.join(testDir, 'redundant'), { recursive: true });

      await fs.writeFile(redundantLayout, `
export default function RedundantLayout({ children }: { children: React.ReactNode }) {
  return children;
}
`);

      const options: CleanupOptions = {
        dryRun: false,
        backup: true,
        validate: false,
        verbose: false,
      };

      const cleaner = new LayoutCleaner(options, testDir, logger);
      
      // Mock deleteFile to throw error
      const { deleteFile } = await import('../../../scripts/layout-cleanup/utils/file-operations');
      vi.spyOn(await import('../../../scripts/layout-cleanup/utils/file-operations'), 'deleteFile')
        .mockRejectedValueOnce(new Error('Permission denied'));

      const result = await cleaner.cleanup();

      // Verify error was handled
      expect(result.failed.length).toBe(1);
      expect(result.removed.length).toBe(0);
    });

    it('should handle backup creation errors', async () => {
      // Create redundant layout
      const redundantLayout = path.join(testDir, 'redundant', 'layout.tsx');
      
      await fs.mkdir(path.join(testDir, 'redundant'), { recursive: true });

      await fs.writeFile(redundantLayout, `
export default function RedundantLayout({ children }: { children: React.ReactNode }) {
  return children;
}
`);

      const options: CleanupOptions = {
        dryRun: false,
        backup: true,
        validate: false,
        verbose: false,
      };

      const cleaner = new LayoutCleaner(options, testDir, logger);
      
      // Mock createBackup to throw error
      vi.spyOn(await import('../../../scripts/layout-cleanup/utils/file-operations'), 'createBackup')
        .mockRejectedValueOnce(new Error('Disk full'));

      const result = await cleaner.cleanup();

      // Verify error was handled
      expect(result.failed.length).toBe(1);
    });
  });

  describe('No Redundant Layouts', () => {
    it('should handle case with no redundant layouts', async () => {
      // Create only necessary layout
      const necessaryLayout = path.join(testDir, 'necessary', 'layout.tsx');
      
      await fs.mkdir(path.join(testDir, 'necessary'), { recursive: true });

      await fs.writeFile(necessaryLayout, `
export default function NecessaryLayout({ children }: { children: React.ReactNode }) {
  return <div className="wrapper">{children}</div>;
}
`);

      const options: CleanupOptions = {
        dryRun: false,
        backup: true,
        validate: false,
        verbose: false,
      };

      const cleaner = new LayoutCleaner(options, testDir, logger);
      const result = await cleaner.cleanup();

      // Verify no operations performed
      expect(result.removed.length).toBe(0);
      expect(result.failed.length).toBe(0);
      expect(result.redundantFound).toBe(0);
      expect(result.buildSuccess).toBe(true);
    });

    it('should handle empty directory', async () => {
      const options: CleanupOptions = {
        dryRun: false,
        backup: true,
        validate: false,
        verbose: false,
      };

      const cleaner = new LayoutCleaner(options, testDir, logger);
      const result = await cleaner.cleanup();

      // Verify no operations performed
      expect(result.totalAnalyzed).toBe(0);
      expect(result.redundantFound).toBe(0);
      expect(result.removed.length).toBe(0);
    });
  });
});
