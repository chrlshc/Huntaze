#!/usr/bin/env node

/**
 * Script CLI pour déclencher des déploiements Amplify manuellement
 * Usage: AWS_ACCESS_KEY_ID=xxx AWS_SECRET_ACCESS_KEY=xxx AWS_SESSION_TOKEN=xxx node scripts/deploy-amplify-cli.js [branch]
 */

const { AmplifyClient, CreateDeploymentCommand, StartDeploymentCommand } = require('@aws-sdk/client-amplify');
const { execSync } = require('child_process');

async function deployToAmplify(branchName = 'staging') {
  try {
    console.log(`🚀 Déploiement manuel vers la branche: ${branchName}\n`);

    const client = new AmplifyClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        sessionToken: process.env.AWS_SESSION_TOKEN
      }
    });

    const appId = 'd2gmcfr71gawhz';

    // Obtenir le dernier commit
    let commitId;
    try {
      commitId = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
      console.log(`📝 Commit actuel: ${commitId.substring(0, 8)}`);
    } catch (error) {
      console.log('⚠️  Impossible de récupérer le commit ID, utilisation d\'un placeholder');
      commitId = 'manual-deploy-' + Date.now();
    }

    console.log('📦 Création du déploiement...');

    // Créer un déploiement manuel
    const createDeploymentResponse = await client.send(new CreateDeploymentCommand({
      appId: appId,
      branchName: branchName,
      fileMap: {
        // Fichier minimal pour déclencher le build
        'package.json': Buffer.from(JSON.stringify({
          name: 'huntaze-deploy-trigger',
          version: '1.0.0',
          scripts: {
            build: 'echo "Manual deployment trigger"'
          }
        })).toString('base64')
      }
    }));

    const jobId = createDeploymentResponse.jobId;
    console.log(`✅ Déploiement créé: ${jobId}`);

    // Démarrer le déploiement
    console.log('🔄 Démarrage du build...');
    
    const startDeploymentResponse = await client.send(new StartDeploymentCommand({
      appId: appId,
      branchName: branchName,
      jobId: jobId,
      sourceUrl: `https://github.com/chrlshc/Huntaze/archive/${commitId}.zip`
    }));

    console.log(`🎯 Build démarré avec succès!`);
    console.log(`   Job ID: ${jobId}`);
    console.log(`   Status: ${startDeploymentResponse.jobSummary?.status || 'PENDING'}`);
    
    // URL pour suivre le build
    const region = process.env.AWS_REGION || 'us-east-1';
    const buildUrl = `https://${region}.console.aws.amazon.com/amplify/home?region=${region}#/${appId}/${branchName}/${jobId}`;
    console.log(`\n🔗 Suivre le build: ${buildUrl}`);

    // URL de l'environnement
    const envUrl = `https://${branchName}.${appId}.amplifyapp.com`;
    console.log(`🌐 URL de l'environnement: ${envUrl}`);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    
    if (error.name === 'BadRequestException') {
      console.log('\n⚠️  Vérifiez que:');
      console.log('   - La branche existe dans Amplify');
      console.log('   - Le repository est connecté');
      console.log('   - Auto-build est activé');
      console.log('\n💡 Essayez d\'abord: node scripts/fix-amplify-cli.js');
    }
    
    if (error.name === 'ResourceNotFoundException') {
      console.log('\n⚠️  La branche n\'existe pas dans Amplify');
      console.log('   Branches disponibles: main, staging, prod');
      console.log('   Utilisez: node scripts/fix-amplify-cli.js pour les créer');
    }
  }
}

const branchName = process.argv[2] || 'staging';
console.log(`Déploiement vers: ${branchName}`);

deployToAmplify(branchName);