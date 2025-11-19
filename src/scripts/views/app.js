import routes from "../routes/routes.js";
import Navbar from "./components/navbar.js";
import AuthRepository from "../data/auth-repository.js";
import NotificationHelper from "../utils/notification-helper.js";
import UrlParser from "../routes/url-parser.js";

class App {
  constructor({ content }) {
    this._content = content;
  }

  async renderPage() {
    const url = UrlParser.parseActiveUrlWithCombiner();
    const route = routes[url];

    console.log("🔍 Rendering page:", {
      url,
      hasRoute: !!route,
      hasPage: !!route?.page,
      hasPresenter: !!route?.presenter,
    });

    // Render navbar first
    this._renderNavbar();

    // If route not found, redirect to login or home
    if (!route) {
      const isLoggedIn = AuthRepository.isLoggedIn();
      console.log("Route not found, redirecting...");
      window.location.hash = isLoggedIn ? "#/home" : "#/login";
      return;
    }

    // Check authentication
    const isLoggedIn = AuthRepository.isLoggedIn();
    const publicPages = ["/", "/login", "/register"];

    console.log("Auth check:", {
      isLoggedIn,
      url,
      isPublic: publicPages.includes(url),
    });

    if (!isLoggedIn && !publicPages.includes(url)) {
      console.log("Not logged in, redirect to login");
      window.location.hash = "#/login";
      return;
    }

    if (isLoggedIn && publicPages.includes(url)) {
      console.log("Already logged in, redirect to home");
      window.location.hash = "#/home";
      return;
    }

    // Render page with View Transition API
    if (!document.startViewTransition) {
      await this._renderPageContent(route);
      return;
    }

    document.startViewTransition(async () => {
      await this._renderPageContent(route);
    });
  }

  async _renderPageContent(route) {
    // ✅ CRITICAL FIX: Access properties directly, don't destructure
    const page = route.page;
    const PresenterClass = route.presenter;
    const needsStoryId = route.needsStoryId;

    // ✅ DEBUG: Log untuk verify flag
    console.log("📦 Route config:", {
      hasPage: !!page,
      hasPresenter: !!PresenterClass,
      needsStoryId: needsStoryId, // Should be true for detail page
      routeKeys: Object.keys(route),
    });

    const pageContent = document.querySelector("#page-content");
    if (pageContent && page) {
      try {
        // Clear previous content
        pageContent.innerHTML = "";

        console.log("🎨 Rendering page HTML...");

        // Render new page
        const content = await page.render();
        pageContent.innerHTML = content;

        console.log("✅ Page HTML rendered");

        // Call afterRender if exists
        if (typeof page.afterRender === "function") {
          await page.afterRender();
        }

        // Initialize presenter
        if (PresenterClass) {
          console.log("🎯 Initializing presenter:", PresenterClass.name);

          // ✅ FIX: Check flag dengan explicit comparison
          let presenter;
          if (needsStoryId === true) {
            console.log("🔍 This route needs story ID, parsing URL...");

            // ✅ Parse hash manually
            const hash = window.location.hash.slice(1); // Remove #
            console.log("  - Full hash:", hash);

            const parts = hash.split("/");
            console.log("  - URL parts array:", parts);

            // parts[0] = '' (empty before first /)
            // parts[1] = 'detail' (resource)
            // parts[2] = 'story-ABC123...' (id)
            const storyId = parts[2];

            console.log("  - Extracted story ID from parts[2]:", storyId);
            console.log("  - Story ID type:", typeof storyId);
            console.log("  - Story ID length:", storyId?.length);
            console.log("  - Story ID is truthy:", !!storyId);

            if (!storyId || storyId === "undefined" || storyId === "") {
              console.error("❌ Story ID is invalid!");
              console.error("❌ Hash:", hash);
              console.error("❌ Parts:", parts);
              throw new Error("Story ID is required for detail page");
            }

            console.log("✅ Creating presenter with story ID:", storyId);
            presenter = new PresenterClass(storyId);
          } else {
            // Other presenters don't need storyId
            console.log("✅ Creating presenter without story ID");
            presenter = new PresenterClass();
          }

          await presenter.init();
          console.log("✅ Presenter initialized successfully");
        }

        // Scroll to top
        window.scrollTo(0, 0);
      } catch (error) {
        console.error("❌ Error rendering page:", error);
        console.error("❌ Error message:", error.message);
        console.error("❌ Error stack:", error.stack);

        pageContent.innerHTML = `
          <div class="error-container" style="
            padding: 2rem;
            text-align: center;
            max-width: 600px;
            margin: 2rem auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          ">
            <h2 style="color: #dc3545; margin-bottom: 1rem;">Error Loading Page</h2>
            <p style="color: #6c757d; margin-bottom: 1rem;">${error.message}</p>
            <details style="text-align: left; margin: 1rem 0;">
              <summary style="cursor: pointer; color: #007bff;">Show Details</summary>
              <pre style="background: #f5f5f5; padding: 1rem; border-radius: 8px; font-size: 0.85rem; overflow-x: auto; margin-top: 0.5rem;">${error.stack}</pre>
            </details>
            <p style="color: #999; font-size: 0.85rem;">
              Current URL: <code style="background: #f5f5f5; padding: 0.25rem 0.5rem; border-radius: 4px;">${window.location.hash}</code>
            </p>
            <a href="#/home" class="btn btn-primary" style="
              display: inline-block;
              padding: 0.75rem 1.5rem;
              background: #007bff;
              color: white;
              text-decoration: none;
              border-radius: 8px;
              font-weight: 600;
              margin-top: 1rem;
            ">Back to Home</a>
          </div>
        `;
      }
    }
  }

