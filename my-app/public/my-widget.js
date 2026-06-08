(function () {
  const script = document.currentScript;
  const widgetId = script.getAttribute('data-id');
  const container = document.getElementById("my-widget");

  async function trackImpression(adId, publisher_url) {
    try {
      await fetch("https://clickora-seven.vercel.app/api/Ad/Track-impression", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adId, publisher_url })
      });
    } catch (error) {
      console.error('[Impression] Failed to track:', error);
    }
  }

  const signals = {
    mouseMoved: false,
    scrolled: false,
    timeOnPage: 0,
    mouseEvents: 0,
  };

  const startTime = Date.now();
  document.addEventListener('mousemove', () => { signals.mouseMoved = true; signals.mouseEvents++; }, { passive: true });
  document.addEventListener('scroll', () => { signals.scrolled = true; }, { passive: true });

  async function trackClick(adId, publisher_url) {
    if (!window.AD_DATA.trackingToken) {
      return;
    }

    const clickId = `${adId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    signals.timeOnPage = Date.now() - startTime;

    const event = {
      adId, publisher_url, timestamp: Date.now(), clickId,
      trackingToken: window.AD_DATA.trackingToken,
      signals: { ...signals }
    };

    window.AD_DATA.trackingToken = null;

    fetch("https://clickora-seven.vercel.app/api/Ad/Track-click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ events: [event] })
    })
      .then(r => r.json())
      .then(d => console.log('[Click] Server response:', d))
      .catch(err => console.error('[Click] Failed:', err));
  }

  async function load_ad() {
    container.innerHTML = '<p style="color:#999;">Loading ad...</p>';

    const res = await fetch(`https://clickora-seven.vercel.app/api/Ad?id=${widgetId}`);
    const data = await res.json();

    if (!data.success) {
      console.error('[Widget] Failed to load ad:', data.error);
      container.innerHTML = '';
      return;
    }

    container.innerHTML = data.html;

    setTimeout(() => {
      const scriptTag = container.querySelector('script');
      if (scriptTag) {
        eval(scriptTag.textContent);
      }

      if (window.AD_DATA) {
        trackImpression(window.AD_DATA.adId, window.AD_DATA.publisher_url);

        const adLink = container.querySelector('.ad-container');
        if (adLink) {
          adLink.addEventListener('click', (e) => {
            e.preventDefault();
            trackClick(window.AD_DATA.adId, window.AD_DATA.publisher_url);
            setTimeout(() => {
              window.open(window.AD_DATA.targetUrl, '_blank');
            }, 100);
          });
        } else {
          console.warn('[Widget] .ad-container not found — click listener not attached');
        }
      } else {
        console.warn('[Widget] AD_DATA not found after script execution');
      }
    }, 50);
  }

  load_ad();

})();