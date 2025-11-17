#!/usr/bin/env ts-node
/**
 * Script pour supprimer tous les utilisateurs de test de la base de données staging
 */

import { Client } from 'pg';

const DATABASE_URL = 'postgresql://huntazeadmin:2EkPVMUktEWcyJSz4lipzUqLPxQazxSI@huntaze-postgres-production.c2ryoow8c5m4.us-east-1.rds.amazonaws.com:5432/postgres';

async function cleanTestUsers() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    await client.connect();
    console.log('🔗 Connecté à la base de données\n');

    // Lister tous les utilisateurs
    console.log('📊 Utilisateurs actuels:');
    const allUsers = await client.query('SELECT id, email, name, created_at FROM users ORDER BY id');
    allUsers.rows.forEach(user => {
      console.log(`   ${user.id}. ${user.email} (${user.name}) - ${new Date(user.created_at).toLocaleString()}`);
    });
    console.log('');

    // Patterns d'emails de test à supprimer
    const testPatterns = [
      'test-%@example.com',
      'user%@example.com',
      '%@test.com',
      'hc.hbtpro@gmail.com',
      'huntcharles253@gmail.com'
    ];

    console.log('🗑️  Suppression des utilisateurs de test...\n');

    let totalDeleted = 0;

    for (const pattern of testPatterns) {
      const result = await client.query(
        'DELETE FROM users WHERE email LIKE $1 RETURNING id, email',
        [pattern]
      );
      
      if (result.rows.length > 0) {
        console.log(`   ✅ Supprimé ${result.rows.length} utilisateur(s) correspondant à: ${pattern}`);
        result.rows.forEach(user => {
          console.log(`      - ${user.email} (ID: ${user.id})`);
        });
        totalDeleted += result.rows.length;
      }
    }

    console.log('');
    console.log(`✅ Total supprimé: ${totalDeleted} utilisateur(s)\n`);

    // Lister les utilisateurs restants
    console.log('📊 Utilisateurs restants:');
    const remainingUsers = await client.query('SELECT id, email, name, created_at FROM users ORDER BY id');
    
    if (remainingUsers.rows.length === 0) {
      console.log('   (aucun utilisateur)');
    } else {
      remainingUsers.rows.forEach(user => {
        console.log(`   ${user.id}. ${user.email} (${user.name}) - ${new Date(user.created_at).toLocaleString()}`);
      });
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await client.end();
    console.log('\n🔌 Connexion fermée');
  }
}

cleanTestUsers();
