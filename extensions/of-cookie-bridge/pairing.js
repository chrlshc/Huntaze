(() => {
  try {
    const meta = document.querySelector('meta[name="of-bridge"]');
    if (!meta) return;
    const data = JSON.parse(meta.content);
    const apiBase = location.origin; // force current origin for API
    chrome.runtime.sendMessage({ type: 'PAIR', userId: data.userId, ingestToken: data.ingestToken, apiBase });
  } catch (e) {
    // no-op
  }
})();
