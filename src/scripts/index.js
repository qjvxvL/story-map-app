// CSS imports
import "../styles/style.css";
import "../styles/responsive.css";
import "../styles/transitions.css";
import App from "./routes/routes.js";
import DBHelper from "./utils/db-helper.js";

const app = new App({
  content: document.querySelector("#page-content"),
  navbar: document.querySelector("#navbar"),
});

// Initialize IndexedDB
DBHelper.openDB();

// Register Service Worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      console.log("Service Worker registered:", registration);
    } catch (error) {
      console.error("Service Worker registration failed:", error);
    }
  });
}

// PWA Install Prompt
let deferredPrompt;

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;

  // Show install prompt
  const installPrompt = document.querySelector("#install-prompt");
  const installButton = document.querySelector("#install-button");
  const dismissButton = document.querySelector("#dismiss-button");

  if (installPrompt) {
    installPrompt.classList.remove("hidden");

    installButton.addEventListener("click", async () => {
      installPrompt.classList.add("hidden");
      deferredPrompt.prompt();

      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to install prompt: ${outcome}`);
      deferredPrompt = null;
    });

    dismissButton.addEventListener("click", () => {
      installPrompt.classList.add("hidden");
    });
  }
});

window.addEventListener("appinstalled", () => {
  console.log("PWA installed successfully");
  deferredPrompt = null;
});

// Handle online/offline events
window.addEventListener("online", () => {
  console.log("Back online");

  // Trigger background sync if available
  if ("serviceWorker" in navigator && "sync" in self.registration) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.sync.register("sync-stories");
    });
  }
});

window.addEventListener("offline", () => {
  console.log("Gone offline");
  alert("Anda sedang offline. Beberapa fitur mungkin tidak tersedia.");
});

// Route handling
window.addEventListener("hashchange", () => {
  app.renderPage();
});

window.addEventListener("load", () => {
  app.renderPage();
});

window.addEventListener("DOMContentLoaded", () => {
  if (!document.startViewTransition) {
    console.log("View Transitions API not supported");
  }
});
