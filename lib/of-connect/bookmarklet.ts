// lib/of-connect/bookmarklet.ts

export function generateBookmarkletCode(userId: string, apiUrl: string) {
  // Le code qui s'exécutera sur Safari Mobile
  // Note : on injecte userId dans le corps de la requête fetch
  const code = `
    (function(){
      if(!window.location.hostname.includes('onlyfans.com')){
        alert('⚠️ Tu dois être sur OnlyFans.com !');
        window.location.href='https://onlyfans.com';
        return;
      }
      alert('🔄 Connexion en cours... Attends 2 sec.');
      
      var p = {
        userId: '${userId}',
        cookies: document.cookie,
        user_agent: navigator.userAgent
      };

      fetch('${apiUrl}', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(p)
      })
      .then(r => {
        if(r.ok) {
          alert('✅ Succès ! Compte relié. Retourne sur l\\'app.');
        } else {
          alert('❌ Erreur serveur (' + r.status + ')');
        }
      })
      .catch(e => alert('❌ Erreur réseau: ' + e));
    })();
  `;

  // Minification basique pour le bookmarklet (suppression sauts de ligne et espaces inutiles)
  return 'javascript:' + code.replace(/\s+/g, ' ').trim();
}
