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

// Push Notification dengan dynamic content
self.addEventListener("push", (event) => {
  console.log("[Service Worker] Push received");

  let notificationData = {
    title: "Story Map - New Story",
    body: "Someone just shared a new story!",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-96x96.png",
    data: {
      url: "/",
      storyId: null,
    },
    actions: [
      {
        action: "view",
        title: "Lihat Story",
        icon: "/icons/icon-96x96.png",
      },
      {
        action: "close",
        title: "Tutup",
      },
    ],
    vibrate: [200, 100, 200],
    tag: "story-notification",
    requireInteraction: false,
  };

  if (event.data) {
    try {
      const dataJson = event.data.json();
      console.log("[Service Worker] Push data:", dataJson);

      notificationData = {
        title: dataJson.title || "Story Map - New Story",
        body: dataJson.body || dataJson.message || "Check out this new story!",
        icon: dataJson.icon || "/icons/icon-192x192.png",
        badge: dataJson.badge || "/icons/icon-96x96.png",
        image: dataJson.image || null,
        data: {
          url: dataJson.url || "/",
          storyId: dataJson.storyId || null,
        },
        actions: [
          {
            action: "view",
            title: "Lihat Story",
            icon: "/icons/icon-96x96.png",
          },
          {
            action: "close",
            title: "Tutup",
          },
        ],
        vibrate: [200, 100, 200],
        tag: "story-notification",
        requireInteraction: false,
      };
    } catch (error) {
      console.error("[Service Worker] Error parsing push data:", error);
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      image: notificationData.image,
      data: notificationData.data,
      actions: notificationData.actions,
      vibrate: notificationData.vibrate,
      tag: notificationData.tag,
      requireInteraction: notificationData.requireInteraction,
    })
  );
});

// Notification Click dengan navigasi ke detail
self.addEventListener("notificationclick", (event) => {
  console.log("[Service Worker] Notification clicked:", event);

  event.notification.close();

  if (event.action === "close") {
    return;
  }

  const urlToOpen = event.notification.data.url || "/";
  const storyId = event.notification.data.storyId;

  const promiseChain = clients
    .matchAll({
      type: "window",
      includeUncontrolled: true,
    })
    .then((windowClients) => {
      // Check if window already open
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(self.location.origin) && "focus" in client) {
          return client.focus().then((client) => {
            // Navigate to story detail if storyId exists
            if (storyId) {
              return client.navigate(`/#/detail/${storyId}`);
            }
            return client.navigate(urlToOpen);
          });
        }
      }

      // Open new window
      const fullUrl = storyId
        ? `${self.location.origin}/#/detail/${storyId}`
        : `${self.location.origin}${urlToOpen}`;

      return clients.openWindow(fullUrl);
    });

  event.waitUntil(promiseChain);
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
