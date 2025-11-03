#!/usr/bin/env node

/**
 * Script pour déclencher manuellement un build Amplify
 * Usage: AWS_ACCESS_KEY_ID=xxx AWS_SECRET_ACCESS_KEY=xxx node scripts/trigger-amplify-build.js [branchName]
 */

const { AmplifyClient, ListAppsCommand, StartJobCommand } = require('@aws-sdk/client-amplify');

async function triggerBuild(branchName = 'staging') {
  try {
    console.log(`🚀 Déclenchement du build pour la branche: ${branchName}\n`);

    const client = new AmplifyClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        sessionToken: process.env.AWS_SESSION_TOKEN
      }
    });

    // Trouver l'app Huntaze
    const listAppsResponse = await client.send(new ListAppsCommand({}));
    const huntazeApp = listAppsResponse.apps.find(app => 
      app.name.toLowerCase().includes('huntaze') || 
      app.repository?.includes('huntaze') ||
      app.repository?.includes('Huntaze')
    );

    if (!huntazeApp) {
      console.log('❌ Application Huntaze non trouvée');
      return;
    }

    console.log(`✅ Application trouvée: ${huntazeApp.name} (${huntazeApp.appId})`);

    // Déclencher le build
    const startJobResponse = await client.send(new StartJobCommand({
      appId: huntazeApp.appId,
      branchName: branchName,
      jobType: 'RELEASE',
      jobReason: `Manual trigger from script - ${new Date().toISOString()}`
    }));

    console.log(`🎯 Build déclenché avec succès!`);
    console.log(`   Job ID: ${startJobResponse.jobSummary.jobId}`);
    console.log(`   Status: ${startJobResponse.jobSummary.status}`);
    console.log(`   Commit: ${startJobResponse.jobSummary.commitId}`);
    
    // URL pour suivre le build
    const region = process.env.AWS_REGION || 'us-east-1';
    const buildUrl = `https://${region}.console.aws.amazon.com/amplify/home?region=${region}#/${huntazeApp.appId}/${branchName}/${startJobResponse.jobSummary.jobId}`;
    console.log(`\n🔗 Suivre le build: ${buildUrl}`);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    
    if (error.name === 'BadRequestException') {
      console.log('\n⚠️  Vérifiez que:');
      console.log('   - La branche existe dans Amplify');
      console.log('   - Auto-build est activé');
      console.log('   - Aucun build n\'est déjà en cours');
    }
  }
}

const branchName = process.argv[2] || 'staging';
triggerBuild(branchName);