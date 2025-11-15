#!/usr/bin/env tsx
/**
 * Production Environment Setup Script
 * 
 * Interactive setup wizard for production environment configuration
 */

import { securityTokenGenerator } from '../lib/security/securityTokenGenerator';
import { OAuthValidators } from '../lib/security/oauth-validators';
import * as readline from 'readline';
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
  magenta: '\x1b[35m',
};

interface SetupConfig {
  generateTokens: boolean;
  configureOAuth: boolean;
  validateSetup: boolean;
  outputFile: string;
}

class ProductionSetupWizard {
  private rl: readline.Interface;
  private config: SetupConfig;
  private envVars: Record<string, string> = {};

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    this.config = {
      generateTokens: true,
      configureOAuth: true,
      validateSetup: true,
      outputFile: '.env.production.local',
    };
  }

  async run() {
    try {
      await this.showWelcome();
      await this.selectSetupMode();
      
      if (this.config.generateTokens) {
        await this.setupSecurityTokens();
      }

      if (this.config.configureOAuth) {
        await this.setupOAuthCredentials();
      }

      await this.setupAdditionalConfig();
      await this.saveConfiguration();

      if (this.config.validateSetup) {
        await this.validateConfiguration();
      }

      await this.showNextSteps();

      console.log(`\n${colors.green}${colors.bright}✅ Production environment setup complete!${colors.reset}\n`);

    } catch (error) {
      console.error(`${colors.red}❌ Setup failed: ${error instanceof Error ? error.message : 'Unknown error'}${colors.reset}`);
      process.exit(1);
    } finally {
      this.rl.close();
    }
  }

  async showWelcome() {
    console.log(`${colors.cyan}${colors.bright}`);
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║                                                        ║');
    console.log('║     🚀 Huntaze Production Environment Setup 🚀        ║');
    console.log('║                                                        ║');
    console.log('╚════════════════════════════════════════════════════════╝');
    console.log(colors.reset);
    console.log('This wizard will help you configure your production environment.\n');
    console.log('We will:');
    console.log('  ✅ Generate secure security tokens');
    console.log('  ✅ Configure OAuth credentials');
    console.log('  ✅ Set up environment variables');
    console.log('  ✅ Validate the configuration\n');
  }

  async selectSetupMode() {
    console.log(`${colors.bright}Setup Mode:${colors.reset}`);
    console.log('1. Full setup (recommended)');
    console.log('2. Security tokens only');
    console.log('3. OAuth credentials only');
    console.log('4. Custom setup\n');

    const choice = await this.question('Select mode (1-4): ');

    switch (choice) {
      case '1':
        // Full setup - default config
        break;
      case '2':
        this.config.configureOAuth = false;
        break;
      case '3':
        this.config.generateTokens = false;
        break;
      case '4':
        await this.customSetup();
        break;
      default:
        console.log(`${colors.yellow}Invalid choice, using full setup${colors.reset}`);
    }
  }

  async customSetup() {
    const genTokens = await this.question('Generate security tokens? (y/n): ');
    this.config.generateTokens = genTokens.toLowerCase() === 'y';

    const configOAuth = await this.question('Configure OAuth credentials? (y/n): ');
    this.config.configureOAuth = configOAuth.toLowerCase() === 'y';

    const validate = await this.question('Validate setup after completion? (y/n): ');
    this.config.validateSetup = validate.toLowerCase() === 'y';
  }

  async setupSecurityTokens() {
    console.log(`\n${colors.cyan}${colors.bright}🔐 Security Tokens Setup${colors.reset}`);
    console.log('─'.repeat(60));

    const useExisting = await this.question('\nDo you have existing tokens to use? (y/n): ');

    if (useExisting.toLowerCase() === 'y') {
      console.log('\nEnter your existing tokens:');
      this.envVars.ADMIN_TOKEN = await this.question('ADMIN_TOKEN: ');
      this.envVars.DEBUG_TOKEN = await this.question('DEBUG_TOKEN: ');
    } else {
      console.log(`\n${colors.yellow}Generating new secure tokens...${colors.reset}`);
      const tokens = securityTokenGenerator.generateSecurityTokens();

      this.envVars.ADMIN_TOKEN = tokens.adminToken;
      this.envVars.DEBUG_TOKEN = tokens.debugToken;

      console.log(`${colors.green}✅ Tokens generated successfully!${colors.reset}`);
      console.log(`   Admin Token: ${tokens.adminToken.substring(0, 16)}...`);
      console.log(`   Debug Token: ${tokens.debugToken.substring(0, 16)}...`);
      console.log(`   Entropy: ${tokens.entropy.toFixed(2)} bits`);
    }
  }

  async setupOAuthCredentials() {
    console.log(`\n${colors.cyan}${colors.bright}🔗 OAuth Credentials Setup${colors.reset}`);
    console.log('─'.repeat(60));

    console.log('\nYou need to obtain OAuth credentials from each platform:');
    console.log(`${colors.blue}📘 Instagram:${colors.reset} https://developers.facebook.com/apps/`);
    console.log(`${colors.magenta}📱 TikTok:${colors.reset} https://developers.tiktok.com/apps/`);
    console.log(`${colors.red}🤖 Reddit:${colors.reset} https://www.reddit.com/prefs/apps/\n`);

    // TikTok
    await this.setupTikTokOAuth();

    // Instagram
    await this.setupInstagramOAuth();

    // Reddit
    await this.setupRedditOAuth();
  }

  async setupTikTokOAuth() {
    console.log(`\n${colors.magenta}${colors.bright}TikTok OAuth Configuration${colors.reset}`);
    
    const configure = await this.question('Configure TikTok OAuth? (y/n): ');
    
    if (configure.toLowerCase() === 'y') {
      this.envVars.TIKTOK_CLIENT_KEY = await this.question('TikTok Client Key: ');
      this.envVars.TIKTOK_CLIENT_SECRET = await this.question('TikTok Client Secret: ');
      
      const defaultRedirect = 'https://yourdomain.com/auth/tiktok/callback';
      const redirect = await this.question(`Redirect URI (${defaultRedirect}): `);
      this.envVars.NEXT_PUBLIC_TIKTOK_REDIRECT_URI = redirect || defaultRedirect;
      
      console.log(`${colors.green}✅ TikTok OAuth configured${colors.reset}`);
    } else {
      console.log(`${colors.yellow}⚠️  TikTok OAuth skipped - will use placeholders${colors.reset}`);
    }
  }

  async setupInstagramOAuth() {
    console.log(`\n${colors.blue}${colors.bright}Instagram OAuth Configuration${colors.reset}`);
    
    const configure = await this.question('Configure Instagram OAuth? (y/n): ');
    
    if (configure.toLowerCase() === 'y') {
      this.envVars.FACEBOOK_APP_ID = await this.question('Facebook App ID: ');
      this.envVars.FACEBOOK_APP_SECRET = await this.question('Facebook App Secret: ');
      
      const defaultRedirect = 'https://yourdomain.com/auth/instagram/callback';
      const redirect = await this.question(`Redirect URI (${defaultRedirect}): `);
      this.envVars.NEXT_PUBLIC_FACEBOOK_REDIRECT_URI = redirect || defaultRedirect;
      
      console.log(`${colors.green}✅ Instagram OAuth configured${colors.reset}`);
    } else {
      console.log(`${colors.yellow}⚠️  Instagram OAuth skipped - will use placeholders${colors.reset}`);
    }
  }

  async setupRedditOAuth() {
    console.log(`\n${colors.red}${colors.bright}Reddit OAuth Configuration${colors.reset}`);
    
    const configure = await this.question('Configure Reddit OAuth? (y/n): ');
    
    if (configure.toLowerCase() === 'y') {
      this.envVars.REDDIT_CLIENT_ID = await this.question('Reddit Client ID: ');
      this.envVars.REDDIT_CLIENT_SECRET = await this.question('Reddit Client Secret: ');
      
      const defaultUserAgent = 'Huntaze/1.0.0';
      const userAgent = await this.question(`User Agent (${defaultUserAgent}): `);
      this.envVars.REDDIT_USER_AGENT = userAgent || defaultUserAgent;
      
      const defaultRedirect = 'https://yourdomain.com/auth/reddit/callback';
      const redirect = await this.question(`Redirect URI (${defaultRedirect}): `);
      this.envVars.NEXT_PUBLIC_REDDIT_REDIRECT_URI = redirect || defaultRedirect;
      
      console.log(`${colors.green}✅ Reddit OAuth configured${colors.reset}`);
    } else {
      console.log(`${colors.yellow}⚠️  Reddit OAuth skipped - will use placeholders${colors.reset}`);
    }
  }

  async setupAdditionalConfig() {
    console.log(`\n${colors.cyan}${colors.bright}⚙️  Additional Configuration${colors.reset}`);
    console.log('─'.repeat(60));

    const configureAdditional = await this.question('\nConfigure additional settings? (y/n): ');
    
    if (configureAdditional.toLowerCase() === 'y') {
      // Database
      console.log(`\n${colors.bright}Database Configuration:${colors.reset}`);
      this.envVars.DATABASE_URL = await this.question('DATABASE_URL: ');
      this.envVars.REDIS_URL = await this.question('REDIS_URL (optional): ');

      // AWS
      console.log(`\n${colors.bright}AWS Configuration:${colors.reset}`);
      this.envVars.AWS_REGION = await this.question('AWS_REGION (us-east-1): ') || 'us-east-1';
      this.envVars.AWS_ACCESS_KEY_ID = REDACTED this.question('AWS_ACCESS_KEY_ID: ');
      this.envVars.AWS_SECRET_ACCESS_KEY = REDACTED this.question('AWS_SECRET_ACCESS_KEY: ');

      // NextAuth
      console.log(`\n${colors.bright}NextAuth Configuration:${colors.reset}`);
      this.envVars.NEXTAUTH_URL = await this.question('NEXTAUTH_URL: ');
      this.envVars.NEXTAUTH_SECRET = this.envVars.ADMIN_TOKEN || await this.question('NEXTAUTH_SECRET: ');
    }
  }

  async saveConfiguration() {
    console.log(`\n${colors.cyan}${colors.bright}💾 Saving Configuration${colors.reset}`);
    console.log('─'.repeat(60));

    const outputPath = path.join(process.cwd(), this.config.outputFile);

    // Check if file exists
    try {
      await fs.access(outputPath);
      const overwrite = await this.question(`\n${colors.yellow}File ${this.config.outputFile} exists. Overwrite? (y/n): ${colors.reset}`);
      
      if (overwrite.toLowerCase() !== 'y') {
        const newName = await this.question('Enter new filename: ');
        this.config.outputFile = newName;
      }
    } catch {
      // File doesn't exist, proceed
    }

    // Generate .env content
    let envContent = `# Production Environment Variables\n`;
    envContent += `# Generated: ${new Date().toISOString()}\n`;
    envContent += `# ⚠️  DO NOT COMMIT THIS FILE TO VERSION CONTROL\n\n`;

    // Security tokens
    if (this.envVars.ADMIN_TOKEN || this.envVars.DEBUG_TOKEN) {
      envContent += `# Security Tokens\n`;
      if (this.envVars.ADMIN_TOKEN) envContent += `ADMIN_TOKEN=${this.envVars.ADMIN_TOKEN}\n`;
      if (this.envVars.DEBUG_TOKEN) envContent += `DEBUG_TOKEN=${this.envVars.DEBUG_TOKEN}\n`;
      envContent += `\n`;
    }

    // OAuth credentials
    if (this.hasOAuthCredentials()) {
      envContent += `# OAuth Credentials\n`;
      
      if (this.envVars.TIKTOK_CLIENT_KEY) {
        envContent += `TIKTOK_CLIENT_KEY=${this.envVars.TIKTOK_CLIENT_KEY}\n`;
        envContent += `TIKTOK_CLIENT_SECRET=${this.envVars.TIKTOK_CLIENT_SECRET}\n`;
        envContent += `NEXT_PUBLIC_TIKTOK_REDIRECT_URI=${this.envVars.NEXT_PUBLIC_TIKTOK_REDIRECT_URI}\n`;
      }
      
      if (this.envVars.FACEBOOK_APP_ID) {
        envContent += `FACEBOOK_APP_ID=${this.envVars.FACEBOOK_APP_ID}\n`;
        envContent += `FACEBOOK_APP_SECRET=${this.envVars.FACEBOOK_APP_SECRET}\n`;
        envContent += `NEXT_PUBLIC_FACEBOOK_REDIRECT_URI=${this.envVars.NEXT_PUBLIC_FACEBOOK_REDIRECT_URI}\n`;
      }
      
      if (this.envVars.REDDIT_CLIENT_ID) {
        envContent += `REDDIT_CLIENT_ID=${this.envVars.REDDIT_CLIENT_ID}\n`;
        envContent += `REDDIT_CLIENT_SECRET=${this.envVars.REDDIT_CLIENT_SECRET}\n`;
        envContent += `REDDIT_USER_AGENT=${this.envVars.REDDIT_USER_AGENT}\n`;
        envContent += `NEXT_PUBLIC_REDDIT_REDIRECT_URI=${this.envVars.NEXT_PUBLIC_REDDIT_REDIRECT_URI}\n`;
      }
      
      envContent += `\n`;
    }

    // Additional config
    if (this.envVars.DATABASE_URL) {
      envContent += `# Database\n`;
      envContent += `DATABASE_URL=${this.envVars.DATABASE_URL}\n`;
      if (this.envVars.REDIS_URL) envContent += `REDIS_URL=${this.envVars.REDIS_URL}\n`;
      envContent += `\n`;
    }

    if (this.envVars.AWS_REGION) {
      envContent += `# AWS\n`;
      envContent += `AWS_REGION=${this.envVars.AWS_REGION}\n`;
      envContent += `AWS_ACCESS_KEY_ID=${this.envVars.AWS_ACCESS_KEY_ID}\n`;
      envContent += `AWS_SECRET_ACCESS_KEY=${this.envVars.AWS_SECRET_ACCESS_KEY}\n`;
      envContent += `\n`;
    }

    if (this.envVars.NEXTAUTH_URL) {
      envContent += `# NextAuth\n`;
      envContent += `NEXTAUTH_URL=${this.envVars.NEXTAUTH_URL}\n`;
      envContent += `NEXTAUTH_SECRET=${this.envVars.NEXTAUTH_SECRET}\n`;
      envContent += `\n`;
    }

    // Write file
    await fs.writeFile(path.join(process.cwd(), this.config.outputFile), envContent, 'utf8');

    console.log(`${colors.green}✅ Configuration saved to: ${this.config.outputFile}${colors.reset}`);
  }

  async validateConfiguration() {
    console.log(`\n${colors.cyan}${colors.bright}🔍 Validating Configuration${colors.reset}`);
    console.log('─'.repeat(60));

    // Load the environment variables we just created
    Object.entries(this.envVars).forEach(([key, value]) => {
      process.env[key] = value;
    });

    // Validate OAuth if configured
    if (this.hasOAuthCredentials()) {
      console.log(`\n${colors.yellow}Validating OAuth credentials...${colors.reset}`);
      
      try {
        const report = await OAuthValidators.validateAll();
        
        console.log(`\nValidation Results:`);
        console.log(`  Valid Platforms: ${report.overall.validPlatforms}/${report.overall.totalPlatforms}`);
        console.log(`  Score: ${report.overall.score}/100`);
        
        if (report.overall.isValid) {
          console.log(`${colors.green}✅ All OAuth credentials are valid${colors.reset}`);
        } else {
          console.log(`${colors.yellow}⚠️  Some OAuth credentials need attention${colors.reset}`);
          
          if (report.recommendations.length > 0) {
            console.log(`\nRecommendations:`);
            report.recommendations.forEach(rec => {
              console.log(`  • ${rec}`);
            });
          }
        }
      } catch (error) {
        console.log(`${colors.yellow}⚠️  OAuth validation skipped (services may not be available)${colors.reset}`);
      }
    }
  }

  async showNextSteps() {
    console.log(`\n${colors.cyan}${colors.bright}🎯 Next Steps${colors.reset}`);
    console.log('─'.repeat(60));
    console.log('\n1. 📋 Add .env.production.local to your .gitignore');
    console.log('2. 🚀 Deploy these variables to your hosting platform:');
    console.log('   - AWS Amplify: Environment Variables section');
    console.log('   - Vercel: Project Settings > Environment Variables');
    console.log('   - Netlify: Site Settings > Environment Variables');
    console.log('3. 🧪 Test your configuration:');
    console.log('   npm run oauth:validate');
    console.log('4. ✅ Verify production readiness:');
    console.log('   npm run oauth:ready');
    console.log('5. 🚀 Deploy to production!\n');
  }

  hasOAuthCredentials(): boolean {
    return !!(
      this.envVars.TIKTOK_CLIENT_KEY ||
      this.envVars.FACEBOOK_APP_ID ||
      this.envVars.REDDIT_CLIENT_ID
    );
  }

  question(prompt: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(prompt, resolve);
    });
  }
}

// Run wizard
if (require.main === module) {
  const wizard = new ProductionSetupWizard();
  wizard.run().catch(console.error);
}

export { ProductionSetupWizard };
