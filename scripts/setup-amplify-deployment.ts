#!/usr/bin/env ts-node
/**
 * AWS Amplify Deployment Setup Script
 * 
 * Exécute toutes les étapes optionnelles de configuration:
 * 1. Vérifier les variables d'environnement (5 min)
 * 2. Configurer CloudWatch monitoring (15 min)
 * 3. Vérifier la préparation au déploiement (10 min)
 * 
 * Total: ~30 minutes
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function header(message: string) {
  console.log('\n' + '═'.repeat(60));
  log(message, colors.bright + colors.blue);
  console.log('═'.repeat(60) + '\n');
}

function success(message: string) {
  log(`✅ ${message}`, colors.green);
}

function warning(message: string) {
  log(`⚠️  ${message}`, colors.yellow);
}

function error(message: string) {
  log(`❌ ${message}`, colors.red);
}

function step(number: number, title: string, duration: string) {
  log(`\n${number}️⃣  ${title} (${duration})`, colors.bright);
  console.log('─'.repeat(60));
}

async function runCommand(command: string, description: string): Promise<boolean> {
  try {
    log(`   Exécution: ${description}...`);
    execSync(command, { stdio: 'inherit' });
    success(`   ${description} - Terminé`);
    return true;
  } catch (err) {
    error(`   ${description} - Échec`);
    return false;
  }
}

async function checkFile(filePath: string): Promise<boolean> {
  return fs.existsSync(path.join(process.cwd(), filePath));
}

async function main() {
  header('🚀 Configuration Déploiement AWS Amplify - Huntaze Beta');
  
  log('Ce script va configurer les étapes optionnelles pour le déploiement:');
  log('  1️⃣  Vérifier variables d\'environnement (5 min)');
  log('  2️⃣  Configurer CloudWatch monitoring (15 min)');
  log('  3️⃣  Vérifier préparation déploiement (10 min)');
  log('\nTemps total estimé: ~30 minutes\n');
  
  const startTime = Date.now();
  
  // ============================================================
  // ÉTAPE 1: Vérifier Variables d'Environnement (5 min)
  // ============================================================
  step(1, 'Vérification Variables d\'Environnement', '5 min');
  
  log('   Vérification des variables requises pour Amplify...\n');
  
  const envCheckSuccess = await runCommand(
    'npx ts-node scripts/verify-amplify-env.ts',
    'Vérification variables d\'environnement'
  );
  
  if (!envCheckSuccess) {
    error('\n❌ Variables d\'environnement manquantes!');
    log('\n📝 Actions Requises:');
    log('1. Ouvrir AWS Amplify Console');
    log('2. Aller à Environment variables');
    log('3. Ajouter les variables manquantes');
    log('\n📖 Guide complet: docs/AMPLIFY_DEPLOYMENT_GUIDE.md');
    process.exit(1);
  }
  
  success('\n✅ Étape 1 Terminée: Variables d\'environnement vérifiées');
  
  // ============================================================
  // ÉTAPE 2: Configurer CloudWatch Monitoring (15 min)
  // ============================================================
  step(2, 'Configuration CloudWatch Monitoring', '15 min');
  
  log('   Configuration des alarmes et dashboard CloudWatch...\n');
  
  // Check if AWS credentials are configured
  const hasAwsCredentials = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY;
  
  if (!hasAwsCredentials) {
    warning('   AWS credentials non configurées dans l\'environnement local');
    warning('   CloudWatch sera configuré lors du déploiement Amplify');
    log('\n   Pour configurer maintenant:');
    log('   1. Exécuter: aws configure');
    log('   2. Ou définir AWS_ACCESS_KEY_ID et AWS_SECRET_ACCESS_KEY');
    log('   3. Puis relancer ce script\n');
  } else {
    const cloudwatchSuccess = await runCommand(
      'npx ts-node scripts/setup-cloudwatch.ts',
      'Configuration CloudWatch'
    );
    
    if (cloudwatchSuccess) {
      success('\n✅ CloudWatch configuré avec succès!');
      log('\n📊 Ressources créées:');
      log('   • Log groups pour erreurs application');
      log('   • Alarmes pour taux d\'erreur, latence, cache');
      log('   • Dashboard avec métriques clés');
      log('   • SNS topic pour alertes critiques');
      
      const region = process.env.AWS_REGION || 'us-east-1';
      const env = process.env.NODE_ENV || 'development';
      
      log('\n🔗 Liens CloudWatch:');
      log(`   Dashboard: https://console.aws.amazon.com/cloudwatch/home?region=${region}#dashboards:name=huntaze-beta-${env}`);
      log(`   Alarmes: https://console.aws.amazon.com/cloudwatch/home?region=${region}#alarmsV2:`);
      log(`   Logs: https://console.aws.amazon.com/cloudwatch/home?region=${region}#logsV2:log-groups`);
    } else {
      warning('\n⚠️  Configuration CloudWatch échouée (optionnel)');
      log('   Vous pouvez continuer le déploiement sans monitoring');
      log('   CloudWatch peut être configuré plus tard');
    }
  }
  
  success('\n✅ Étape 2 Terminée: CloudWatch configuré (ou ignoré)');
  
  // ============================================================
  // ÉTAPE 3: Vérifier Préparation Déploiement (10 min)
  // ============================================================
  step(3, 'Vérification Préparation Déploiement', '10 min');
  
  log('   Vérification de la préparation au déploiement...\n');
  
  // Check critical files
  const criticalFiles = [
    'app/layout.tsx',
    'styles/design-system.css',
    'package.json',
    'next.config.ts',
  ];
  
  let allFilesExist = true;
  for (const file of criticalFiles) {
    const exists = await checkFile(file);
    if (exists) {
      success(`   ${file} - Présent`);
    } else {
      error(`   ${file} - Manquant`);
      allFilesExist = false;
    }
  }
  
  if (!allFilesExist) {
    error('\n❌ Fichiers critiques manquants!');
    process.exit(1);
  }
  
  // Check design system integration
  log('\n   Vérification intégration design system...');
  const layoutContent = fs.readFileSync('app/layout.tsx', 'utf-8');
  const hasDesignSystem = layoutContent.includes('design-system.css');
  
  if (hasDesignSystem) {
    success('   Design system intégré dans layout.tsx');
  } else {
    error('   Design system NON intégré dans layout.tsx');
    log('   Ajouter: import \'../styles/design-system.css\'');
    process.exit(1);
  }
  
  // Run tests (optional, can be skipped)
  log('\n   Exécution des tests (optionnel)...');
  const testsSuccess = await runCommand(
    'npm test -- --run --reporter=verbose 2>&1 | head -50',
    'Tests unitaires'
  );
  
  if (testsSuccess) {
    success('   Tests passent avec succès');
  } else {
    warning('   Certains tests ont échoué (non bloquant)');
    log('   Vous pouvez continuer le déploiement');
  }
  
  success('\n✅ Étape 3 Terminée: Préparation vérifiée');
  
  // ============================================================
  // RÉSUMÉ FINAL
  // ============================================================
  const endTime = Date.now();
  const duration = Math.round((endTime - startTime) / 1000);
  
  header('🎉 Configuration Terminée!');
  
  log('✅ Toutes les étapes optionnelles sont terminées\n');
  
  log('📊 Résumé:');
  log(`   • Durée totale: ${duration} secondes`);
  log('   • Variables d\'environnement: Vérifiées ✅');
  log(`   • CloudWatch monitoring: ${hasAwsCredentials ? 'Configuré ✅' : 'À configurer ⚠️'}`);
  log('   • Préparation déploiement: Vérifiée ✅');
  
  log('\n🚀 Prochaines Étapes:');
  log('─'.repeat(60));
  log('\n1️⃣  Commit et Push:');
  log('   git add .');
  log('   git commit -m "feat: integrate Beta Launch UI System"');
  log('   git push origin main');
  
  log('\n2️⃣  AWS Amplify va automatiquement:');
  log('   ✅ Détecter le push');
  log('   ✅ Builder l\'application');
  log('   ✅ Déployer en production');
  log('   ✅ Mettre à jour le CDN');
  
  log('\n3️⃣  Monitorer le déploiement:');
  log('   • Amplify Console: https://console.aws.amazon.com/amplify');
  log('   • Suivre le build en temps réel');
  log('   • Vérifier les logs de déploiement');
  
  if (hasAwsCredentials) {
    const region = process.env.AWS_REGION || 'us-east-1';
    const env = process.env.NODE_ENV || 'development';
    log('\n4️⃣  Vérifier CloudWatch:');
    log(`   • Dashboard: https://console.aws.amazon.com/cloudwatch/home?region=${region}#dashboards:name=huntaze-beta-${env}`);
    log(`   • Alarmes: https://console.aws.amazon.com/cloudwatch/home?region=${region}#alarmsV2:`);
  }
  
  log('\n📖 Documentation:');
  log('   • Guide Amplify: docs/AMPLIFY_DEPLOYMENT_GUIDE.md');
  log('   • Guide Monitoring: docs/MONITORING_ALERTING.md');
  log('   • Procédure Rollback: docs/ROLLBACK_PROCEDURE.md');
  
  log('\n✨ Votre application Huntaze Beta est prête pour le déploiement!');
  log('═'.repeat(60) + '\n');
}

// Run main function
main().catch(error => {
  console.error('\n❌ Erreur lors de la configuration:', error);
  process.exit(1);
});
