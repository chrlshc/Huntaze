#!/usr/bin/env ts-node
/**
 * Test direct de la connexion à la base de données staging
 */

import { Client } from 'pg';

const DATABASE_URL = 'postgresql://huntazeadmin:2EkPVMUktEWcyJSz4lipzUqLPxQazxSI@huntaze-postgres-production.c2ryoow8c5m4.us-east-1.rds.amazonaws.com:5432/postgres';

async function testConnection() {
  console.log('🔍 Test de connexion à la base de données staging...\n');
  
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false, // Pour accepter les certificats auto-signés
    },
  });

  try {
    console.log('📡 Connexion en cours...');
    await client.connect();
    console.log('✅ Connexion réussie!\n');

    // Test de requête simple
    console.log('📊 Test de requête...');
    const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
    console.log('✅ Requête réussie!');
    console.log('   Heure:', result.rows[0].current_time);
    console.log('   Version:', result.rows[0].pg_version.split(' ')[0], result.rows[0].pg_version.split(' ')[1]);

    // Vérifier la table users
    console.log('\n📋 Vérification de la table users...');
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    if (tableCheck.rows[0].exists) {
      console.log('✅ Table users existe');
      
      // Afficher la structure de la table
      console.log('\n📊 Structure de la table users:');
      const columnsResult = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'users'
        ORDER BY ordinal_position;
      `);
      columnsResult.rows.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : '(NULL)'}`);
      });
      
      const countResult = await client.query('SELECT COUNT(*) as count FROM users');
      console.log(`\n   Nombre d'utilisateurs: ${countResult.rows[0].count}`);
      
      // Afficher les utilisateurs
      const usersResult = await client.query('SELECT id, email, name, created_at FROM users ORDER BY id');
      console.log('\n👥 Utilisateurs:');
      usersResult.rows.forEach(user => {
        console.log(`   ${user.id}. ${user.email} (${user.name}) - Créé le ${new Date(user.created_at).toLocaleString()}`);
      });
    } else {
      console.log('❌ Table users n\'existe pas');
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
    if (error instanceof Error) {
      console.error('   Message:', error.message);
      console.error('   Stack:', error.stack);
    }
  } finally {
    await client.end();
    console.log('\n🔌 Connexion fermée');
  }
}

testConnection();
