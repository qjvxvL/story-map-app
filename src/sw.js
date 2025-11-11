const CACHE_NAME = "story-map-v1";
const DATA_CACHE_NAME = "story-map-data-v1";

const urlsToCache = [
  "/",
  "/index.html",
  "/app.bundle.js",
  "/styles.css",
  "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
  "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js",
];

// Install Service Worker
self.addEventListener("install", (event) => {
  console.log("[Service Worker] Installing...");

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[Service Worker] Caching app shell");
      return cache.addAll(urlsToCache);
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
            console.log("[Service Worker] Removing old cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );

  return self.clients.claim();
});

// Fetch Event - Network First for API, Cache First for Static Assets
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API Requests - Network First with Cache Fallback
  if (url.origin === "https://story-api.dicoding.dev") {
    event.respondWith(
      caches.open(DATA_CACHE_NAME).then((cache) => {
        return fetch(request)
          .then((response) => {
            // Save successful GET requests to cache
            if (request.method === "GET" && response.status === 200) {
              cache.put(request, response.clone());
            }
            return response;
          })
          .catch(() => {
            // If network fails, return cached data
            return cache.match(request);
          });
      })
    );
    return;
  }

  // Static Assets - Cache First
  event.respondWith(
    caches.match(request).then((response) => {
      return (
        response ||
        fetch(request).then((fetchResponse) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, fetchResponse.clone());
            return fetchResponse;
          });
        })
      );
    })
  );
});

// Push Notification
self.addEventListener("push", (event) => {
  console.log("[Service Worker] Push received");

  let notificationData = {
    title: "Story Map",
    body: "You have a new notification",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-96x96.png",
    data: {
      url: "/",
    },
  };

  if (event.data) {
    try {
      const dataJson = event.data.json();
      notificationData = {
        title: dataJson.title || notificationData.title,
        body: dataJson.options?.body || notificationData.body,
        icon: dataJson.options?.icon || notificationData.icon,
        badge: dataJson.options?.badge || notificationData.badge,
        data: {
          url: dataJson.options?.data?.url || notificationData.data.url,
        },
      };
    } catch (error) {
      console.error("Error parsing push data:", error);
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      data: notificationData.data,
      actions: [
        {
          action: "view",
          title: "Lihat Detail",
        },
        {
          action: "close",
          title: "Tutup",
        },
      ],
    })
  );
});

// Notification Click
self.addEventListener("notificationclick", (event) => {
  console.log("[Service Worker] Notification clicked");

  event.notification.close();

  if (event.action === "view") {
    event.waitUntil(clients.openWindow(event.notification.data.url || "/"));
  } else if (event.action === "close") {
    // Just close the notification
    return;
  } else {
    // Default action
    event.waitUntil(clients.openWindow(event.notification.data.url || "/"));
  }
});

// Background Sync
self.addEventListener("sync", (event) => {
  console.log("[Service Worker] Background sync:", event.tag);

  if (event.tag === "sync-stories") {
    event.waitUntil(syncStories());
  }
});

async function syncStories() {
  try {
    // Get pending stories from IndexedDB
    const db = await openDB();
    const tx = db.transaction("pending-stories", "readonly");
    const store = tx.objectStore("pending-stories");
    const pendingStories = await store.getAll();

    console.log("[Service Worker] Syncing stories:", pendingStories.length);

    // Send each pending story to API
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
          // Remove from pending stories
          const deleteTx = db.transaction("pending-stories", "readwrite");
          const deleteStore = deleteTx.objectStore("pending-stories");
          await deleteStore.delete(story.id);

          console.log("[Service Worker] Story synced:", story.id);

          // Show success notification
          self.registration.showNotification("Story Synced", {
            body: "Your offline story has been posted successfully!",
            icon: "/icons/icon-192x192.png",
          });
        }
      } catch (error) {
        console.error("[Service Worker] Error syncing story:", error);
      }
    }
  } catch (error) {
    console.error("[Service Worker] Error in syncStories:", error);
  }
}

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
