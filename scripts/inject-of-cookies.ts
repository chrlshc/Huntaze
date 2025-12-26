#!/usr/bin/env npx tsx
/**
 * Inject OnlyFans Cookies Manually
 * 
 * Usage: npx tsx scripts/inject-of-cookies.ts
 * 
 * Instructions:
 * 1. Ouvre OnlyFans dans Chrome/Safari sur ton Mac
 * 2. Ouvre DevTools (F12) → Application → Cookies
 * 3. Copie tous les cookies (ou utilise document.cookie dans la console)
 * 4. Colle-les quand demandé
 */

import { PrismaClient } from '@prisma/client';
import * as readline from 'readline';

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function main() {
  console.log('\n🍪 OnlyFans Cookie Injector\n');
  console.log('='.repeat(50));
  console.log('\n📋 Instructions:');
  console.log('1. Va sur https://onlyfans.com et connecte-toi');
  console.log('2. Ouvre DevTools (Cmd+Option+I ou F12)');
  console.log('3. Va dans Console et tape: document.cookie');
  console.log('4. Copie le résultat (sans les guillemets)\n');
  console.log('='.repeat(50));

  // 1. Lister les users existants
  const users = await prisma.users.findMany({
    select: { id: true, email: true, name: true },
    take: 10,
  });

  if (users.length === 0) {
    console.log('\n❌ Aucun utilisateur en base. Crée un compte d\'abord.\n');
    process.exit(1);
  }

  console.log('\n👤 Utilisateurs disponibles:\n');
  users.forEach((u, i) => {
    console.log(`  ${i + 1}. ${u.email || u.name || 'N/A'} (${u.id.slice(0, 8)}...)`);
  });

  const userIndex = await ask('\nChoisis un numéro (ou entre un ID): ');
  
  let userId: string;
  const idx = parseInt(userIndex) - 1;
  if (idx >= 0 && idx < users.length) {
    userId = users[idx].id;
  } else {
    userId = userIndex.trim();
  }

  console.log(`\n✅ User sélectionné: ${userId}\n`);

  // 2. Demander les cookies
  console.log('📋 Colle tes cookies OnlyFans (document.cookie):');
  const cookies = await ask('> ');

  if (!cookies || cookies.length < 50) {
    console.log('\n❌ Cookies invalides ou trop courts.\n');
    process.exit(1);
  }

  // 3. Demander le User-Agent
  console.log('\n📱 Colle ton User-Agent (navigator.userAgent dans la console):');
  console.log('   (ou appuie Entrée pour utiliser un UA par défaut)');
  let userAgent = await ask('> ');

  if (!userAgent.trim()) {
    userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    console.log(`   → UA par défaut utilisé`);
  }

  // 4. Sauvegarder en DB
  console.log('\n💾 Sauvegarde en base...');
  
  await prisma.users.update({
    where: { id: userId },
    data: {
      of_cookies: cookies.trim(),
      of_user_agent: userAgent.trim(),
    },
  });

  console.log('✅ Cookies sauvegardés!\n');

  // 5. Tester la session
  console.log('🧪 Test de la session OnlyFans...\n');
  
  const axios = (await import('axios')).default;
  
  try {
    const response = await axios.get('https://onlyfans.com/api2/v2/users/me', {
      headers: {
        'User-Agent': userAgent,
        'Cookie': cookies,
        'Accept': 'application/json, text/plain, */*',
        'App-Token': '33d57ade8c02dbc5a333db99ff9ae26a',
      },
      timeout: 10000,
    });

    console.log('✅ Session VALIDE!\n');
    console.log('📋 Compte OnlyFans:');
    console.log(`   Username: ${response.data.username}`);
    console.log(`   Name: ${response.data.name}`);
    console.log(`   ID: ${response.data.id}\n`);

  } catch (error: unknown) {
    const axiosError = error as { response?: { status?: number }; message?: string };
    
    console.log('❌ Session INVALIDE\n');
    console.log(`   Status: ${axiosError.response?.status || 'N/A'}`);
    console.log(`   Message: ${axiosError.message}\n`);
    
    if (axiosError.response?.status === 401 || axiosError.response?.status === 403) {
      console.log('💡 Possible causes:');
      console.log('   - Cookies expirés ou incomplets');
      console.log('   - Signature manquante (x-bc header)');
      console.log('   - OnlyFans bloque les requêtes serveur\n');
    }
  }

  rl.close();
  await prisma.$disconnect();
}

main().catch(console.error);
