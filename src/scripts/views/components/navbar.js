import AuthRepository from "../../data/auth-repository.js";
import PushNotificationHelper from "../../utils/push-notification-helper.js";

class Navbar {
  static render() {
    const isLoggedIn = AuthRepository.isLoggedIn();

    return `
      <nav class="navbar" role="navigation" aria-label="Main navigation">
        <div class="navbar-container">
          <a href="#/home" class="navbar-brand">
            <span class="brand-icon">📖</span>
            <span class="brand-text">Story Map</span>
          </a>
          
          ${
            isLoggedIn
              ? `
            <div class="navbar-menu">
              <a href="#/home" class="nav-link" aria-label="Home">
                <span class="nav-icon">🏠</span>
                <span class="nav-text">Home</span>
              </a>
              <a href="#/add" class="nav-link" aria-label="Add Story">
                <span class="nav-icon">➕</span>
                <span class="nav-text">Add Story</span>
              </a>
              <a href="#/favorites" class="nav-link" aria-label="Favorites">
                <span class="nav-icon">⭐</span>
                <span class="nav-text">Favorites</span>
              </a>
              
              <!-- Notification Toggle -->
              <div class="nav-settings">
                <button 
                  id="notification-toggle" 
                  class="notification-btn ${
                    PushNotificationHelper.isSubscribed() ? "active" : ""
                  }" 
                  aria-label="Toggle push notifications"
                  title="Toggle push notifications">
                  <span class="notification-icon">🔔</span>
                  <span class="notification-status" id="notification-status">
                    ${PushNotificationHelper.isSubscribed() ? "On" : "Off"}
                  </span>
                </button>
              </div>

              <button id="logout-btn" class="logout-btn" aria-label="Logout">
                <span class="logout-icon">🚪</span>
                <span class="logout-text">Logout</span>
              </button>
            </div>
          `
              : `
            <div class="navbar-menu">
              <a href="#/login" class="nav-link" aria-label="Login">
                <span class="nav-icon">🔐</span>
                <span class="nav-text">Login</span>
              </a>
              <a href="#/register" class="nav-link" aria-label="Register">
                <span class="nav-icon">📝</span>
                <span class="nav-text">Register</span>
              </a>
            </div>
          `
          }
        </div>
      </nav>
    `;
  }

  static async afterRender() {
    const logoutBtn = document.querySelector("#logout-btn");
    const notificationToggle = document.querySelector("#notification-toggle");

    // Logout handler
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        AuthRepository.clearAuth();
        window.location.hash = "#/login";
      });
    }

    // Notification toggle handler
    if (notificationToggle) {
      notificationToggle.addEventListener("click", async () => {
        await this._toggleNotifications();
      });
    }

    // Highlight active link
    this._highlightActiveLink();
  }

  static async _toggleNotifications() {
    const statusEl = document.querySelector("#notification-status");
    const notificationBtn = document.querySelector("#notification-toggle");

    if (!statusEl || !notificationBtn) return;

    try {
      notificationBtn.disabled = true;
      statusEl.textContent = "...";

      const isSubscribed = PushNotificationHelper.isSubscribed();
      const token = AuthRepository.getToken();

      if (isSubscribed) {
        // Unsubscribe
        const success = await PushNotificationHelper.unsubscribe(token);
        if (success) {
          statusEl.textContent = "Off";
          notificationBtn.classList.remove("active");
          alert("Notifikasi berhasil dinonaktifkan");
        }
      } else {
        // Subscribe
        const permission = await PushNotificationHelper.requestPermission();
        if (permission === "granted") {
          const success = await PushNotificationHelper.subscribe(token);
          if (success) {
            statusEl.textContent = "On";
            notificationBtn.classList.add("active");
            alert("Notifikasi berhasil diaktifkan!");
          }
        } else {
          alert("Izin notifikasi ditolak. Aktifkan di pengaturan browser.");
          statusEl.textContent = "Off";
        }
      }
    } catch (error) {
      console.error("Error toggling notifications:", error);
      alert("Terjadi kesalahan saat mengubah pengaturan notifikasi");
      statusEl.textContent = PushNotificationHelper.isSubscribed()
        ? "On"
        : "Off";
    } finally {
      notificationBtn.disabled = false;
    }
  }

  static _highlightActiveLink() {
    const currentHash = window.location.hash;
    const navLinks = document.querySelectorAll(".nav-link");

    navLinks.forEach((link) => {
      link.classList.remove("active");
      const href = link.getAttribute("href");

      if (
        (currentHash === "" && href === "#/home") ||
        (currentHash && currentHash.startsWith(href))
      ) {
        link.classList.add("active");
      }
    });
  }
}

export default Navbar;
