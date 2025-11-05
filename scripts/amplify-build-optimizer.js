#!/usr/bin/env node

/**
 * Amplify Build Optimizer
 * Optimizes Next.js build process for Amplify environment
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class AmplifyBuildOptimizer {
  constructor() {
    this.buildStartTime = Date.now();
    this.memoryLimit = process.env.NODE_OPTIONS?.includes('max-old-space-size') 
      ? parseInt(process.env.NODE_OPTIONS.match(/--max-old-space-size=(\d+)/)?.[1] || '4096')
      : 4096;
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`[${timestamp}] ${prefix} ${message}`);
  }

  optimizeMemoryUsage() {
    this.log('Optimizing memory usage for build...');
    
    // Set Node.js memory options if not already set
    if (!process.env.NODE_OPTIONS?.includes('max-old-space-size')) {
      process.env.NODE_OPTIONS = `--max-old-space-size=${this.memoryLimit}`;
      this.log(`Set Node.js memory limit to ${this.memoryLimit}MB`);
    }

    // Set Next.js specific optimizations
    process.env.NEXT_TELEMETRY_DISABLED = '1'; // Disable telemetry for faster builds
    process.env.NEXT_PRIVATE_STANDALONE = 'true'; // Enable standalone mode for smaller bundles
    
    this.log('Memory optimizations applied');
  }

  configureBuildSettings() {
    this.log('Configuring build settings...');
    
    // Set build environment variables
    const buildEnvVars = {
      'NODE_ENV': 'production',
      'SKIP_ENV_VALIDATION': '1',
      'NEXT_TELEMETRY_DISABLED': '1',
      'CI': 'true'
    };

    Object.entries(buildEnvVars).forEach(([key, value]) => {
      if (!process.env[key]) {
        process.env[key] = value;
        this.log(`Set ${key}=${value}`);
      }
    });

    this.log('Build settings configured');
  }

  async runBuild() {
    this.log('Starting Next.js build...');
    
    try {
      // Run the build with proper error handling
      const buildCommand = 'npx next build';
      this.log(`Executing: ${buildCommand}`);
      
      const buildOutput = execSync(buildCommand, {
        stdio: 'pipe',
        encoding: 'utf8',
        maxBuffer: 1024 * 1024 * 10, // 10MB buffer
        timeout: 600000 // 10 minute timeout
      });

      this.log('Build output:');
      console.log(buildOutput);
      
      const buildTime = Math.round((Date.now() - this.buildStartTime) / 1000);
      this.log(`Build completed successfully in ${buildTime} seconds`);
      
      return true;
    } catch (error) {
      this.handleBuildErrors(error);
      return false;
    }
  }

  handleBuildErrors(error) {
    this.log('Build failed with error:', 'error');
    
    if (error.code === 'ENOENT') {
      this.log('Next.js CLI not found. Ensure Next.js is installed.', 'error');
    } else if (error.signal === 'SIGKILL') {
      this.log('Build process was killed, likely due to memory constraints.', 'error');
      this.log(`Consider increasing memory limit (current: ${this.memoryLimit}MB)`, 'error');
    } else if (error.status === 1) {
      this.log('Build failed with compilation errors:', 'error');
      if (error.stdout) {
        console.log('STDOUT:', error.stdout);
      }
      if (error.stderr) {
        console.log('STDERR:', error.stderr);
      }
    }

    // Provide specific error guidance
    const errorMessage = error.message || error.toString();
    
    if (errorMessage.includes('JavaScript heap out of memory')) {
      this.log('Memory Error: Increase NODE_OPTIONS --max-old-space-size value', 'error');
    } else if (errorMessage.includes('EMFILE') || errorMessage.includes('too many open files')) {
      this.log('File System Error: Too many open files. This may be a dependency issue.', 'error');
    } else if (errorMessage.includes('Module not found')) {
      this.log('Dependency Error: Missing module. Run npm install to fix dependencies.', 'error');
    }

    throw error;
  }

  validateArtifacts() {
    this.log('Validating build artifacts...');
    
    const nextDir = path.join(process.cwd(), '.next');
    
    // Check if .next directory exists
    if (!fs.existsSync(nextDir)) {
      this.log('Build directory (.next) not found', 'error');
      throw new Error('Build artifacts validation failed - no build directory');
    }

    // Check required files and directories
    const requiredPaths = [
      '.next/BUILD_ID',
      '.next/static',
      '.next/server',
      '.next/server/app',
      '.next/static/chunks'
    ];

    const missingPaths = requiredPaths.filter(filePath => 
      !fs.existsSync(path.join(process.cwd(), filePath))
    );

    if (missingPaths.length > 0) {
      this.log(`Missing build artifacts: ${missingPaths.join(', ')}`, 'error');
      throw new Error('Build artifacts validation failed - missing required files');
    }

    // Validate specific build artifacts
    this.validateBuildId();
    this.validateStaticAssets();
    this.validateServerFiles();
    this.validateBuildManifest();
    
    // Calculate and report build size
    this.analyzeBuildSize(nextDir);

    this.log('Build artifacts validated successfully');
  }

  validateBuildId() {
    const buildIdPath = path.join(process.cwd(), '.next/BUILD_ID');
    try {
      const buildId = fs.readFileSync(buildIdPath, 'utf8').trim();
      if (!buildId || buildId.length < 10) {
        this.log('Build ID seems invalid or too short', 'warning');
      } else {
        this.log(`Build ID: ${buildId.substring(0, 8)}...`);
      }
    } catch (error) {
      this.log(`Could not read BUILD_ID: ${error.message}`, 'warning');
    }
  }

  validateStaticAssets() {
    const staticDir = path.join(process.cwd(), '.next/static');
    
    try {
      const staticContents = fs.readdirSync(staticDir);
      const hasChunks = staticContents.includes('chunks');
      const hasMedia = staticContents.includes('media');
      
      if (!hasChunks) {
        this.log('No chunks directory found in static assets', 'warning');
      } else {
        const chunksDir = path.join(staticDir, 'chunks');
        const chunkFiles = fs.readdirSync(chunksDir);
        this.log(`Found ${chunkFiles.length} chunk files`);
        
        // Check for main chunks
        const hasMainChunk = chunkFiles.some(file => file.includes('main'));
        const hasAppChunk = chunkFiles.some(file => file.includes('app'));
        
        if (!hasMainChunk) {
          this.log('Main chunk not found - this may indicate build issues', 'warning');
        }
        
        if (!hasAppChunk) {
          this.log('App chunk not found - this may be normal for some configurations', 'info');
        }
      }
      
      if (hasMedia) {
        this.log('Media assets found in static directory');
      }
      
    } catch (error) {
      this.log(`Could not validate static assets: ${error.message}`, 'warning');
    }
  }

  validateServerFiles() {
    const serverDir = path.join(process.cwd(), '.next/server');
    
    try {
      const serverContents = fs.readdirSync(serverDir);
      const hasApp = serverContents.includes('app');
      const hasPages = serverContents.includes('pages');
      
      if (hasApp) {
        this.log('App Router build detected');
        
        // Check for layout files
        const appDir = path.join(serverDir, 'app');
        if (fs.existsSync(appDir)) {
          const appContents = fs.readdirSync(appDir);
          const hasLayout = appContents.some(file => file.includes('layout'));
          
          if (!hasLayout) {
            this.log('No layout files found in app directory', 'warning');
          }
        }
      }
      
      if (hasPages) {
        this.log('Pages Router build detected');
      }
      
      if (!hasApp && !hasPages) {
        this.log('No app or pages directory found in server build', 'warning');
      }
      
    } catch (error) {
      this.log(`Could not validate server files: ${error.message}`, 'warning');
    }
  }

  validateBuildManifest() {
    const manifestPaths = [
      '.next/build-manifest.json',
      '.next/prerender-manifest.json',
      '.next/routes-manifest.json'
    ];

    manifestPaths.forEach(manifestPath => {
      const fullPath = path.join(process.cwd(), manifestPath);
      if (fs.existsSync(fullPath)) {
        try {
          const manifest = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
          this.log(`${path.basename(manifestPath)} validated`);
          
          // Specific validations for build manifest
          if (manifestPath.includes('build-manifest')) {
            const pages = Object.keys(manifest.pages || {});
            this.log(`Build manifest contains ${pages.length} pages`);
          }
          
        } catch (error) {
          this.log(`Invalid JSON in ${manifestPath}: ${error.message}`, 'warning');
        }
      } else {
        this.log(`${path.basename(manifestPath)} not found`, 'info');
      }
    });
  }

  analyzeBuildSize(nextDir) {
    try {
      const buildSize = this.calculateDirectorySize(nextDir);
      const buildSizeMB = Math.round(buildSize / (1024 * 1024));
      
      this.log(`Total build size: ${buildSizeMB}MB`);
      
      // Analyze size breakdown
      const sizeBreakdown = this.calculateSizeBreakdown(nextDir);
      
      Object.entries(sizeBreakdown).forEach(([dir, sizeMB]) => {
        if (sizeMB > 0) {
          this.log(`  ${dir}: ${sizeMB}MB`);
        }
      });
      
      // Provide size recommendations
      if (buildSizeMB > 500) {
        this.log(`Build size (${buildSizeMB}MB) is large. Consider optimizing:`, 'warning');
        this.log('  - Enable tree shaking for unused code', 'warning');
        this.log('  - Optimize images and media assets', 'warning');
        this.log('  - Review large dependencies', 'warning');
      } else if (buildSizeMB > 200) {
        this.log(`Build size (${buildSizeMB}MB) is moderate. Monitor for growth.`, 'info');
      } else {
        this.log(`Build size (${buildSizeMB}MB) is optimal`, 'info');
      }
      
    } catch (error) {
      this.log(`Could not analyze build size: ${error.message}`, 'warning');
    }
  }

  calculateSizeBreakdown(nextDir) {
    const breakdown = {};
    
    try {
      const subdirs = ['static', 'server', 'cache'];
      
      subdirs.forEach(subdir => {
        const subdirPath = path.join(nextDir, subdir);
        if (fs.existsSync(subdirPath)) {
          const size = this.calculateDirectorySize(subdirPath);
          breakdown[subdir] = Math.round(size / (1024 * 1024));
        } else {
          breakdown[subdir] = 0;
        }
      });
      
    } catch (error) {
      // Ignore errors in size calculation
    }
    
    return breakdown;
  }

  calculateDirectorySize(dirPath) {
    let totalSize = 0;
    
    try {
      const files = fs.readdirSync(dirPath);
      
      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stats = fs.statSync(filePath);
        
        if (stats.isDirectory()) {
          totalSize += this.calculateDirectorySize(filePath);
        } else {
          totalSize += stats.size;
        }
      }
    } catch (error) {
      // Ignore errors for inaccessible files/directories
    }
    
    return totalSize;
  }

  generateBuildReport() {
    const buildTime = Math.round((Date.now() - this.buildStartTime) / 1000);
    const memoryUsage = process.memoryUsage();
    
    const report = {
      buildTime: `${buildTime}s`,
      memoryLimit: `${this.memoryLimit}MB`,
      memoryUsed: `${Math.round(memoryUsage.heapUsed / (1024 * 1024))}MB`,
      nodeVersion: process.version,
      timestamp: new Date().toISOString()
    };

    this.log('=== BUILD REPORT ===');
    Object.entries(report).forEach(([key, value]) => {
      this.log(`${key}: ${value}`);
    });

    return report;
  }

  async run() {
    try {
      this.log('Starting Amplify build optimization...');
      
      this.optimizeMemoryUsage();
      this.configureBuildSettings();
      
      const buildSuccess = await this.runBuild();
      
      if (buildSuccess) {
        this.validateArtifacts();
        this.generateBuildReport();
        this.log('Build optimization completed successfully!');
        return true;
      }
      
      return false;
      
    } catch (error) {
      this.log(`Build optimization failed: ${error.message}`, 'error');
      throw error;
    }
  }
}

// Run optimizer if this script is executed directly
if (require.main === module) {
  const optimizer = new AmplifyBuildOptimizer();
  optimizer.run().catch(error => {
    console.error('Build optimization failed:', error);
    process.exit(1);
  });
}

module.exports = AmplifyBuildOptimizer;