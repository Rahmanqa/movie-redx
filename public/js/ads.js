// Centralized Ad Management & Monetization Tracker

const AdsManager = {
  settings: null,

  async init() {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.success && data.settings) {
        this.settings = data.settings;
        this.renderBanners();
        this.injectCustomScript();
      }
    } catch (err) {
      console.warn('Ad manager initialized in offline mode:', err);
    }
  },

  renderBanners() {
    if (!this.settings || !this.settings.monetization) return;
    const { bannerTop, bannerSidebar, bannerPlayerBottom } = this.settings.monetization;

    // 1. Top Banner
    const topContainer = document.getElementById('top-ad-slot');
    if (topContainer) {
      if (bannerTop && bannerTop.enabled && bannerTop.html) {
        topContainer.innerHTML = bannerTop.html;
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
        sidebarContainer.innerHTML = bannerSidebar.html;
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
        playerBottomContainer.innerHTML = bannerPlayerBottom.html;
        playerBottomContainer.style.display = 'flex';
        this.bindClickTracking(playerBottomContainer);
      } else {
        playerBottomContainer.style.display = 'none';
      }
    }
  },

  injectCustomScript() {
    if (this.settings && this.settings.monetization && this.settings.monetization.customScript) {
      const scriptCode = this.settings.monetization.customScript.trim();
      if (scriptCode) {
        try {
          const div = document.createElement('div');
          div.innerHTML = scriptCode;
          document.body.appendChild(div);
        } catch (e) {
          console.error('Error injecting custom ad script:', e);
        }
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
