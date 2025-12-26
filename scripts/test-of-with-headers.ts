#!/usr/bin/env npx tsx
/**
 * Test OnlyFans API avec TOUS les headers nécessaires
 * 
 * INSTRUCTIONS:
 * 1. Va sur onlyfans.com et connecte-toi
 * 2. Ouvre DevTools (F12) → Network
 * 3. Rafraîchis la page
 * 4. Cherche une requête vers /api2/v2/users/me ou similaire
 * 5. Copie les headers suivants depuis la requête:
 *    - Cookie (complet)
 *    - User-Agent
 *    - x-bc
 *    - sign (ou signature)
 *    - time
 */

// ============================================
// COLLE TES HEADERS ICI (depuis DevTools)
// ============================================

const HEADERS = {
  // Cookie complet (copie tout le header Cookie)
  cookie: `fp=20a0c468f2bd2a310cc6572bd3e50239683620c5; lang=fr; cookiesAccepted=all; ref_src=https%3A%2F%2Fid.onlyfans.com%2F; st=86ad131e4746f545a84e1bfd676682abad2bed52fb7060ef994a88dcad8a8a24; c=397358158-2`,
  
  // User-Agent (copie depuis DevTools)
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  
  // x-bc header (IMPORTANT - copie depuis DevTools)
  xBc: '',  // <-- COLLE ICI
  
  // sign header (signature dynamique)
  sign: '', // <-- COLLE ICI
  
  // time header (timestamp)
  time: '', // <-- COLLE ICI
};

// ============================================

async function main() {
  console.log('\n🧪 Test OnlyFans API avec headers complets\n');
  console.log('='.repeat(50));

  // Vérifier que les headers sont remplis
  if (!HEADERS.xBc || !HEADERS.sign || !HEADERS.time) {
    console.log('\n⚠️  Headers manquants!\n');
    console.log('Tu dois copier les headers depuis DevTools:');
    console.log('1. Va sur onlyfans.com (connecté)');
    console.log('2. Ouvre DevTools (F12) → Network');
    console.log('3. Rafraîchis la page');
    console.log('4. Clique sur une requête API (ex: users/me)');
    console.log('5. Dans "Request Headers", copie:');
    console.log('   - x-bc');
    console.log('   - sign');
    console.log('   - time');
    console.log('\n6. Colle-les dans ce fichier et relance le script\n');
    return;
  }

  console.log('\n📋 Headers configurés:');
  console.log(`   Cookie: ${HEADERS.cookie.slice(0, 50)}...`);
  console.log(`   x-bc: ${HEADERS.xBc.slice(0, 30)}...`);
  console.log(`   sign: ${HEADERS.sign.slice(0, 30)}...`);
  console.log(`   time: ${HEADERS.time}`);
  console.log('\n📡 Appel à /api2/v2/users/me...\n');

  const axios = (await import('axios')).default;

  try {
    const response = await axios.get('https://onlyfans.com/api2/v2/users/me', {
      headers: {
        'User-Agent': HEADERS.userAgent,
        'Cookie': HEADERS.cookie,
        'Accept': 'application/json, text/plain, */*',
        'App-Token': '33d57ade8c02dbc5a333db99ff9ae26a',
        'x-bc': HEADERS.xBc,
        'sign': HEADERS.sign,
        'time': HEADERS.time,
        'Referer': 'https://onlyfans.com/',
        'Origin': 'https://onlyfans.com',
      },
      timeout: 15000,
    });

    console.log('✅ Session VALIDE!\n');
    console.log('📋 Compte OnlyFans:');
    console.log(`   Username: ${response.data.username}`);
    console.log(`   Name: ${response.data.name}`);
    console.log(`   ID: ${response.data.id}`);
    console.log(`   Email: ${response.data.email || 'N/A'}`);
    console.log(`   isPerformer: ${response.data.isPerformer}`);
    console.log('');
    
    // Sauvegarder les infos pour usage futur
    console.log('💾 Pour sauvegarder en DB, utilise ces valeurs:');
    console.log(`   of_user_id: "${response.data.id}"`);
    console.log(`   of_username: "${response.data.username}"`);

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
      console.log('💡 401 Unauthorized - Session expirée');
      console.log('   → Reconnecte-toi sur OnlyFans et récupère de nouveaux headers\n');
    } else if (axiosError.response?.status === 403) {
      console.log('💡 403 Forbidden - Signature invalide ou expirée');
      console.log('   → Les headers sign/time expirent rapidement');
      console.log('   → Récupère de nouveaux headers depuis DevTools\n');
    } else if (axiosError.code === 'ECONNRESET') {
      console.log('💡 ECONNRESET - Connexion coupée par Cloudflare');
      console.log('   → Les headers sont probablement incorrects ou expirés');
      console.log('   → Assure-toi de copier TOUS les headers depuis une requête récente\n');
    }

    if (axiosError.response?.data) {
      console.log('📋 Response body:');
      console.log(JSON.stringify(axiosError.response.data, null, 2));
    }
  }
}

main().catch(console.error);
