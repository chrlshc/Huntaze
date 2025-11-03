#!/usr/bin/env node

/**
 * Script CLI pour réparer et configurer AWS Amplify
 * Usage: AWS_ACCESS_KEY_ID=xxx AWS_SECRET_ACCESS_KEY=xxx AWS_SESSION_TOKEN=xxx node scripts/fix-amplify-cli.js
 */

const { AmplifyClient, UpdateAppCommand, CreateBranchCommand, ListBranchesCommand } = require('@aws-sdk/client-amplify');

async function fixAmplifyConfiguration() {
  try {
    console.log('🔧 Configuration automatique d\'AWS Amplify...\n');

    const client = new AmplifyClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        sessionToken: process.env.AWS_SESSION_TOKEN
      }
    });

    const appId = 'd2gmcfr71gawhz'; // ID de votre app Huntaze

    console.log('📋 Étape 1: Connexion du repository GitHub...');
    
    // 1. Connecter le repository GitHub
    try {
      const updateAppResponse = await client.send(new UpdateAppCommand({
        appId: appId,
        repository: 'https://github.com/chrlshc/Huntaze',
        oauthToken: process.env.GITHUB_TOKEN || 'PLACEHOLDER', // Vous devrez fournir un token GitHub
        platform: 'WEB',
        enableBranchAutoBuild: true,
        enableBranchAutoDeletion: false,
        enableBasicAuth: false
      }));
      
      console.log('✅ Repository GitHub connecté avec succès');
    } catch (error) {
      console.log('⚠️  Connexion repository: ' + error.message);
      console.log('   → Vous devrez connecter manuellement le repository dans la console');
    }

    console.log('\n📋 Étape 2: Vérification des branches existantes...');
    
    // 2. Lister les branches existantes
    const branchesResponse = await client.send(new ListBranchesCommand({ appId }));
    const existingBranches = branchesResponse.branches.map(b => b.branchName);
    console.log(`   Branches existantes: ${existingBranches.join(', ')}`);

    // 3. Créer les branches manquantes
    const requiredBranches = [
      { name: 'staging', stage: 'DEVELOPMENT', framework: 'Next.js - SSR' },
      { name: 'prod', stage: 'PRODUCTION', framework: 'Next.js - SSR' }
    ];

    console.log('\n📋 Étape 3: Création des branches manquantes...');

    for (const branch of requiredBranches) {
      if (!existingBranches.includes(branch.name)) {
        try {
          console.log(`   Création de la branche: ${branch.name}`);
          
          const createBranchResponse = await client.send(new CreateBranchCommand({
            appId: appId,
            branchName: branch.name,
            stage: branch.stage,
            framework: branch.framework,
            enableAutoBuild: true,
            enablePullRequestPreview: false,
            environmentVariables: {
              'AMPLIFY_MONOREPO_APP_ROOT': '.',
              'AMPLIFY_DIFF_DEPLOY': 'false',
              '_LIVE_UPDATES': JSON.stringify([{
                name: 'Amplify CLI',
                version: 'latest',
                type: 'npm'
              }])
            },
            buildSpec: `version: 1
frontend:
  phases:
    preBuild:
      commands:
        - nvm install 20 && nvm use 20
        - npm ci --no-audit --no-fund
    build:
      commands:
        - export BUILD_REDIS_MOCK=1
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
      - .next/cache/**/*`
          }));
          
          console.log(`✅ Branche ${branch.name} créée avec succès`);
        } catch (error) {
          console.log(`❌ Erreur création branche ${branch.name}: ${error.message}`);
          
          if (error.name === 'BadRequestException' && error.message.includes('repository')) {
            console.log('   → Le repository doit être connecté d\'abord');
            console.log('   → Utilisez la console AWS Amplify pour connecter GitHub');
          }
        }
      } else {
        console.log(`✅ Branche ${branch.name} existe déjà`);
      }
    }

    console.log('\n🎯 Configuration terminée !');
    console.log('\n📋 Prochaines étapes manuelles:');
    console.log('1. Allez sur https://console.aws.amazon.com/amplify/');
    console.log('2. Sélectionnez l\'app "huntaze"');
    console.log('3. Si le repository n\'est pas connecté:');
    console.log('   → App settings > General > Edit');
    console.log('   → Repository provider > Connect GitHub');
    console.log('   → Sélectionnez chrlshc/Huntaze');
    console.log('4. Vérifiez que les branches staging et prod sont configurées');
    console.log('5. Activez auto-build pour chaque branche');

    // Afficher les URLs des environnements
    console.log('\n🔗 URLs des environnements:');
    console.log('   Main (prod): https://main.d2gmcfr71gawhz.amplifyapp.com');
    console.log('   Staging: https://staging.d2gmcfr71gawhz.amplifyapp.com');
    console.log('   Prod: https://prod.d2gmcfr71gawhz.amplifyapp.com');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    
    if (error.name === 'UnauthorizedOperation' || error.name === 'AccessDenied') {
      console.log('\n🔑 Problème d\'authentification:');
      console.log('   - Vérifiez vos AWS credentials');
      console.log('   - Assurez-vous d\'avoir les permissions Amplify');
    }
  }
}

// Vérifier les variables d'environnement
if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
  console.log('❌ Variables d\'environnement AWS manquantes');
  console.log('\nUsage:');
  console.log('AWS_ACCESS_KEY_ID=xxx AWS_SECRET_ACCESS_KEY=xxx AWS_SESSION_TOKEN=xxx node scripts/fix-amplify-cli.js');
  console.log('\nOptionnel: GITHUB_TOKEN=xxx pour connecter automatiquement le repository');
  process.exit(1);
}

fixAmplifyConfiguration();