// Centralized Ad Management & Monetization Tracker

const AdsManager = {
  settings: null,

  async init() {
    try {
      const res = await fetch('/api/settings');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.success && data.settings) {
        this.settings = data.settings;
        this.renderBanners();
        this.injectCustomScript();
        return;
      }
    } catch (err) {
      console.warn('API settings failed, falling back to static data/settings.json...', err);
      try {
        const localSettings = localStorage.getItem('cinestream_settings');
        if (localSettings) {
          this.settings = JSON.parse(localSettings);
          this.renderBanners();
          this.injectCustomScript();
          return;
        }
        const fallbackRes = await fetch('data/settings.json');
        const fallbackSettings = await fallbackRes.json();
        if (fallbackSettings && fallbackSettings.monetization) {
          this.settings = fallbackSettings;
          this.renderBanners();
          this.injectCustomScript();
        }
      } catch (e2) {
        console.error('Failed static settings fallback:', e2);
      }
    }
  },

  // Helper to insert HTML and ensure all <script> tags execute properly
  renderHtmlWithScripts(container, htmlContent) {
    if (!container || !htmlContent) return;
    container.innerHTML = htmlContent;
    const scripts = container.querySelectorAll('script');
    scripts.forEach(oldScript => {
      const newScript = document.createElement('script');
      Array.from(oldScript.attributes).forEach(attr => {
        newScript.setAttribute(attr.name, attr.value);
      });
      if (oldScript.innerHTML) {
        newScript.text = oldScript.innerHTML;
      }
      oldScript.parentNode.replaceChild(newScript, oldScript);
    });
  },

  renderBanners() {
    if (!this.settings || !this.settings.monetization) return;
    const { bannerTop, bannerSidebar, bannerPlayerBottom } = this.settings.monetization;

    // 1. Top Banner
    const topContainer = document.getElementById('top-ad-slot');
    if (topContainer) {
      if (bannerTop && bannerTop.enabled && bannerTop.html) {
        this.renderHtmlWithScripts(topContainer, bannerTop.html);
        topContainer.style.display = 'flex';
        this.trackImpression();
        this.bindClickTracking(topContainer);
      } else {
        topContainer.style.display = 'none';
      }
    }

    // 2. Sidebar Ad
    const sidebarContainer = document.getElementById('sidebar-ad-slot');
    if (sidebarContainer) {
      if (bannerSidebar && bannerSidebar.enabled && bannerSidebar.html) {
        this.renderHtmlWithScripts(sidebarContainer, bannerSidebar.html);
        sidebarContainer.style.display = 'block';
        this.bindClickTracking(sidebarContainer);
      } else {
        sidebarContainer.style.display = 'none';
      }
    }

    // 3. Player Bottom Ad
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

  injectCustomScript() {
    if (this.settings && this.settings.monetization && this.settings.monetization.customScript) {
      const rawCode = this.settings.monetization.customScript.trim();
      if (!rawCode) return;

      try {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = rawCode;

        // Re-create all script elements so the browser actually executes them
        const scripts = tempDiv.querySelectorAll('script');
        if (scripts.length > 0) {
          scripts.forEach(oldScript => {
            const newScript = document.createElement('script');
            Array.from(oldScript.attributes).forEach(attr => {
              newScript.setAttribute(attr.name, attr.value);
            });
            if (oldScript.innerHTML) {
              newScript.text = oldScript.innerHTML;
            }
            document.head.appendChild(newScript);
            oldScript.remove();
          });
        }

        // If there is HTML remaining (e.g. ad container div/banner), append to body
        if (tempDiv.innerHTML.trim()) {
          const container = document.createElement('div');
          container.className = 'custom-network-ad-container';
          container.innerHTML = tempDiv.innerHTML;
          document.body.appendChild(container);
        }
      } catch (e) {
        console.error('Error executing custom ad script:', e);
      }
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
