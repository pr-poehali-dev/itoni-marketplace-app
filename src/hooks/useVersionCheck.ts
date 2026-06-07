import { useEffect, useRef } from 'react';

const CHECK_INTERVAL = 60_000;

async function fetchBuildSignature(): Promise<string | null> {
  try {
    const res = await fetch('/index.html?_v=' + Date.now(), { cache: 'no-store' });
    if (!res.ok) return null;
    const html = await res.text();
    const match = html.match(/src="\/assets\/[^"']+\.js"/g);
    return match ? match.join('|') : html.length.toString();
  } catch {
    return null;
  }
}

export function useVersionCheck() {
  const current = useRef<string | null>(null);
  const reloading = useRef(false);

  useEffect(() => {
    async function check() {
      const sig = await fetchBuildSignature();
      if (!sig) return;
      if (current.current === null) {
        current.current = sig;
        return;
      }
      if (sig !== current.current && !reloading.current) {
        reloading.current = true;
        window.location.reload();
      }
    }

    function onVisible() {
      if (document.visibilityState === 'visible') check();
    }

    check();
    const timer = setInterval(check, CHECK_INTERVAL);
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);
}