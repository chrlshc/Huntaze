#!/usr/bin/env node

/**
 * Seed Onboarding Demo Data
 * 
 * Creates demo onboarding steps and user progress for testing.
 * Run with: node scripts/seed-onboarding-demo.js
 */

const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const DEMO_STEPS = [
  {
    id: 'email_verification',
    version: 1,
    title: 'Vérifier votre email',
    description: 'Confirmez votre adresse email pour sécuriser votre compte',
    required: true,
    weight: 20,
    market_rule: null,
    role_visibility: ['owner', 'staff', 'admin'],
  },
  {
    id: 'payments',
    version: 1,
    title: 'Configurer les paiements',
    description: 'Ajoutez vos informations de paiement pour encaisser',
    required: true,
    weight: 30,
    market_rule: null,
    role_visibility: ['owner'],
  },
  {
    id: 'theme',
    version: 1,
    title: 'Personnaliser votre thème',
    description: 'Choisissez et personnalisez l\'apparence de votre boutique',
    required: false,
    weight: 15,
    market_rule: null,
    role_visibility: ['owner', 'admin'],
  },
  {
    id: 'product',
    version: 1,
    title: 'Ajouter un produit',
    description: 'Créez votre premier produit ou service',
    required: false,
    weight: 20,
    market_rule: null,
    role_visibility: ['owner', 'staff', 'admin'],
  },
  {
    id: 'domain',
    version: 1,
    title: 'Connecter un domaine',
    description: 'Utilisez votre propre nom de domaine',
    required: false,
    weight: 10,
    market_rule: null,
    role_visibility: ['owner'],
  },
  {
    id: 'impressum',
    version: 1,
    title: 'Ajouter l\'Impressum',
    description: 'Mentions légales obligatoires en Allemagne',
    required: false,
    weight: 5,
    market_rule: { required_for_markets: ['DE'] },
    role_visibility: ['owner'],
  },
];

async function seedOnboardingSteps() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Seeding onboarding step definitions...');
    
    await client.query('BEGIN');
    
    for (const step of DEMO_STEPS) {
      await client.query(
        `INSERT INTO onboarding_step_definitions 
         (id, version, title, description, required, weight, market_rule, role_visibility, active_from)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
         ON CONFLICT (id, version) DO UPDATE SET
           title = EXCLUDED.title,
           description = EXCLUDED.description,
           required = EXCLUDED.required,
           weight = EXCLUDED.weight,
           market_rule = EXCLUDED.market_rule,
           role_visibility = EXCLUDED.role_visibility,
           updated_at = NOW()`,
        [
          step.id,
          step.version,
          step.title,
          step.description,
          step.required,
          step.weight,
          step.market_rule ? JSON.stringify(step.market_rule) : null,
          step.role_visibility,
        ]
      );
      console.log(`  ✓ ${step.id}`);
    }
    
    await client.query('COMMIT');
    console.log('✅ Onboarding steps seeded successfully!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding onboarding steps:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function createDemoUserProgress(userId) {
  const client = await pool.connect();
  
  try {
    console.log(`\n🌱 Creating demo progress for user ${userId}...`);
    
    await client.query('BEGIN');
    
    // Email verified (done)
    await client.query(
      `INSERT INTO user_onboarding (user_id, step_id, version, status, completed_at)
       VALUES ($1, 'email_verification', 1, 'done', NOW())
       ON CONFLICT (user_id, step_id, version) DO NOTHING`,
      [userId]
    );
    console.log('  ✓ email_verification: done');
    
    // Theme skipped
    await client.query(
      `INSERT INTO user_onboarding (user_id, step_id, version, status)
       VALUES ($1, 'theme', 1, 'skipped')
       ON CONFLICT (user_id, step_id, version) DO NOTHING`,
      [userId]
    );
    console.log('  ✓ theme: skipped');
    
    // Others: todo (no entry needed, default state)
    console.log('  ✓ payments, product, domain: todo (default)');
    
    await client.query('COMMIT');
    console.log('✅ Demo user progress created!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error creating demo user progress:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  try {
    console.log('🚀 Starting onboarding demo seed...\n');
    
    // Seed step definitions
    await seedOnboardingSteps();
    
    // Optionally create demo user progress
    const demoUserId = process.env.DEMO_USER_ID;
    if (demoUserId) {
      await createDemoUserProgress(demoUserId);
    } else {
      console.log('\n💡 Tip: Set DEMO_USER_ID env var to create demo user progress');
    }
    
    console.log('\n🎉 All done!');
    process.exit(0);
    
  } catch (error) {
    console.error('\n💥 Seed failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
