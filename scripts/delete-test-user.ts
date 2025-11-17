#!/usr/bin/env ts-node
/**
 * Supprimer un utilisateur de test de la base de données
 */

import { Client } from 'pg';

const DATABASE_URL = 'postgresql://huntazeadmin:2EkPVMUktEWcyJSz4lipzUqLPxQazxSI@huntaze-postgres-production.c2ryoow8c5m4.us-east-1.rds.amazonaws.com:5432/postgres';

async function deleteUser(email: string) {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    await client.connect();
    console.log('✅ Connecté à la base de données\n');

    // Vérifier si l'utilisateur existe
    const checkResult = await client.query(
      'SELECT id, email, name FROM users WHERE email = $1',
      [email]
    );

    if (checkResult.rows.length === 0) {
      console.log(`❌ Aucun utilisateur trouvé avec l'email: ${email}`);
      return;
    }

    const user = checkResult.rows[0];
    console.log('👤 Utilisateur trouvé:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name}`);
    console.log('');

    // Supprimer l'utilisateur
    await client.query('DELETE FROM users WHERE email = $1', [email]);
    console.log('✅ Utilisateur supprimé avec succès!');

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await client.end();
  }
}

// Récupérer l'email depuis les arguments de ligne de commande
const email = process.argv[2];

if (!email) {
  console.log('Usage: npx ts-node scripts/delete-test-user.ts <email>');
  console.log('Exemple: npx ts-node scripts/delete-test-user.ts test@example.com');
  process.exit(1);
}

deleteUser(email);
