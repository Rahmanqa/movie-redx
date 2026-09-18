// MOVIE REDX - Centralized Ad Management & Adsterra Monetization Engine

const AdsManager = {
  settings: null,

  async init() {
    try {
      const res = await fetch('/api/settings');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.success && data.settings) {
        this.settings = data.settings;
        this.applyAdsterraAndBanners();
        return;
      }
    } catch (err) {
      console.warn('API settings failed, falling back to static data/settings.json...', err);
      try {
        const localSettings = localStorage.getItem('cinestream_settings');
        if (localSettings) {
          this.settings = JSON.parse(localSettings);
          this.applyAdsterraAndBanners();
          return;
        }
        const fallbackRes = await fetch('data/settings.json');
        const fallbackSettings = await fallbackRes.json();
        if (fallbackSettings && fallbackSettings.monetization) {
          this.settings = fallbackSettings;
          this.applyAdsterraAndBanners();
        }
      } catch (e2) {
        console.error('Failed static settings fallback:', e2);
      }
    }
  },

  applyAdsterraAndBanners() {
    if (!this.settings || !this.settings.monetization) return;
    this.renderBanners();
    this.injectAdsterraModules();
    this.injectCustomScript();
  },

  // Helper to execute HTML and sequential <script> tags (Adsterra atOptions + invoke.js)
  renderHtmlWithScripts(container, htmlContent) {
    if (!container || !htmlContent) return;
    container.innerHTML = htmlContent;

    const scripts = Array.from(container.querySelectorAll('script'));
    if (scripts.length === 0) return;

    // Execute scripts sequentially
    scripts.forEach(oldScript => {
      const newScript = document.createElement('script');
      newScript.type = oldScript.type || 'text/javascript';

      Array.from(oldScript.attributes).forEach(attr => {
        if (attr.name !== 'type') {
          newScript.setAttribute(attr.name, attr.value);
        }
      });

      if (oldScript.src) {
        newScript.src = oldScript.src;
      } else {
        newScript.text = oldScript.innerHTML;
      }

      oldScript.parentNode.replaceChild(newScript, oldScript);
    });
  },

  renderBanners() {
    if (!this.settings || !this.settings.monetization) return;
    const { bannerTop, bannerSidebar, bannerPlayerBottom, adsterra } = this.settings.monetization;

    // 1. Top Banner (728x90 Leaderboard / Adsterra Banner)
    const topContainer = document.getElementById('top-ad-slot');
    if (topContainer) {
      if (adsterra && adsterra.leaderboardCode) {
        this.renderHtmlWithScripts(topContainer, adsterra.leaderboardCode);
        topContainer.style.display = 'flex';
        this.trackImpression();
      } else if (bannerTop && bannerTop.enabled && bannerTop.html) {
        this.renderHtmlWithScripts(topContainer, bannerTop.html);
        topContainer.style.display = 'flex';
        this.trackImpression();
        this.bindClickTracking(topContainer);
      } else {
        topContainer.style.display = 'none';
      }
    }

    // 2. Sidebar Ad (300x250 Rectangle / Adsterra Zone)
    const sidebarContainer = document.getElementById('sidebar-ad-slot');
    if (sidebarContainer) {
      if (adsterra && adsterra.sidebarCode) {
        this.renderHtmlWithScripts(sidebarContainer, adsterra.sidebarCode);
        sidebarContainer.style.display = 'block';
        this.trackImpression();
      } else if (bannerSidebar && bannerSidebar.enabled && bannerSidebar.html) {
        this.renderHtmlWithScripts(sidebarContainer, bannerSidebar.html);
        sidebarContainer.style.display = 'block';
        this.bindClickTracking(sidebarContainer);
      } else {
        sidebarContainer.style.display = 'none';
      }
    }

    // 3. Player Bottom Banner
    const playerBottomContainer = document.getElementById('player-bottom-ad-slot');
    if (playerBottomContainer) {
      if (bannerPlayerBottom && bannerPlayerBottom.enabled && bannerPlayerBottom.html) {
        this.renderHtmlWithScripts(playerBottomContainer, bannerPlayerBottom.html);
        playerBottomContainer.style.display = 'flex';
        this.bindClickTracking(playerBottomContainer);
      } else {
        playerBottomContainer.style.display = 'none';
      }
    }
  },

  // Inject Adsterra Social Bar & Popunder Scripts
  injectAdsterraModules() {
    const adsterra = this.settings?.monetization?.adsterra;
    if (!adsterra) return;

    // Adsterra Social Bar (High CPM In-Page Push)
    if (adsterra.socialBarScript && adsterra.socialBarScript.trim()) {
      this.injectRawScriptTag(adsterra.socialBarScript.trim());
    }

    // Adsterra Popunder
    if (adsterra.popunderScript && adsterra.popunderScript.trim()) {
      this.injectRawScriptTag(adsterra.popunderScript.trim());
    }
  },

  injectRawScriptTag(rawCode) {
    try {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = rawCode;
      const scripts = tempDiv.querySelectorAll('script');

      scripts.forEach(oldScript => {
        const newScript = document.createElement('script');
        newScript.type = 'text/javascript';
        if (oldScript.src) {
          newScript.src = oldScript.src;
        } else {
          newScript.text = oldScript.innerHTML;
        }
        document.head.appendChild(newScript);
      });
    } catch (e) {
      console.error('Error injecting Adsterra script:', e);
    }
  },

  injectCustomScript() {
    if (this.settings && this.settings.monetization && this.settings.monetization.customScript) {
      const rawCode = this.settings.monetization.customScript.trim();
      if (!rawCode) return;
      this.injectRawScriptTag(rawCode);
    }
  },

  bindClickTracking(container) {
    const links = container.querySelectorAll('a, button');
    links.forEach(el => {
      el.addEventListener('click', () => {
        this.trackClick();
      });
    });
  },

  async trackImpression() {
    try {
      await fetch('/api/impressions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'impression' })
      });
    } catch (e) {
      // Ignore network errors in tracking
    }
  },

  async trackClick() {
    try {
      await fetch('/api/impressions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'click' })
      });
    } catch (e) {
      // Ignore network errors in tracking
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  AdsManager.init();
});
