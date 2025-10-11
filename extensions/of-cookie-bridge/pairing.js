(() => {
  try {
    const meta = document.querySelector('meta[name="of-bridge"]');
    if (!meta) return;
    const data = JSON.parse(meta.content);
    chrome.runtime.sendMessage({ type: 'PAIR', ...data });
  } catch (e) {
    // no-op
  }
})();

