#!/usr/bin/env node

/**
 * Script d'installation des hooks Git pour la validation d'hydratation
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class HydrationHooksSetup {
  constructor() {
    this.projectRoot = process.cwd();
    this.gitHooksDir = path.join(this.projectRoot, '.git', 'hooks');
    this.scriptsDir = path.join(this.projectRoot, 'scripts');
  }

  /**
   * Vérifie si Git est initialisé
   */
  checkGitRepository() {
    const gitDir = path.join(this.projectRoot, '.git');
    if (!fs.existsSync(gitDir)) {
      throw new Error('Ce projet n\'est pas un dépôt Git. Initialisez Git d\'abord avec: git init');
    }
  }

  /**
   * Crée le hook pre-commit
   */
  createPreCommitHook() {
    const hookPath = path.join(this.gitHooksDir, 'pre-commit');
    const scriptPath = path.join(this.scriptsDir, 'pre-commit-hydration-check.js');

    const hookContent = `#!/bin/sh
#
# Hook pre-commit pour la validation d'hydratation
# Généré automatiquement par setup-hydration-hooks.js
#

echo "🔍 Validation d'hydratation pre-commit..."

# Exécuter la validation d'hydratation
node "${scriptPath}"

# Le code de sortie du script détermine si le commit est autorisé
exit $?
`;

    fs.writeFileSync(hookPath, hookContent, { mode: 0o755 });
    console.log('✅ Hook pre-commit créé');
  }

  /**
   * Crée le hook pre-push
   */
  createPrePushHook() {
    const hookPath = path.join(this.gitHooksDir, 'pre-push');
    const scriptPath = path.join(this.scriptsDir, 'validate-hydration-build.js');

    const hookContent = `#!/bin/sh
#
# Hook pre-push pour la validation d'hydratation complète
# Généré automatiquement par setup-hydration-hooks.js
#

echo "🚀 Validation d'hydratation complète avant push..."

# Exécuter la validation complète du projet
node "${scriptPath}"

if [ $? -ne 0 ]; then
    echo "❌ La validation d'hydratation a échoué"
    echo "   Corrigez les problèmes avant de pusher"
    exit 1
fi

echo "✅ Validation d'hydratation réussie"
exit 0
`;

    fs.writeFileSync(hookPath, hookContent, { mode: 0o755 });
    console.log('✅ Hook pre-push créé');
  }

  /**
   * Crée le hook commit-msg pour ajouter des infos sur l'hydratation
   */
  createCommitMsgHook() {
    const hookPath = path.join(this.gitHooksDir, 'commit-msg');

    const hookContent = `#!/bin/sh
#
# Hook commit-msg pour enrichir les messages de commit
# Généré automatiquement par setup-hydration-hooks.js
#

commit_file="$1"

# Vérifier si le commit contient des modifications d'hydratation
if git diff --cached --name-only | grep -E "components/hydration|hydration.*\\.(ts|tsx|js|jsx)$" > /dev/null; then
    # Ajouter une note sur les modifications d'hydratation
    echo "" >> "$commit_file"
    echo "🔧 Modifications liées à l'hydratation détectées" >> "$commit_file"
    echo "   Validation automatique effectuée" >> "$commit_file"
fi

exit 0
`;

    fs.writeFileSync(hookPath, hookContent, { mode: 0o755 });
    console.log('✅ Hook commit-msg créé');
  }

  /**
   * Sauvegarde les hooks existants
   */
  backupExistingHooks() {
    const hooks = ['pre-commit', 'pre-push', 'commit-msg'];
    const backupDir = path.join(this.gitHooksDir, 'backup');

    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    for (const hook of hooks) {
      const hookPath = path.join(this.gitHooksDir, hook);
      if (fs.existsSync(hookPath)) {
        const backupPath = path.join(backupDir, `${hook}.backup.${Date.now()}`);
        fs.copyFileSync(hookPath, backupPath);
        console.log(`📦 Hook existant sauvegardé: ${hook} -> ${path.basename(backupPath)}`);
      }
    }
  }

  /**
   * Crée la configuration Husky si elle n'existe pas
   */
  setupHuskyIntegration() {
    const huskyDir = path.join(this.projectRoot, '.husky');
    
    if (fs.existsSync(huskyDir)) {
      console.log('🐕 Husky détecté, création des hooks Husky...');
      
      // Hook pre-commit Husky
      const preCommitHusky = path.join(huskyDir, 'pre-commit');
      const preCommitContent = `#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Validation d'hydratation
node scripts/pre-commit-hydration-check.js
`;
      
      if (!fs.existsSync(preCommitHusky)) {
        fs.writeFileSync(preCommitHusky, preCommitContent, { mode: 0o755 });
        console.log('✅ Hook Husky pre-commit créé');
      } else {
        // Ajouter à la fin du fichier existant
        const existingContent = fs.readFileSync(preCommitHusky, 'utf8');
        if (!existingContent.includes('pre-commit-hydration-check.js')) {
          fs.appendFileSync(preCommitHusky, '\n# Validation d\'hydratation\nnode scripts/pre-commit-hydration-check.js\n');
          console.log('✅ Validation d\'hydratation ajoutée au hook Husky existant');
        }
      }
    }
  }

  /**
   * Met à jour package.json avec les scripts
   */
  updatePackageJson() {
    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      if (!packageJson.scripts) {
        packageJson.scripts = {};
      }

      // Ajouter les scripts de validation
      const newScripts = {
        'validate:hydration': 'node scripts/validate-hydration-build.js',
        'validate:hydration:pre-commit': 'node scripts/pre-commit-hydration-check.js',
        'setup:hydration-hooks': 'node scripts/setup-hydration-hooks.js'
      };

      let updated = false;
      for (const [script, command] of Object.entries(newScripts)) {
        if (!packageJson.scripts[script]) {
          packageJson.scripts[script] = command;
          updated = true;
        }
      }

      if (updated) {
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
        console.log('✅ Scripts ajoutés à package.json');
      }
    }
  }

  /**
   * Crée la documentation des hooks
   */
  createDocumentation() {
    const docsDir = path.join(this.projectRoot, 'docs');
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }

    const docPath = path.join(docsDir, 'HYDRATION_HOOKS_GUIDE.md');
    const docContent = `# Guide des Hooks d'Hydratation

Ce document explique les hooks Git configurés pour la validation automatique d'hydratation.

## Hooks Installés

### Pre-commit Hook
- **Fichier**: \`.git/hooks/pre-commit\`
- **Fonction**: Valide les fichiers modifiés avant chaque commit
- **Script**: \`scripts/pre-commit-hydration-check.js\`

**Comportement**:
- Analyse uniquement les fichiers React modifiés (staged)
- Bloque le commit si des erreurs d'hydratation sont détectées
- Affiche des suggestions de correction

### Pre-push Hook
- **Fichier**: \`.git/hooks/pre-push\`
- **Fonction**: Validation complète avant push
- **Script**: \`scripts/validate-hydration-build.js\`

**Comportement**:
- Analyse tout le projet
- Génère des rapports détaillés
- Bloque le push si des erreurs critiques sont trouvées

### Commit-msg Hook
- **Fichier**: \`.git/hooks/commit-msg\`
- **Fonction**: Enrichit les messages de commit
- **Comportement**: Ajoute des notes sur les modifications d'hydratation

## Scripts Disponibles

\`\`\`bash
# Validation complète du projet
npm run validate:hydration

# Validation pre-commit manuelle
npm run validate:hydration:pre-commit

# Réinstaller les hooks
npm run setup:hydration-hooks
\`\`\`

## Contournement des Hooks

En cas d'urgence, vous pouvez contourner les hooks :

\`\`\`bash
# Ignorer la validation pre-commit
git commit --no-verify -m "message"

# Ignorer la validation pre-push
git push --no-verify
\`\`\`

⚠️ **Attention**: Utilisez ces options avec précaution et assurez-vous de corriger les problèmes rapidement.

## Désinstallation

Pour désinstaller les hooks :

\`\`\`bash
rm .git/hooks/pre-commit
rm .git/hooks/pre-push
rm .git/hooks/commit-msg
\`\`\`

## Restauration des Hooks

Les hooks existants sont sauvegardés dans \`.git/hooks/backup/\` avec un timestamp.

## Configuration

La configuration se trouve dans \`hydration.config.js\` :

- \`failOnError\`: Bloquer sur les erreurs (défaut: true)
- \`failOnWarning\`: Bloquer sur les avertissements (défaut: false pour build, true pour pre-commit)
- \`excludePatterns\`: Patterns de fichiers à ignorer

## Intégration CI/CD

Les hooks sont complétés par le workflow GitHub Actions \`.github/workflows/hydration-validation.yml\` qui :

- Valide chaque PR
- Génère des rapports
- Commente les PR avec les résultats
- Surveille la production

## Support

En cas de problème avec les hooks :

1. Vérifiez les logs dans la console
2. Consultez les rapports dans \`hydration-reports/\`
3. Utilisez \`--no-verify\` temporairement si nécessaire
4. Contactez l'équipe de développement
`;

    fs.writeFileSync(docPath, docContent);
    console.log('✅ Documentation créée: docs/HYDRATION_HOOKS_GUIDE.md');
  }

  /**
   * Exécute l'installation complète
   */
  async install() {
    try {
      console.log('🚀 Installation des hooks d\'hydratation...\n');

      // Vérifications préliminaires
      this.checkGitRepository();

      // Sauvegarde des hooks existants
      this.backupExistingHooks();

      // Création des hooks
      this.createPreCommitHook();
      this.createPrePushHook();
      this.createCommitMsgHook();

      // Intégration Husky si disponible
      this.setupHuskyIntegration();

      // Mise à jour package.json
      this.updatePackageJson();

      // Documentation
      this.createDocumentation();

      console.log('\n✅ Installation terminée avec succès !');
      console.log('\n📋 Résumé:');
      console.log('   - Hooks Git installés et configurés');
      console.log('   - Scripts npm ajoutés');
      console.log('   - Documentation créée');
      console.log('   - Hooks existants sauvegardés');
      
      console.log('\n🎯 Prochaines étapes:');
      console.log('   1. Testez avec: git commit (sur des fichiers modifiés)');
      console.log('   2. Consultez: docs/HYDRATION_HOOKS_GUIDE.md');
      console.log('   3. Configurez: hydration.config.js si nécessaire');

    } catch (error) {
      console.error('❌ Erreur lors de l\'installation:', error.message);
      process.exit(1);
    }
  }

  /**
   * Désinstalle les hooks
   */
  uninstall() {
    const hooks = ['pre-commit', 'pre-push', 'commit-msg'];
    
    for (const hook of hooks) {
      const hookPath = path.join(this.gitHooksDir, hook);
      if (fs.existsSync(hookPath)) {
        fs.unlinkSync(hookPath);
        console.log(`🗑️ Hook supprimé: ${hook}`);
      }
    }
    
    console.log('✅ Hooks d\'hydratation désinstallés');
  }
}

// Exécution si appelé directement
if (require.main === module) {
  const setup = new HydrationHooksSetup();
  
  const command = process.argv[2];
  
  if (command === 'uninstall') {
    setup.uninstall();
  } else {
    setup.install();
  }
}

module.exports = { HydrationHooksSetup };