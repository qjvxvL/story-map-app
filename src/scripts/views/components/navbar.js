import AuthRepository from "../../data/auth-repository.js";
import NotificationHelper from "../../utils/notification-helper.js";

class Navbar {
  static render() {
    const isLoggedIn = AuthRepository.isLoggedIn();
    const username = AuthRepository.getUsername();

    console.log("🔍 Navbar render:", { isLoggedIn, username });

    if (!isLoggedIn) {
      return `
        <nav class="navbar" role="navigation" aria-label="Main navigation">
          <div class="navbar-container">
            <a href="#/home" class="navbar-brand">
              <span class="brand-icon">📖</span>
              <span class="brand-text">Story Map</span>
            </a>
            
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
          </div>
        </nav>
      `;
    }

    return `
      <nav class="navbar" role="navigation" aria-label="Main navigation">
        <div class="navbar-container">
          <a href="#/home" class="navbar-brand">
            <span class="brand-icon">📖</span>
            <span class="brand-text">Story Map</span>
          </a>
          
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
            
            <div class="nav-settings">
              <button 
                id="notification-btn" 
                class="notification-btn" 
                aria-label="Toggle notifications"
                title="Aktifkan/Nonaktifkan Notifikasi"
              >
                <span class="notification-icon">🔔</span>
                <span class="notification-status" id="notification-status">Off</span>
              </button>
            </div>
            
            <div class="navbar-user">
              <span class="username">👤 ${username || "User"}</span>
              <button id="logout-btn" class="btn-logout" aria-label="Logout">
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
    `;
  }

  static afterRender() {
    this._setupLogout();
    this._updateNotificationStatus();
    this._setupNotificationToggle();
  }

  static _setupLogout() {
    const logoutBtn = document.querySelector("#logout-btn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        if (confirm("Apakah Anda yakin ingin logout?")) {
          AuthRepository.logout();
          window.location.hash = "#/login";
          window.location.reload();
        }
      });
    }
  }

  static async _updateNotificationStatus() {
    const statusEl = document.querySelector("#notification-status");
    const notificationBtn = document.querySelector("#notification-btn");

    if (!statusEl || !notificationBtn) return;

    try {
      const isSubscribed = await NotificationHelper.isSubscribed();
      statusEl.textContent = isSubscribed ? "On" : "Off";

      if (isSubscribed) {
        notificationBtn.classList.add("active");
      } else {
        notificationBtn.classList.remove("active");
      }

      console.log(
        "✅ Notification status updated:",
        isSubscribed ? "On" : "Off"
      );
    } catch (error) {
      console.error("❌ Error checking notification status:", error);
      statusEl.textContent = "Off";
    }
  }

  static _setupNotificationToggle() {
    const notificationBtn = document.querySelector("#notification-btn");
    if (!notificationBtn) return;

    notificationBtn.addEventListener("click", () => {
      this._toggleNotifications();
    });
  }

  static async _toggleNotifications() {
    const statusEl = document.querySelector("#notification-status");
    const notificationBtn = document.querySelector("#notification-btn");

    if (!statusEl || !notificationBtn) return;

    try {
      notificationBtn.disabled = true;
      statusEl.textContent = "...";

      const isSubscribed = await NotificationHelper.isSubscribed();

      if (isSubscribed) {
        // Unsubscribe
        console.log("🔕 Unsubscribing from notifications...");
        const success =
          await NotificationHelper.unsubscribeFromPushNotifications();

        if (success) {
          statusEl.textContent = "Off";
          notificationBtn.classList.remove("active");
          alert("Notifikasi berhasil dinonaktifkan");
        } else {
          throw new Error("Failed to unsubscribe");
        }
      } else {
        // Subscribe
        console.log("🔔 Subscribing to notifications...");
        const permission = await NotificationHelper.requestPermission();

        if (permission) {
          statusEl.textContent = "On";
          notificationBtn.classList.add("active");
          alert("Notifikasi berhasil diaktifkan!");
        } else {
          alert("Izin notifikasi ditolak. Aktifkan di pengaturan browser.");
          statusEl.textContent = "Off";
        }
      }
    } catch (error) {
      console.error("❌ Error toggling notifications:", error);
      alert("Terjadi kesalahan saat mengubah pengaturan notifikasi");

      // Reset to current state
      const isSubscribed = await NotificationHelper.isSubscribed();
      statusEl.textContent = isSubscribed ? "On" : "Off";
    } finally {
      notificationBtn.disabled = false;
    }
  }
}

export default Navbar;
