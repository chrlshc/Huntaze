// Capture le token d’ingest depuis la page /of-connect (meta of-bridge)
(function () {
  try {
    // Supporte deux formats:
    // 1) <meta name="of-bridge-token" content="..." />  (token seul)
    // 2) <meta name="of-bridge" content='{"userId":"...","apiBase":"...","ingestToken":"..."}' />
    const metaToken = document.querySelector('meta[name="of-bridge-token"]');
    const metaBridge = document.querySelector('meta[name="of-bridge"]');

    if (metaToken && metaToken.content) {
      chrome.runtime.sendMessage({ kind: 'OF_BRIDGE_SET_TOKEN', ingestToken: metaToken.content });
      return;
    }

    if (metaBridge && metaBridge.content) {
      try {
        const data = JSON.parse(metaBridge.content);
        if (data && data.ingestToken) {
          chrome.runtime.sendMessage({ kind: 'OF_BRIDGE_SET', bridge: data });
          return;
        }
      } catch {}
    }
  } catch {}
})();
