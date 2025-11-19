const CACHE_NAME = "story-map-v1";
const DATA_CACHE_NAME = "story-map-data-v1";

// ✅ FIX: Update URLs for production
const urlsToCache = [
  "/",
  "/index.html",
  "/app.bundle.js",
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  // Leaflet external resources (cached separately)
];

// Install Service Worker
self.addEventListener("install", (event) => {
  console.log("[Service Worker] Installing...");

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[Service Worker] Caching app shell");
      // ✅ Cache dengan error handling
      return cache.addAll(urlsToCache).catch((error) => {
        console.error("[Service Worker] Cache failed for:", error);
        // Don't fail install if some resources are missing
        return Promise.resolve();
      });
    })
  );

  self.skipWaiting();
});

// Activate Service Worker
self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Activating...");

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== DATA_CACHE_NAME) {
            console.log("[Service Worker] Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );

  self.clients.claim();
});

// Fetch Event - Network First for API, Cache First for static
self.addEventListener("fetch", (event) => {
  // ✅ Skip chrome-extension and non-http requests
  if (
    event.request.url.startsWith("chrome-extension://") ||
    !event.request.url.startsWith("http")
  ) {
    return;
  }

  const requestUrl = new URL(event.request.url);

  // API requests - Network First
  if (requestUrl.origin === "https://story-api.dicoding.dev") {
    event.respondWith(
      caches.open(DATA_CACHE_NAME).then((cache) => {
        return fetch(event.request)
          .then((response) => {
            // Cache successful API responses
            if (response.status === 200) {
              cache.put(event.request, response.clone());
            }
            return response;
          })
          .catch(() => {
            // Return cached data if offline
            return cache.match(event.request);
          });
      })
    );
    return;
  }

  // Leaflet tiles - Cache with expiration
  if (
    requestUrl.hostname.includes("tile.openstreetmap.org") ||
    requestUrl.hostname.includes("tile.opentopomap.org")
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((response) => {
          return (
            response ||
            fetch(event.request).then((networkResponse) => {
              cache.put(event.request, networkResponse.clone());
              return networkResponse;
            })
          );
        });
      })
    );
    return;
  }

  // Static assets - Cache First
  event.respondWith(
    caches.match(event.request).then((response) => {
      return (
        response ||
        fetch(event.request).catch(() => {
          // Return offline page for navigation requests
          if (event.request.mode === "navigate") {
            return caches.match("/index.html");
          }
        })
      );
    })
  );
});

// Background Sync
self.addEventListener("sync", (event) => {
  console.log("[Service Worker] Sync event:", event.tag);

  if (event.tag === "sync-stories") {
    event.waitUntil(syncStories());
  }
});

// Push Notification
self.addEventListener("push", (event) => {
  console.log("[Service Worker] Push received:", event);

  const options = {
    body: event.data
      ? event.data.text()
      : "Ada story baru! Klik untuk melihat.",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-96x96.png",
    vibrate: [200, 100, 200],
    data: {
      url: "/#/home",
    },
    actions: [
      {
        action: "open",
        title: "Lihat Story",
      },
      {
        action: "close",
        title: "Tutup",
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification("Story Map - Story Baru!", options)
  );
});

// Notification Click
self.addEventListener("notificationclick", (event) => {
  console.log("[Service Worker] Notification clicked:", event);

  event.notification.close();

  if (event.action === "open") {
    event.waitUntil(
      clients.openWindow(event.notification.data.url || "/#/home")
    );
  }
});

// Background Sync Helper
async function syncStories() {
  try {
    const db = await openDB();
    const tx = db.transaction("pending-stories", "readonly");
    const store = tx.objectStore("pending-stories");
    const pendingStories = await store.getAll();

    console.log("[Service Worker] Syncing stories:", pendingStories.length);

    for (const story of pendingStories) {
      try {
        const formData = new FormData();
        formData.append("description", story.description);
        formData.append("photo", story.photo);
        if (story.lat) formData.append("lat", story.lat);
        if (story.lon) formData.append("lon", story.lon);

        const response = await fetch(
          "https://story-api.dicoding.dev/v1/stories",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${story.token}`,
            },
            body: formData,
          }
        );

        if (response.ok) {
          const deleteTx = db.transaction("pending-stories", "readwrite");
          const deleteStore = deleteTx.objectStore("pending-stories");
          await deleteStore.delete(story.id);
          console.log("[Service Worker] Story synced:", story.id);
        }
      } catch (error) {
        console.error("[Service Worker] Error syncing story:", error);
      }
    }
  } catch (error) {
    console.error("[Service Worker] Error in syncStories:", error);
  }
}

// IndexedDB Helper
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("story-map-db", 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains("stories")) {
        db.createObjectStore("stories", { keyPath: "id" });
      }

      if (!db.objectStoreNames.contains("pending-stories")) {
        db.createObjectStore("pending-stories", {
          keyPath: "id",
          autoIncrement: true,
        });
      }

      if (!db.objectStoreNames.contains("favorites")) {
        db.createObjectStore("favorites", { keyPath: "id" });
      }
    };
  });
}
