#!/usr/bin/env tsx
/**
 * OAuth Credentials Validation CLI
 * 
 * Command-line tool to validate OAuth credentials for all platforms
 */

import { OAuthValidators } from '../lib/security/oauth-validators';
import * as fs from 'fs/promises';
import * as path from 'path';

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

class OAuthValidationCLI {
  async run() {
    const args = process.argv.slice(2);
    const command = args[0] || 'validate';

    console.log(`${colors.cyan}${colors.bright}🔐 OAuth Credentials Validator${colors.reset}\n`);

    try {
      switch (command) {
        case 'validate':
          await this.validateAll();
          break;
        case 'tiktok':
          await this.validatePlatform('tiktok');
          break;
        case 'instagram':
          await this.validatePlatform('instagram');
          break;
        case 'reddit':
          await this.validatePlatform('reddit');
          break;
        case 'report':
          await this.generateReport();
          break;
        case 'ready':
          await this.checkProductionReady();
          break;
        case 'help':
          this.showHelp();
          break;
        default:
          console.log(`${colors.red}Unknown command: ${command}${colors.reset}\n`);
          this.showHelp();
          process.exit(1);
      }
    } catch (error) {
      console.error(`${colors.red}❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}${colors.reset}`);
      process.exit(1);
    }
  }

  async validateAll() {
    console.log(`${colors.bright}Validating all OAuth platforms...${colors.reset}\n`);

    const report = await OAuthValidators.validateAll();

    // Display overall status
    this.displayOverallStatus(report.overall);

    // Display platform details
    console.log(`\n${colors.bright}Platform Details:${colors.reset}`);
    console.log('─'.repeat(60));

    this.displayPlatformResult(report.platforms.tiktok);
    this.displayPlatformResult(report.platforms.instagram);
    this.displayPlatformResult(report.platforms.reddit);

    // Display recommendations
    if (report.recommendations.length > 0) {
      console.log(`\n${colors.bright}Recommendations:${colors.reset}`);
      report.recommendations.forEach(rec => {
        const icon = rec.includes('✅') ? colors.green : rec.includes('⚠️') ? colors.yellow : '';
        console.log(`  ${icon}${rec}${colors.reset}`);
      });
    }

    // Exit with appropriate code
    process.exit(report.overall.isValid ? 0 : 1);
  }

  async validatePlatform(platform: 'tiktok' | 'instagram' | 'reddit') {
    console.log(`${colors.bright}Validating ${platform.charAt(0).toUpperCase() + platform.slice(1)}...${colors.reset}\n`);

    let result;
    switch (platform) {
      case 'tiktok':
        result = await OAuthValidators.validateTikTok();
        break;
      case 'instagram':
        result = await OAuthValidators.validateInstagram();
        break;
      case 'reddit':
        result = await OAuthValidators.validateReddit();
        break;
    }

    this.displayPlatformResult(result);

    process.exit(result.isValid ? 0 : 1);
  }

  async generateReport() {
    console.log(`${colors.bright}Generating validation report...${colors.reset}\n`);

    const report = await OAuthValidators.generateReport();
    
    // Display to console
    console.log(report);

    // Save to file
    const outputPath = path.join(process.cwd(), 'oauth-validation-report.md');
    await fs.writeFile(outputPath, report, 'utf8');

    console.log(`\n${colors.green}✅ Report saved to: ${outputPath}${colors.reset}`);
  }

  async checkProductionReady() {
    console.log(`${colors.bright}Checking production readiness...${colors.reset}\n`);

    const result = await OAuthValidators.isProductionReady();

    console.log(`${colors.bright}Production Ready:${colors.reset} ${result.ready ? 
      `${colors.green}✅ Yes${colors.reset}` : 
      `${colors.red}❌ No${colors.reset}`}`);

    if (result.blockers.length > 0) {
      console.log(`\n${colors.red}${colors.bright}🚨 Blockers:${colors.reset}`);
      result.blockers.forEach(blocker => {
        console.log(`  ${colors.red}• ${blocker}${colors.reset}`);
      });
    }

    if (result.warnings.length > 0) {
      console.log(`\n${colors.yellow}${colors.bright}⚠️  Warnings:${colors.reset}`);
      result.warnings.forEach(warning => {
        console.log(`  ${colors.yellow}• ${warning}${colors.reset}`);
      });
    }

    if (result.ready) {
      console.log(`\n${colors.green}✅ All OAuth platforms are ready for production!${colors.reset}`);
    }

    process.exit(result.ready ? 0 : 1);
  }

  displayOverallStatus(overall: any) {
    const statusIcon = overall.isValid ? '✅' : '❌';
    const scoreColor = overall.score >= 80 ? colors.green : overall.score >= 60 ? colors.yellow : colors.red;

    console.log(`${colors.bright}Overall Status:${colors.reset} ${statusIcon}`);
    console.log(`${colors.bright}Valid Platforms:${colors.reset} ${overall.validPlatforms}/${overall.totalPlatforms}`);
    console.log(`${colors.bright}Score:${colors.reset} ${scoreColor}${overall.score}/100${colors.reset}`);
  }

  displayPlatformResult(result: any) {
    const icon = result.isValid ? '✅' : '❌';
    
    console.log(`\n${colors.bright}${icon} ${result.platform}${colors.reset}`);
    console.log(`  Credentials Set: ${result.credentialsSet ? `${colors.green}✅${colors.reset}` : `${colors.red}❌${colors.reset}`}`);
    console.log(`  Format Valid: ${result.formatValid ? `${colors.green}✅${colors.reset}` : `${colors.red}❌${colors.reset}`}`);
    console.log(`  API Connectivity: ${result.apiConnectivity ? `${colors.green}✅${colors.reset}` : `${colors.red}❌${colors.reset}`}`);

    if (result.errors.length > 0) {
      console.log(`  ${colors.red}Errors:${colors.reset}`);
      result.errors.forEach((error: string) => {
        console.log(`    ${colors.red}• ${error}${colors.reset}`);
      });
    }

    if (result.warnings.length > 0) {
      console.log(`  ${colors.yellow}Warnings:${colors.reset}`);
      result.warnings.forEach((warning: string) => {
        console.log(`    ${colors.yellow}• ${warning}${colors.reset}`);
      });
    }

    if (result.details && Object.keys(result.details).length > 0) {
      console.log(`  ${colors.bright}Details:${colors.reset}`);
      Object.entries(result.details).forEach(([key, value]) => {
        console.log(`    ${key}: ${value}`);
      });
    }
  }

  showHelp() {
    console.log(`${colors.bright}Usage:${colors.reset}`);
    console.log('  npm run oauth:validate [command]\n');
    console.log(`${colors.bright}Commands:${colors.reset}`);
    console.log('  validate    Validate all OAuth platforms (default)');
    console.log('  tiktok      Validate TikTok OAuth only');
    console.log('  instagram   Validate Instagram OAuth only');
    console.log('  reddit      Validate Reddit OAuth only');
    console.log('  report      Generate detailed validation report');
    console.log('  ready       Check if production is ready');
    console.log('  help        Show this help message\n');
    console.log(`${colors.bright}Examples:${colors.reset}`);
    console.log('  npm run oauth:validate');
    console.log('  npm run oauth:validate tiktok');
    console.log('  npm run oauth:validate report');
    console.log('  npm run oauth:validate ready');
  }
}

// Run CLI
if (require.main === module) {
  const cli = new OAuthValidationCLI();
  cli.run().catch(console.error);
}

export { OAuthValidationCLI };
