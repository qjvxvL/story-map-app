// CSS imports
import "../styles/style.css";
import "../styles/responsive.css";
import "../styles/transitions.css";

import App from "./views/app.js";
import DBHelper from "./utils/db-helper.js";
import KeyboardHelper from "./utils/keyboard-helper.js";
import NotificationHelper from "./utils/notification-helper.js";

const app = new App({
  content: document.querySelector("#page-content"),
});

// Initialize IndexedDB
DBHelper.openDB().catch((error) => {
  console.error("Failed to open IndexedDB:", error);
});

// Enable keyboard navigation
KeyboardHelper.enableKeyboardNavigation();

// Initialize Service Worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register(
        "/service-worker.js",
        {
          scope: "/",
        }
      );
      console.log("Service Worker registered:", registration.scope);

      // Initialize push notifications if already granted
      await NotificationHelper.init();

      // Listen for service worker updates
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        console.log("New service worker found");

        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "activated") {
            console.log("New service worker activated");
            // Optionally show update notification
            if (
              confirm("Update tersedia! Refresh halaman untuk update aplikasi?")
            ) {
              window.location.reload();
            }
          }
        });
      });
    } catch (error) {
      console.error("Service Worker registration failed:", error);
    }
  });
}

// Handle online/offline events
window.addEventListener("online", async () => {
  console.log("Back online!");

  // Sync pending stories
  if ("serviceWorker" in navigator && "SyncManager" in window) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register("sync-stories");
      console.log("Sync registered after coming online");
    } catch (error) {
      console.error("Error registering sync:", error);
    }
  }

  // Show notification
  if (Notification.permission === "granted") {
    new Notification("Kembali Online!", {
      body: "Koneksi internet telah tersambung kembali",
      icon: "/icons/icon-192x192.png",
    });
  }
});

window.addEventListener("offline", () => {
  console.log("Gone offline!");

  // Show notification
  if (Notification.permission === "granted") {
    new Notification("Offline Mode", {
      body: "Anda sedang offline. Fitur terbatas tersedia.",
      icon: "/icons/icon-192x192.png",
    });
  }
});

// Handle hash change
window.addEventListener("hashchange", () => {
  console.log("Hash changed to:", window.location.hash);
  app.renderPage();
});

// Handle initial load
window.addEventListener("DOMContentLoaded", () => {
  console.log("DOM Content Loaded");
  app.renderPage();
});

// Handle before install prompt (PWA install)
let deferredPrompt;

window.addEventListener("beforeinstallprompt", (e) => {
  console.log("Before install prompt fired");
  e.preventDefault();
  deferredPrompt = e;

  // Show install button/banner
  showInstallPromotion();
});

window.addEventListener("appinstalled", () => {
  console.log("PWA was installed");
  deferredPrompt = null;

  // Hide install promotion
  hideInstallPromotion();

  // Show thank you message
  if (Notification.permission === "granted") {
    new Notification("Terima Kasih!", {
      body: "Story Map telah terinstall di perangkat Anda",
      icon: "/icons/icon-192x192.png",
    });
  }
});

function showInstallPromotion() {
  // You can create a custom install banner here
  console.log("Show install promotion");

  // Example: Create simple install banner
  const banner = document.createElement("div");
  banner.id = "install-banner";
  banner.className = "install-banner";
  banner.innerHTML = `
    <div class="install-banner-content">
      <p>📱 Install Story Map untuk pengalaman yang lebih baik!</p>
      <button id="install-btn" class="btn btn-primary">Install</button>
      <button id="dismiss-btn" class="btn btn-secondary">Nanti</button>
    </div>
  `;

  document.body.appendChild(banner);

  // Handle install button
  document
    .querySelector("#install-btn")
    ?.addEventListener("click", async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to install prompt: ${outcome}`);
        deferredPrompt = null;
        hideInstallPromotion();
      }
    });

  // Handle dismiss button
  document.querySelector("#dismiss-btn")?.addEventListener("click", () => {
    hideInstallPromotion();
  });
}

function hideInstallPromotion() {
  const banner = document.querySelector("#install-banner");
  if (banner) {
    banner.remove();
  }
}
