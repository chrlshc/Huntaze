#!/usr/bin/env npx tsx
/**
 * Test OnlyFans Client CLI
 * Usage: npx tsx scripts/test-of-client.ts [userId]
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const userId = process.argv[2];

  console.log('\n🔍 OnlyFans Client Test\n');
  console.log('='.repeat(50));

  // 1. Lister les users avec cookies OF
  const usersWithOF = await prisma.users.findMany({
    where: {
      of_cookies: { not: null },
    },
    select: {
      id: true,
      email: true,
      name: true,
      of_cookies: true,
      of_user_agent: true,
    },
  });

  if (usersWithOF.length === 0) {
    console.log('\n❌ Aucun utilisateur avec cookies OnlyFans trouvé.');
    console.log('   → Connecte-toi via le bookmarklet sur ton iPhone d\'abord.\n');
    process.exit(1);
  }

  console.log(`\n✅ ${usersWithOF.length} utilisateur(s) avec cookies OF:\n`);
  usersWithOF.forEach((u, i) => {
    const hasCookies = u.of_cookies ? '✓' : '✗';
    const hasUA = u.of_user_agent ? '✓' : '✗';
    console.log(`  ${i + 1}. ${u.email || u.name || 'N/A'}`);
    console.log(`     ID: ${u.id}`);
    console.log(`     Cookies: ${hasCookies} | User-Agent: ${hasUA}`);
    console.log('');
  });

  // 2. Si userId fourni, tester la session
  const targetUserId = userId || usersWithOF[0]?.id;
  
  if (!targetUserId) {
    console.log('❌ Aucun userId à tester.\n');
    process.exit(1);
  }

  console.log('='.repeat(50));
  console.log(`\n🧪 Test de session pour: ${targetUserId}\n`);

  const user = usersWithOF.find(u => u.id === targetUserId);
  if (!user) {
    console.log(`❌ User ${targetUserId} non trouvé ou sans cookies OF.\n`);
    process.exit(1);
  }

  // 3. Test direct avec axios (sans proxy pour le test)
  const axios = (await import('axios')).default;
  
  try {
    console.log('📡 Appel à OnlyFans /api2/v2/users/me...\n');
    
    const response = await axios.get('https://onlyfans.com/api2/v2/users/me', {
      headers: {
        'User-Agent': user.of_user_agent || '',
        'Cookie': user.of_cookies || '',
        'Accept': 'application/json, text/plain, */*',
        'App-Token': '33d57ade8c02dbc5a333db99ff9ae26a',
      },
      timeout: 10000,
    });

    console.log('✅ Session VALIDE!\n');
    console.log('📋 Infos du compte:');
    console.log(`   Username: ${response.data.username}`);
    console.log(`   Name: ${response.data.name}`);
    console.log(`   ID: ${response.data.id}`);
    console.log('');

  } catch (error: unknown) {
    const axiosError = error as { response?: { status?: number; data?: unknown }; message?: string };
    
    console.log('❌ Session INVALIDE ou erreur\n');
    console.log(`   Status: ${axiosError.response?.status || 'N/A'}`);
    console.log(`   Message: ${axiosError.message}`);
    
    if (axiosError.response?.status === 401 || axiosError.response?.status === 403) {
      console.log('\n💡 La session a probablement expiré.');
      console.log('   → Reconnecte-toi via le bookmarklet.\n');
    }
  }

  await prisma.$disconnect();
}

main().catch(console.error);
