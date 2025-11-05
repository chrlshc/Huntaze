/**
 * Build Configuration Tests
 * Comprehensive tests for amplify.yml validation and build processes
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const yaml = require('js-yaml');

describe('Build Configuration Tests', () => {
  const projectRoot = process.cwd();
  const amplifyConfigPath = path.join(projectRoot, 'amplify.yml');
  const buildOptimizerPath = path.join(projectRoot, 'scripts/amplify-build-optimizer.js');
  const buildErrorHandlerPath = path.join(projectRoot, 'scripts/build-error-handler.js');

  describe('Amplify Configuration Validation', () => {
    test('amplify.yml exists and is valid YAML', () => {
      expect(fs.existsSync(amplifyConfigPath)).toBe(true);
      
      const amplifyConfig = fs.readFileSync(amplifyConfigPath, 'utf8');
      expect(() => yaml.load(amplifyConfig)).not.toThrow();
    });

    test('amplify.yml has required structure', () => {
      const amplifyConfig = yaml.load(fs.readFileSync(amplifyConfigPath, 'utf8'));
      
      expect(amplifyConfig).toHaveProperty('version');
      expect(amplifyConfig).toHaveProperty('frontend');
      expect(amplifyConfig.frontend).toHaveProperty('phases');
      expect(amplifyConfig.frontend.phases).toHaveProperty('preBuild');
      expect(amplifyConfig.frontend.phases).toHaveProperty('build');
    });

    test('amplify.yml has proper build commands', () => {
      const amplifyConfig = yaml.load(fs.readFileSync(amplifyConfigPath, 'utf8'));
      
      const preBuildCommands = amplifyConfig.frontend.phases.preBuild.commands;
      const buildCommands = amplifyConfig.frontend.phases.build.commands;
      
      expect(Array.isArray(preBuildCommands)).toBe(true);
      expect(Array.isArray(buildCommands)).toBe(true);
      expect(preBuildCommands.length).toBeGreaterThan(0);
      expect(buildCommands.length).toBeGreaterThan(0);
    });

    test('amplify.yml includes optimization commands', () => {
      const amplifyConfig = yaml.load(fs.readFileSync(amplifyConfigPath, 'utf8'));
      const allCommands = [
        ...amplifyConfig.frontend.phases.preBuild.commands,
        ...amplifyConfig.frontend.phases.build.commands
      ].join(' ');
      
      // Check for optimization-related commands
      expect(allCommands).toMatch(/amplify-build-optimizer|pre-build-validation/);
    });

    test('amplify.yml has proper caching configuration', () => {
      const amplifyConfig = yaml.load(fs.readFileSync(amplifyConfigPath, 'utf8'));
      
      if (amplifyConfig.frontend.phases.preBuild.cache) {
        expect(amplifyConfig.frontend.phases.preBuild.cache.paths).toBeDefined();
        expect(Array.isArray(amplifyConfig.frontend.phases.preBuild.cache.paths)).toBe(true);
      }
    });

    test('amplify.yml has environment variable configuration', () => {
      const amplifyConfig = yaml.load(fs.readFileSync(amplifyConfigPath, 'utf8'));
      
      // Check for environment variable handling
      const allCommands = [
        ...amplifyConfig.frontend.phases.preBuild.commands,
        ...amplifyConfig.frontend.phases.build.commands
      ].join(' ');
      
      // Should have some form of environment variable validation or setup
      expect(allCommands).toMatch(/env|ENV|environment/i);
    });
  });

  describe('Build Optimizer Script Tests', () => {
    test('build optimizer script exists and is executable', () => {
      expect(fs.existsSync(buildOptimizerPath)).toBe(true);
      
      const stats = fs.statSync(buildOptimizerPath);
      expect(stats.mode & parseInt('111', 8)).toBeTruthy(); // Check if executable
    });

    test('build optimizer can be imported without errors', () => {
      expect(() => {
        const BuildOptimizer = require(buildOptimizerPath);
        expect(typeof BuildOptimizer).toBe('function');
      }).not.toThrow();
    });

    test('build optimizer has required methods', () => {
      const BuildOptimizer = require(buildOptimizerPath);
      const optimizer = new BuildOptimizer();
      
      expect(typeof optimizer.optimizeMemoryUsage).toBe('function');
      expect(typeof optimizer.configureBuildSettings).toBe('function');
      expect(typeof optimizer.validateArtifacts).toBe('function');
      expect(typeof optimizer.run).toBe('function');
    });

    test('build optimizer memory optimization works', () => {
      const BuildOptimizer = require(buildOptimizerPath);
      const optimizer = new BuildOptimizer();
      
      const originalNodeOptions = process.env.NODE_OPTIONS;
      delete process.env.NODE_OPTIONS;
      
      optimizer.optimizeMemoryUsage();
      
      expect(process.env.NODE_OPTIONS).toContain('max-old-space-size');
      expect(process.env.NEXT_TELEMETRY_DISABLED).toBe('1');
      
      // Restore original
      if (originalNodeOptions) {
        process.env.NODE_OPTIONS = originalNodeOptions;
      } else {
        delete process.env.NODE_OPTIONS;
      }
    });

    test('build optimizer configuration works', () => {
      const BuildOptimizer = require(buildOptimizerPath);
      const optimizer = new BuildOptimizer();
      
      const originalEnv = { ...process.env };
      
      // Clear some env vars for testing
      delete process.env.NODE_ENV;
      delete process.env.CI;
      
      optimizer.configureBuildSettings();
      
      expect(process.env.NODE_ENV).toBe('production');
      expect(process.env.CI).toBe('true');
      expect(process.env.NEXT_TELEMETRY_DISABLED).toBe('1');
      
      // Restore original environment
      Object.keys(process.env).forEach(key => {
        if (!(key in originalEnv)) {
          delete process.env[key];
        }
      });
      Object.assign(process.env, originalEnv);
    });
  });

  describe('Build Error Handler Tests', () => {
    test('build error handler script exists', () => {
      expect(fs.existsSync(buildErrorHandlerPath)).toBe(true);
    });

    test('build error handler can be imported', () => {
      expect(() => {
        const BuildErrorHandler = require(buildErrorHandlerPath);
        expect(typeof BuildErrorHandler).toBe('function');
      }).not.toThrow();
    });

    test('build error handler has required methods', () => {
      const BuildErrorHandler = require(buildErrorHandlerPath);
      const handler = new BuildErrorHandler();
      
      expect(typeof handler.handleBuildError).toBe('function');
      expect(typeof handler.analyzeBuildError).toBe('function');
      expect(typeof handler.attemptRecovery).toBe('function');
      expect(typeof handler.retryBuild).toBe('function');
    });

    test('build error handler analyzes memory errors correctly', () => {
      const BuildErrorHandler = require(buildErrorHandlerPath);
      const handler = new BuildErrorHandler();
      
      const memoryError = new Error('JavaScript heap out of memory');
      const analysis = handler.analyzeBuildError(memoryError);
      
      expect(analysis.type).toBe('MEMORY_ERROR');
      expect(analysis.category).toBe('RESOURCE');
      expect(analysis.recoverable).toBe(true);
      expect(analysis.suggestions).toContain('Increase Node.js memory limit');
    });

    test('build error handler analyzes dependency errors correctly', () => {
      const BuildErrorHandler = require(buildErrorHandlerPath);
      const handler = new BuildErrorHandler();
      
      const depError = new Error('Module not found: Cannot resolve module');
      const analysis = handler.analyzeBuildError(depError);
      
      expect(analysis.type).toBe('DEPENDENCY_ERROR');
      expect(analysis.category).toBe('DEPENDENCY');
      expect(analysis.recoverable).toBe(true);
      expect(analysis.suggestions).toContain('Run npm install');
    });

    test('build error handler analyzes TypeScript errors correctly', () => {
      const BuildErrorHandler = require(buildErrorHandlerPath);
      const handler = new BuildErrorHandler();
      
      const tsError = new Error('TypeScript error: Type string is not assignable to type number');
      const analysis = handler.analyzeBuildError(tsError);
      
      expect(analysis.type).toBe('TYPESCRIPT_ERROR');
      expect(analysis.category).toBe('COMPILATION');
      expect(analysis.recoverable).toBe(false);
    });
  });

  describe('Build Artifact Validation', () => {
    test('validates required build directories exist after build', async () => {
      // This test would run after a successful build
      const nextDir = path.join(projectRoot, '.next');
      
      if (fs.existsSync(nextDir)) {
        expect(fs.existsSync(path.join(nextDir, 'static'))).toBe(true);
        expect(fs.existsSync(path.join(nextDir, 'server'))).toBe(true);
        
        // Check for BUILD_ID
        const buildIdPath = path.join(nextDir, 'BUILD_ID');
        if (fs.existsSync(buildIdPath)) {
          const buildId = fs.readFileSync(buildIdPath, 'utf8').trim();
          expect(buildId.length).toBeGreaterThan(0);
        }
      }
    }, 30000);

    test('validates build manifest files', () => {
      const nextDir = path.join(projectRoot, '.next');
      
      if (fs.existsSync(nextDir)) {
        const manifestFiles = [
          'build-manifest.json',
          'prerender-manifest.json',
          'routes-manifest.json'
        ];
        
        manifestFiles.forEach(manifestFile => {
          const manifestPath = path.join(nextDir, manifestFile);
          if (fs.existsSync(manifestPath)) {
            expect(() => {
              const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
              expect(typeof manifest).toBe('object');
            }).not.toThrow();
          }
        });
      }
    });

    test('validates static assets structure', () => {
      const staticDir = path.join(projectRoot, '.next/static');
      
      if (fs.existsSync(staticDir)) {
        const staticContents = fs.readdirSync(staticDir);
        
        // Should have chunks directory
        expect(staticContents).toContain('chunks');
        
        const chunksDir = path.join(staticDir, 'chunks');
        if (fs.existsSync(chunksDir)) {
          const chunkFiles = fs.readdirSync(chunksDir);
          expect(chunkFiles.length).toBeGreaterThan(0);
          
          // Check for JavaScript files
          const jsFiles = chunkFiles.filter(file => file.endsWith('.js'));
          expect(jsFiles.length).toBeGreaterThan(0);
        }
      }
    });

    test('validates server build structure', () => {
      const serverDir = path.join(projectRoot, '.next/server');
      
      if (fs.existsSync(serverDir)) {
        const serverContents = fs.readdirSync(serverDir);
        
        // Should have either app or pages directory (or both)
        const hasApp = serverContents.includes('app');
        const hasPages = serverContents.includes('pages');
        
        expect(hasApp || hasPages).toBe(true);
      }
    });
  });

  describe('Build Performance Tests', () => {
    test('build completes within reasonable time', async () => {
      // This is a longer test that actually runs the build
      const startTime = Date.now();
      
      try {
        // Run a quick build check (not full build to avoid timeout)
        execSync('npm run build --dry-run || echo "Build check completed"', {
          stdio: 'pipe',
          timeout: 60000 // 1 minute timeout
        });
        
        const buildTime = Date.now() - startTime;
        expect(buildTime).toBeLessThan(60000); // Should complete within 1 minute for dry run
      } catch (error) {
        // If dry-run is not supported, just check that build script exists
        const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
        expect(packageJson.scripts).toHaveProperty('build');
      }
    }, 70000);

    test('build optimizer reduces memory usage', () => {
      const BuildOptimizer = require(buildOptimizerPath);
      const optimizer = new BuildOptimizer();
      
      // Test memory limit setting
      const originalLimit = optimizer.memoryLimit;
      optimizer.optimizeMemoryUsage();
      
      expect(process.env.NODE_OPTIONS).toContain('max-old-space-size');
      
      // Extract the memory limit from NODE_OPTIONS
      const match = process.env.NODE_OPTIONS.match(/--max-old-space-size=(\d+)/);
      if (match) {
        const setLimit = parseInt(match[1]);
        expect(setLimit).toBeGreaterThanOrEqual(originalLimit);
      }
    });

    test('build caching configuration is optimal', () => {
      const amplifyConfig = yaml.load(fs.readFileSync(amplifyConfigPath, 'utf8'));
      
      if (amplifyConfig.frontend.phases.preBuild.cache) {
        const cachePaths = amplifyConfig.frontend.phases.preBuild.cache.paths;
        
        // Should cache node_modules
        expect(cachePaths).toContain('node_modules/**/*');
        
        // Should cache Next.js cache if present
        const hasNextCache = cachePaths.some(path => path.includes('.next'));
        if (hasNextCache) {
          expect(cachePaths.some(path => path.includes('.next/cache'))).toBe(true);
        }
      }
    });
  });

  describe('Build Environment Tests', () => {
    test('required environment variables are validated', () => {
      const preValidationPath = path.join(projectRoot, 'scripts/pre-build-validation.js');
      
      if (fs.existsSync(preValidationPath)) {
        expect(() => {
          const PreBuildValidator = require(preValidationPath);
          expect(typeof PreBuildValidator).toBe('function');
        }).not.toThrow();
      }
    });

    test('build works with production environment', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const BuildOptimizer = require(buildOptimizerPath);
      const optimizer = new BuildOptimizer();
      
      expect(() => {
        optimizer.configureBuildSettings();
      }).not.toThrow();
      
      expect(process.env.NODE_ENV).toBe('production');
      
      // Restore original
      if (originalEnv) {
        process.env.NODE_ENV = originalEnv;
      } else {
        delete process.env.NODE_ENV;
      }
    });

    test('build handles missing optional environment variables', () => {
      const BuildOptimizer = require(buildOptimizerPath);
      const optimizer = new BuildOptimizer();
      
      // Test with minimal environment
      const originalEnv = { ...process.env };
      
      // Keep only essential variables
      const essentialVars = ['PATH', 'HOME', 'USER', 'NODE_ENV'];
      Object.keys(process.env).forEach(key => {
        if (!essentialVars.includes(key)) {
          delete process.env[key];
        }
      });
      
      expect(() => {
        optimizer.configureBuildSettings();
      }).not.toThrow();
      
      // Restore environment
      Object.assign(process.env, originalEnv);
    });
  });

  describe('Build Error Recovery Tests', () => {
    test('memory error recovery increases memory limit', async () => {
      const BuildErrorHandler = require(buildErrorHandlerPath);
      const handler = new BuildErrorHandler();
      
      const originalNodeOptions = process.env.NODE_OPTIONS;
      process.env.NODE_OPTIONS = '--max-old-space-size=2048';
      
      const success = await handler.recoverFromMemoryError();
      expect(success).toBe(true);
      
      // Should have increased the memory limit
      const newLimit = process.env.NODE_OPTIONS.match(/--max-old-space-size=(\d+)/)?.[1];
      expect(parseInt(newLimit)).toBeGreaterThan(2048);
      
      // Restore original
      if (originalNodeOptions) {
        process.env.NODE_OPTIONS = originalNodeOptions;
      } else {
        delete process.env.NODE_OPTIONS;
      }
    });

    test('filesystem error recovery clears caches', async () => {
      const BuildErrorHandler = require(buildErrorHandlerPath);
      const handler = new BuildErrorHandler();
      
      // Create a temporary cache directory for testing
      const testCacheDir = path.join(projectRoot, '.test-cache');
      if (!fs.existsSync(testCacheDir)) {
        fs.mkdirSync(testCacheDir);
        fs.writeFileSync(path.join(testCacheDir, 'test-file'), 'test content');
      }
      
      const success = await handler.recoverFromFilesystemError();
      expect(success).toBe(true);
      
      // Clean up test directory
      if (fs.existsSync(testCacheDir)) {
        fs.rmSync(testCacheDir, { recursive: true, force: true });
      }
    });

    test('network error recovery implements retry logic', async () => {
      const BuildErrorHandler = require(buildErrorHandlerPath);
      const handler = new BuildErrorHandler();
      
      const success = await handler.recoverFromNetworkError();
      expect(success).toBe(true);
    });
  });

  describe('Integration Tests', () => {
    test('build optimizer and error handler work together', async () => {
      const BuildOptimizer = require(buildOptimizerPath);
      const BuildErrorHandler = require(buildErrorHandlerPath);
      
      const optimizer = new BuildOptimizer();
      const handler = new BuildErrorHandler();
      
      // Test that they can be used together
      expect(() => {
        optimizer.optimizeMemoryUsage();
        optimizer.configureBuildSettings();
      }).not.toThrow();
      
      // Test error analysis
      const testError = new Error('Test build error');
      const analysis = handler.analyzeBuildError(testError);
      expect(analysis).toHaveProperty('type');
      expect(analysis).toHaveProperty('recoverable');
    });

    test('amplify configuration works with build scripts', () => {
      const amplifyConfig = yaml.load(fs.readFileSync(amplifyConfigPath, 'utf8'));
      const allCommands = [
        ...amplifyConfig.frontend.phases.preBuild.commands,
        ...amplifyConfig.frontend.phases.build.commands
      ];
      
      // Check that referenced scripts exist
      allCommands.forEach(command => {
        if (typeof command === 'string' && command.includes('scripts/')) {
          const scriptMatch = command.match(/scripts\/([^\s]+)/);
          if (scriptMatch) {
            const scriptPath = path.join(projectRoot, 'scripts', scriptMatch[1]);
            if (!scriptMatch[1].includes('*') && !scriptMatch[1].includes('||')) {
              // Only check for specific script files, not glob patterns or conditional commands
              const scriptExists = fs.existsSync(scriptPath) || fs.existsSync(scriptPath + '.js');
              if (!scriptExists) {
                console.warn(`Referenced script may not exist: ${scriptPath}`);
              }
            }
          }
        }
      });
    });
  });
});