  _renderNavbar() {
    const navbar = document.querySelector("#navbar");
    if (navbar) {
      navbar.innerHTML = Navbar.render();
      Navbar.afterRender();
    }
  }

  async initializeApp() {
    console.log("🚀 Initializing app...");

    // Initialize notification helper
    await NotificationHelper.init();

    // Register service worker
    await this._registerServiceWorker();

    // Setup install prompt
    this._setupInstallPrompt();

    // Setup hash change listener
    window.addEventListener("hashchange", () => {
      console.log("Hash changed to:", window.location.hash);
      this.renderPage();
    });

    // Initial render
    await this.renderPage();

    console.log("✅ App initialized");
  }

  async _registerServiceWorker() {
    if (!("serviceWorker" in navigator)) {
      console.warn("Service Worker not supported");
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });
      console.log("✅ Service Worker registered:", registration);

      // Listen for updates
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        console.log("🔄 Service Worker update found");

        newWorker.addEventListener("statechange", () => {
          if (
            newWorker.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            console.log("📦 New Service Worker available");
            // Optionally show update notification
            if (
              confirm(
                "Update tersedia! Refresh halaman untuk menggunakan versi terbaru?"
              )
            ) {
              window.location.reload();
            }
          }
        });
      });
    } catch (error) {
      console.error("❌ Service Worker registration failed:", error);
    }
  }

  _setupInstallPrompt() {
    let deferredPrompt;

    window.addEventListener("beforeinstallprompt", (e) => {
      console.log("💾 Install prompt available");
      e.preventDefault();
      deferredPrompt = e;

      // Show custom install UI
      const installPrompt = document.querySelector("#install-prompt");
      const installButton = document.querySelector("#install-button");
      const dismissButton = document.querySelector("#dismiss-button");

      if (installPrompt) {
        installPrompt.classList.remove("hidden");

        if (installButton) {
          installButton.addEventListener("click", async () => {
            if (deferredPrompt) {
              deferredPrompt.prompt();
              const { outcome } = await deferredPrompt.userChoice;
              console.log("Install prompt outcome:", outcome);
              installPrompt.classList.add("hidden");
              deferredPrompt = null;
            }
          });
        }

        if (dismissButton) {
          dismissButton.addEventListener("click", () => {
            installPrompt.classList.add("hidden");
          });
        }
      }
    });

    window.addEventListener("appinstalled", () => {
      console.log("✅ PWA installed successfully");
      deferredPrompt = null;
    });
  }
}

export default App;
