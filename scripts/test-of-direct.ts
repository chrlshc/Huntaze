#!/usr/bin/env npx tsx
/**
 * Test OnlyFans API directement avec les cookies fournis
 */

const cookies = `fp=20a0c468f2bd2a310cc6572bd3e50239683620c5; lang=fr; cookiesAccepted=all; ref_src=https%3A%2F%2Fid.onlyfans.com%2F; st=86ad131e4746f545a84e1bfd676682abad2bed52fb7060ef994a88dcad8a8a24; c=397358158-2`;

const userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function main() {
  console.log('\n🧪 Test direct OnlyFans API\n');
  console.log('='.repeat(50));
  console.log('\n📋 Cookies utilisés:');
  console.log(`   ${cookies.slice(0, 60)}...`);
  console.log('\n📡 Appel à /api2/v2/users/me...\n');

  const axios = (await import('axios')).default;

  try {
    const response = await axios.get('https://onlyfans.com/api2/v2/users/me', {
      headers: {
        'User-Agent': userAgent,
        'Cookie': cookies,
        'Accept': 'application/json, text/plain, */*',
        'App-Token': '33d57ade8c02dbc5a333db99ff9ae26a',
      },
      timeout: 15000,
    });

    console.log('✅ Session VALIDE!\n');
    console.log('📋 Compte OnlyFans:');
    console.log(`   Username: ${response.data.username}`);
    console.log(`   Name: ${response.data.name}`);
    console.log(`   ID: ${response.data.id}`);
    console.log(`   Email: ${response.data.email || 'N/A'}`);
    console.log('');

  } catch (error: unknown) {
    const axiosError = error as { 
      response?: { status?: number; data?: unknown; headers?: Record<string, string> }; 
      message?: string;
      code?: string;
    };

    console.log('❌ Erreur\n');
    console.log(`   Status: ${axiosError.response?.status || 'N/A'}`);
    console.log(`   Code: ${axiosError.code || 'N/A'}`);
    console.log(`   Message: ${axiosError.message}\n`);

    if (axiosError.response?.status === 401) {
      console.log('💡 401 Unauthorized - Cookies expirés ou invalides');
      console.log('   → Reconnecte-toi sur OnlyFans et récupère de nouveaux cookies\n');
    } else if (axiosError.response?.status === 403) {
      console.log('💡 403 Forbidden - Signature manquante ou IP bloquée');
      console.log('   → OnlyFans requiert probablement des headers supplémentaires (x-bc, sign, time)');
      console.log('   → Ou ton IP serveur est bloquée (besoin d\'un proxy résidentiel)\n');
    }

    // Afficher les headers de réponse pour debug
    if (axiosError.response?.headers) {
      console.log('📋 Response headers:');
      const headers = axiosError.response.headers;
      ['cf-ray', 'server', 'content-type'].forEach(h => {
        if (headers[h]) console.log(`   ${h}: ${headers[h]}`);
      });
    }

    // Afficher le body de la réponse
    if (axiosError.response?.data) {
      console.log('\n📋 Response body:');
      console.log(JSON.stringify(axiosError.response.data, null, 2));
    }
  }
}

main().catch(console.error);
