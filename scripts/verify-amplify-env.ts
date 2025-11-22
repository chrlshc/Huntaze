#!/usr/bin/env ts-node
/**
 * Verify Amplify Environment Variables
 * 
 * Checks that all required environment variables are configured
 * for AWS Amplify deployment
 */

interface EnvCheck {
  name: string;
  required: boolean;
  category: string;
  description: string;
}

const ENV_CHECKS: EnvCheck[] = [
  // Database
  { name: 'DATABASE_URL', required: true, category: 'Database', description: 'PostgreSQL connection string' },
  
  // Authentication
  { name: 'NEXTAUTH_URL', required: true, category: 'Auth', description: 'Production URL (https://app.huntaze.com)' },
  { name: 'NEXTAUTH_SECRET', required: true, category: 'Auth', description: 'Cryptographically secure secret (32+ chars)' },
  { name: 'ENCRYPTION_KEY', required: true, category: 'Auth', description: '32-character encryption key' },
  
  // AWS Credentials
  { name: 'AWS_ACCESS_KEY_ID', required: true, category: 'AWS', description: 'IAM user access key' },
  { name: 'AWS_SECRET_ACCESS_KEY', required: true, category: 'AWS', description: 'IAM secret key' },
  { name: 'AWS_REGION', required: true, category: 'AWS', description: 'AWS region (us-east-1)' },
  { name: 'AWS_SESSION_TOKEN', required: false, category: 'AWS', description: 'Temporary credentials (optional)' },
  
  // AWS Services
  { name: 'AWS_S3_BUCKET', required: true, category: 'AWS Services', description: 'S3 bucket name' },
  { name: 'CDN_URL', required: false, category: 'AWS Services', description: 'CloudFront distribution URL' },
  
  // Application
  { name: 'NEXT_PUBLIC_APP_URL', required: true, category: 'Application', description: 'Public app URL' },
  { name: 'NODE_ENV', required: true, category: 'Application', description: 'Environment (production)' },
  
  // OAuth Providers
  { name: 'INSTAGRAM_CLIENT_ID', required: false, category: 'OAuth', description: 'Instagram OAuth app ID' },
  { name: 'INSTAGRAM_CLIENT_SECRET', required: false, category: 'OAuth', description: 'Instagram OAuth secret' },
  { name: 'TIKTOK_CLIENT_KEY', required: false, category: 'OAuth', description: 'TikTok OAuth key' },
  { name: 'TIKTOK_CLIENT_SECRET', required: false, category: 'OAuth', description: 'TikTok OAuth secret' },
  { name: 'REDDIT_CLIENT_ID', required: false, category: 'OAuth', description: 'Reddit OAuth app ID' },
  { name: 'REDDIT_CLIENT_SECRET', required: false, category: 'OAuth', description: 'Reddit OAuth secret' },
  
  // Monitoring (Optional)
  { name: 'ALERT_EMAIL', required: false, category: 'Monitoring', description: 'Email for CloudWatch alerts' },
];

async function verifyEnvironment() {
  console.log('🔍 Vérification des Variables d\'Environnement AWS Amplify\n');
  
  const results: Record<string, { configured: string[]; missing: string[] }> = {};
  let hasErrors = false;
  
  // Group by category
  for (const check of ENV_CHECKS) {
    if (!results[check.category]) {
      results[check.category] = { configured: [], missing: [] };
    }
    
    const value = process.env[check.name];
    const isConfigured = value && value.trim() !== '';
    
    if (isConfigured) {
      results[check.category].configured.push(
        `✅ ${check.name} - ${check.description}`
      );
    } else {
      const status = check.required ? '❌' : '⚠️';
      results[check.category].missing.push(
        `${status} ${check.name} - ${check.description} ${check.required ? '(REQUIS)' : '(Optionnel)'}`
      );
      
      if (check.required) {
        hasErrors = true;
      }
    }
  }
  
  // Print results by category
  for (const [category, { configured, missing }] of Object.entries(results)) {
    console.log(`\n📦 ${category}:`);
    console.log('─'.repeat(60));
    
    if (configured.length > 0) {
      configured.forEach(line => console.log(`  ${line}`));
    }
    
    if (missing.length > 0) {
      missing.forEach(line => console.log(`  ${line}`));
    }
  }
  
  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log('📊 Résumé:');
  console.log('═'.repeat(60));
  
  const totalConfigured = ENV_CHECKS.filter(c => {
    const value = process.env[c.name];
    return value && value.trim() !== '';
  }).length;
  
  const totalRequired = ENV_CHECKS.filter(c => c.required).length;
  const requiredConfigured = ENV_CHECKS.filter(c => {
    const value = process.env[c.name];
    return c.required && value && value.trim() !== '';
  }).length;
  
  console.log(`\nVariables Configurées: ${totalConfigured}/${ENV_CHECKS.length}`);
  console.log(`Variables Requises: ${requiredConfigured}/${totalRequired}`);
  
  if (hasErrors) {
    console.log('\n❌ ERREUR: Des variables requises sont manquantes!');
    console.log('\n📝 Actions Requises:');
    console.log('1. Configurer les variables manquantes dans AWS Amplify Console');
    console.log('2. Ou via AWS CLI:');
    console.log('   aws amplify update-app --app-id <app-id> --environment-variables KEY=VALUE');
    console.log('\n📖 Guide: docs/AMPLIFY_DEPLOYMENT_GUIDE.md');
    process.exit(1);
  } else {
    console.log('\n✅ Toutes les variables requises sont configurées!');
    
    const optionalMissing = ENV_CHECKS.filter(c => {
      const value = process.env[c.name];
      return !c.required && (!value || value.trim() === '');
    }).length;
    
    if (optionalMissing > 0) {
      console.log(`\n⚠️  ${optionalMissing} variable(s) optionnelle(s) non configurée(s)`);
      console.log('   Ces variables peuvent être ajoutées plus tard si nécessaire.');
    }
    
    console.log('\n🚀 Prêt pour le déploiement Amplify!');
  }
}

// Run verification
verifyEnvironment().catch(error => {
  console.error('❌ Erreur lors de la vérification:', error);
  process.exit(1);
});
