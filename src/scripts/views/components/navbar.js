import AuthRepository from "../../data/auth-repository.js";
import PushNotificationHelper from "../../utils/push-notification-helper.js";

class Navbar {
  static render() {
    const isLoggedIn = AuthRepository.isLoggedIn();

    if (!isLoggedIn) {
      return "";
    }

    const user = AuthRepository.getUser();
    const currentHash = window.location.hash;

    return `
      <div class="navbar-container">
        <div class="navbar-brand">
          <h1>📍 Story Map</h1>
        </div>

        <button class="navbar-toggle" id="navbar-toggle" aria-label="Toggle navigation">
          <span></span>
          <span></span>
          <span></span>
        </button>

        <ul class="navbar-menu" id="navbar-menu">
          <li>
            <a href="#/home" class="nav-link ${
              currentHash === "#/home" || currentHash === "" ? "active" : ""
            }">
              Beranda
            </a>
          </li>
          <li>
            <a href="#/add-story" class="nav-link ${
              currentHash === "#/add-story" ? "active" : ""
            }">
              Tambah Cerita
            </a>
          </li>
          <li>
            <a href="#/favorites" class="nav-link ${
              currentHash === "#/favorites" ? "active" : ""
            }">
              Favorit
            </a>
          </li>
          <li>
            <button id="notification-toggle" class="nav-link" style="border: none; background: transparent; cursor: pointer;">
              ${
                PushNotificationHelper.isSubscribed()
                  ? "🔔 Notifikasi Aktif"
                  : "🔕 Aktifkan Notifikasi"
              }
            </button>
          </li>
          <li>
            <span class="user-info">👤 ${user.name}</span>
          </li>
          <li>
            <button class="btn-logout" id="logout-btn">Logout</button>
          </li>
        </ul>
      </div>
    `;
  }

  static afterRender() {
    const logoutBtn = document.querySelector("#logout-btn");
    const navbarToggle = document.querySelector("#navbar-toggle");
    const navbarMenu = document.querySelector("#navbar-menu");
    const notificationToggle = document.querySelector("#notification-toggle");

    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        this._handleLogout();
      });
    }

    if (navbarToggle && navbarMenu) {
      navbarToggle.addEventListener("click", () => {
        navbarMenu.classList.toggle("active");
      });
    }

    if (notificationToggle) {
      notificationToggle.addEventListener("click", async () => {
        await this._handleNotificationToggle();
      });
    }
  }

  static _handleLogout() {
    if (confirm("Apakah Anda yakin ingin logout?")) {
      AuthRepository.clearAuth();
      window.location.hash = "#/login";
      window.location.reload();
    }
  }

  static async _handleNotificationToggle() {
    const token = AuthRepository.getToken();
    const isSubscribed = PushNotificationHelper.isSubscribed();

    if (isSubscribed) {
      // Unsubscribe
      const success = await PushNotificationHelper.unsubscribe(token);
      if (success) {
        alert("Notifikasi dinonaktifkan");
        window.location.reload();
      }
    } else {
      // Subscribe
      const permissionGranted =
        await PushNotificationHelper.requestPermission();

      if (permissionGranted) {
        const success = await PushNotificationHelper.subscribe(token);
        if (success) {
          alert(
            "Notifikasi diaktifkan! Anda akan menerima notifikasi saat ada cerita baru."
          );
          window.location.reload();
        }
      } else {
        alert("Izin notifikasi ditolak. Aktifkan melalui pengaturan browser.");
      }
    }
  }
}

export default Navbar;
