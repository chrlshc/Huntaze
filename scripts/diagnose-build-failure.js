#!/usr/bin/env node

/**
 * Script de diagnostic rapide pour les échecs de build Amplify
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 DIAGNOSTIC BUILD FAILURE - Amplify Staging');
console.log('==============================================');

function checkFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return {
      exists: true,
      size: stats.size,
      sizeKB: Math.round(stats.size / 1024),
      sizeMB: Math.round(stats.size / (1024 * 1024))
    };
  } catch (error) {
    return { exists: false, size: 0 };
  }
}

function analyzeProject() {
  console.log('\n📊 Analyse de la taille du projet...');
  
  // Vérifier les fichiers critiques
  const criticalFiles = [
    'package.json',
    'next.config.ts',
    'amplify.yml',
    'tailwind.config.mjs'
  ];
  
  criticalFiles.forEach(file => {
    const info = checkFileSize(file);
    if (info.exists) {
      console.log(`✅ ${file}: ${info.sizeKB}KB`);
    } else {
      console.log(`❌ ${file}: MANQUANT`);
    }
  });
  
  // Vérifier les dossiers volumineux
  console.log('\n📁 Analyse des dossiers...');
  
  const folders = ['node_modules', 'logs', 'tests', 'components', 'app'];
  folders.forEach(folder => {
    if (fs.existsSync(folder)) {
      try {
        const files = fs.readdirSync(folder, { recursive: true });
        console.log(`📂 ${folder}: ${files.length} fichiers`);
      } catch (error) {
        console.log(`📂 ${folder}: Erreur lecture`);
      }
    } else {
      console.log(`📂 ${folder}: N'existe pas`);
    }
  });
}

function checkAmplifyConfig() {
  console.log('\n⚙️ Vérification configuration Amplify...');
  
  const amplifyConfig = checkFileSize('amplify.yml');
  if (amplifyConfig.exists) {
    console.log(`✅ amplify.yml: ${amplifyConfig.sizeKB}KB`);
    
    try {
      const content = fs.readFileSync('amplify.yml', 'utf8');
      
      // Vérifier les optimisations
      const hasMemoryOptim = content.includes('max-old-space-size');
      const hasProgressDisabled = content.includes('NPM_CONFIG_PROGRESS=false');
      const hasSilentInstall = content.includes('--silent');
      
      console.log(`🧠 Optimisation mémoire: ${hasMemoryOptim ? '✅' : '❌'}`);
      console.log(`🔇 Progress désactivé: ${hasProgressDisabled ? '✅' : '❌'}`);
      console.log(`🤫 Installation silencieuse: ${hasSilentInstall ? '✅' : '❌'}`);
      
    } catch (error) {
      console.log('❌ Erreur lecture amplify.yml');
    }
  } else {
    console.log('❌ amplify.yml manquant');
  }
}

function checkPackageJson() {
  console.log('\n📦 Vérification package.json...');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    console.log(`📝 Nom: ${packageJson.name}`);
    console.log(`🔢 Version: ${packageJson.version}`);
    
    const depCount = Object.keys(packageJson.dependencies || {}).length;
    const devDepCount = Object.keys(packageJson.devDependencies || {}).length;
    
    console.log(`📚 Dépendances: ${depCount}`);
    console.log(`🛠️ Dépendances dev: ${devDepCount}`);
    
    // Vérifier les scripts de build
    const buildScript = packageJson.scripts?.build;
    if (buildScript) {
      console.log(`🔨 Script build: ${buildScript}`);
    } else {
      console.log('❌ Script build manquant');
    }
    
  } catch (error) {
    console.log('❌ Erreur lecture package.json');
  }
}

function generateRecommendations() {
  console.log('\n💡 RECOMMANDATIONS POUR RÉSOUDRE L\'ÉCHEC');
  console.log('=========================================');
  
  console.log('\n🚀 Actions Immédiates:');
  console.log('1. Vérifier que amplify.yml a les optimisations mémoire');
  console.log('2. Supprimer les fichiers de logs volumineux');
  console.log('3. Configurer NODE_OPTIONS dans Amplify Console');
  console.log('4. Utiliser --silent pour réduire les logs npm');
  
  console.log('\n⚙️ Configuration Amplify Console:');
  console.log('- NODE_OPTIONS=--max-old-space-size=6144');
  console.log('- NPM_CONFIG_PROGRESS=false');
  console.log('- CI=true');
  
  console.log('\n🔄 Si le problème persiste:');
  console.log('1. Réduire la taille du commit');
  console.log('2. Exclure les fichiers de test volumineux');
  console.log('3. Utiliser un build incrémental');
  console.log('4. Contacter le support AWS Amplify');
}

function main() {
  try {
    analyzeProject();
    checkAmplifyConfig();
    checkPackageJson();
    generateRecommendations();
    
    console.log('\n✅ Diagnostic terminé');
    console.log('📄 Consultez les recommandations ci-dessus pour résoudre l\'échec');
    
  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error.message);
  }
}

if (require.main === module) {
  main();
}

module.exports = { analyzeProject, checkAmplifyConfig, checkPackageJson };