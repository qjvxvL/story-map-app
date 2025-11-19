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

// ✅ CRITICAL FIX: Register service worker dengan path yang benar
if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      // ✅ Path harus /sw.js (di root, bukan /service-worker.js)
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });

      console.log("✅ Service Worker registered:", registration.scope);

      // Initialize push notifications if already granted
      if (Notification.permission === "granted") {
        await NotificationHelper.subscribeToPushNotifications();
      }

      // Listen for service worker updates
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        console.log("🔄 New service worker found");

        newWorker.addEventListener("statechange", () => {
          if (
            newWorker.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            console.log("📦 New content available! Refresh to update.");

            if (confirm("Update tersedia! Refresh halaman untuk update?")) {
              window.location.reload();
            }
          }
        });
      });
    } catch (error) {
      console.error("❌ Service Worker registration failed:", error);
    }
  });
}

// Online/Offline Detection
window.addEventListener("online", () => {
  console.log("Back online!");

  // Show notification
  if (Notification.permission === "granted") {
    new Notification("Online Mode", {
      body: "Koneksi internet kembali. Sinkronisasi data...",
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

// ✅ PWA Install Prompt
let deferredPrompt;

window.addEventListener("beforeinstallprompt", (e) => {
  console.log("📱 Before install prompt fired");
  e.preventDefault();
  deferredPrompt = e;

  // Show install button/banner
  showInstallPromotion();
});

window.addEventListener("appinstalled", () => {
  console.log("✅ PWA installed successfully");
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
  // Create install banner
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

// Initialize app
app.initializeApp();
