#!/usr/bin/env node

/**
 * Script de diagnostic AWS Amplify
 * Usage: AWS_ACCESS_KEY_ID=REDACTED AWS_SECRET_ACCESS_KEY=REDACTED node scripts/check-amplify-status.js
 */

const { AmplifyClient, ListAppsCommand, GetAppCommand, ListBranchesCommand, ListJobsCommand } = require('@aws-sdk/client-amplify');

async function checkAmplifyStatus() {
    try {
        console.log('🔍 Vérification du statut AWS Amplify...\n');

        // Configuration du client AWS
        const client = new AmplifyClient({
            region: process.env.AWS_REGION || 'us-east-1',
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
                sessionToken: process.env.AWS_SESSION_TOKEN // Pour les credentials temporaires
            }
        });

        // 1. Lister toutes les apps Amplify
        console.log('📱 Applications Amplify disponibles:');
        const listAppsResponse = await client.send(new ListAppsCommand({}));

        if (!listAppsResponse.apps || listAppsResponse.apps.length === 0) {
            console.log('❌ Aucune application Amplify trouvée');
            return;
        }

        // Trouver l'app Huntaze
        const huntazeApp = listAppsResponse.apps.find(app =>
            app.name.toLowerCase().includes('huntaze') ||
            app.repository?.includes('huntaze') ||
            app.repository?.includes('Huntaze')
        );

        if (!huntazeApp) {
            console.log('❌ Application Huntaze non trouvée');
            console.log('Applications disponibles:');
            listAppsResponse.apps.forEach(app => {
                console.log(`  - ${app.name} (${app.appId})`);
            });
            return;
        }

        console.log(`✅ Application trouvée: ${huntazeApp.name} (${huntazeApp.appId})`);
        console.log(`   Repository: ${huntazeApp.repository}`);
        console.log(`   Status: ${huntazeApp.enableBranchAutoBuild ? '🟢 Auto-build activé' : '🔴 Auto-build désactivé'}\n`);

        // 2. Détails de l'application
        const appDetails = await client.send(new GetAppCommand({ appId: huntazeApp.appId }));
        console.log('📋 Détails de l\'application:');
        console.log(`   Platform: ${appDetails.app.platform}`);
        console.log(`   Created: ${appDetails.app.createTime}`);
        console.log(`   Updated: ${appDetails.app.updateTime}\n`);

        // 3. Lister les branches
        console.log('🌿 Branches configurées:');
        const branchesResponse = await client.send(new ListBranchesCommand({ appId: huntazeApp.appId }));

        for (const branch of branchesResponse.branches) {
            console.log(`\n   📂 Branche: ${branch.branchName}`);
            console.log(`      Status: ${branch.enableAutoBuild ? '🟢 Auto-build ON' : '🔴 Auto-build OFF'}`);
            console.log(`      Stage: ${branch.stage}`);
            console.log(`      Framework: ${branch.framework}`);
            console.log(`      Updated: ${branch.updateTime}`);

            if (branch.thumbnailUrl) {
                console.log(`      URL: ${branch.thumbnailUrl.replace('/thumb', '')}`);
            }

            // 4. Derniers jobs pour cette branche
            try {
                const jobsResponse = await client.send(new ListJobsCommand({
                    appId: huntazeApp.appId,
                    branchName: branch.branchName,
                    maxResults: 3
                }));

                if (jobsResponse.jobSummaries && jobsResponse.jobSummaries.length > 0) {
                    console.log(`      📊 Derniers builds:`);
                    jobsResponse.jobSummaries.forEach((job, index) => {
                        const statusIcon = job.status === 'SUCCEED' ? '✅' :
                            job.status === 'FAILED' ? '❌' :
                                job.status === 'RUNNING' ? '🔄' : '⏳';
                        console.log(`         ${index + 1}. ${statusIcon} ${job.status} - ${job.commitMessage || 'No message'}`);
                        console.log(`            Job ID: ${job.jobId}`);
                        console.log(`            Commit: ${job.commitId?.substring(0, 8)}`);
                        console.log(`            Started: ${job.startTime}`);
                        if (job.endTime) {
                            console.log(`            Ended: ${job.endTime}`);
                        }
                    });
                } else {
                    console.log(`      📊 Aucun build trouvé`);
                }
            } catch (jobError) {
                console.log(`      ⚠️  Erreur lors de la récupération des jobs: ${jobError.message}`);
            }
        }

        // 5. Recommandations
        console.log('\n🎯 Recommandations:');

        const stagingBranch = branchesResponse.branches.find(b => b.branchName === 'staging');
        const prodBranch = branchesResponse.branches.find(b => b.branchName === 'prod');

        if (!stagingBranch) {
            console.log('   ⚠️  Branche staging non configurée dans Amplify');
        } else if (!stagingBranch.enableAutoBuild) {
            console.log('   ⚠️  Auto-build désactivé pour staging');
        }

        if (!prodBranch) {
            console.log('   ⚠️  Branche prod non configurée dans Amplify');
        } else if (!prodBranch.enableAutoBuild) {
            console.log('   ⚠️  Auto-build désactivé pour prod');
        }

        // Vérifier les webhooks GitHub
        console.log('\n🔗 Pour vérifier les webhooks GitHub:');
        console.log('   1. Allez sur https://github.com/chrlshc/Huntaze/settings/hooks');
        console.log('   2. Vérifiez qu\'il y a un webhook Amplify actif');
        console.log('   3. L\'URL devrait contenir: webhooks.amplify');

    } catch (error) {
        console.error('❌ Erreur:', error.message);

        if (error.name === 'UnauthorizedOperation' || error.name === 'AccessDenied') {
            console.log('\n🔑 Problème d\'authentification:');
            console.log('   - Vérifiez vos AWS credentials');
            console.log('   - Assurez-vous d\'avoir les permissions Amplify');
        }

        if (error.name === 'InvalidUserPoolConfigurationException') {
            console.log('\n⚠️  Problème de configuration:');
            console.log('   - Vérifiez la région AWS');
            console.log('   - Vérifiez que l\'app Amplify existe');
        }
    }
}

// Vérifier les variables d'environnement
if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.log('❌ Variables d\'environnement AWS manquantes');
    console.log('\nUsage:');
    console.log('AWS_ACCESS_KEY_ID=REDACTED AWS_SECRET_ACCESS_KEY=REDACTED node scripts/check-amplify-status.js');
    console.log('\nOu pour les credentials temporaires:');
    console.log('AWS_ACCESS_KEY_ID=REDACTED AWS_SECRET_ACCESS_KEY=REDACTED AWS_SESSION_TOKEN=REDACTED node scripts/check-amplify-status.js');
    process.exit(1);
}

checkAmplifyStatus();