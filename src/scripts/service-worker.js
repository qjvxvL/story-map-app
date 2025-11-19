const CACHE_NAME = "story-app-v1";
const DYNAMIC_CACHE = "story-app-dynamic-v1";
const API_CACHE = "story-app-api-v1";

const urlsToCache = [
  "/",
  "/index.html",
  "/app.bundle.js",
  "/vendor.bundle.js",
  "/styles.css",
  "/manifest.json",
  "/icons/icon-72x72.png",
  "/icons/icon-96x96.png",
  "/icons/icon-128x128.png",
  "/icons/icon-144x144.png",
  "/icons/icon-152x152.png",
  "/icons/icon-192x192.png",
  "/icons/icon-384x384.png",
  "/icons/icon-512x512.png",
];

// Install event - cache static assets
self.addEventListener("install", (event) => {
  console.log("[Service Worker] Installing...");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[Service Worker] Caching static assets");
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Activating...");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (
            cacheName !== CACHE_NAME &&
            cacheName !== DYNAMIC_CACHE &&
            cacheName !== API_CACHE
          ) {
            console.log("[Service Worker] Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch event - Network First with Cache Fallback for API, Cache First for static
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests with Network First strategy
  if (url.origin === "https://story-api.dicoding.dev") {
    event.respondWith(
      caches.open(API_CACHE).then((cache) => {
        return fetch(request)
          .then((response) => {
            // Clone response before caching
            const responseToCache = response.clone();
            cache.put(request, responseToCache);
            return response;
          })
          .catch(() => {
            // Return cached version if network fails
            return cache.match(request).then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse;
              }
              // Return offline page if no cache available
              return new Response(
                JSON.stringify({
                  error: true,
                  message: "You are offline and no cached data available",
                }),
                {
                  headers: { "Content-Type": "application/json" },
                }
              );
            });
          });
      })
    );
    return;
  }

  // Handle static assets with Cache First strategy
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return caches.open(DYNAMIC_CACHE).then((cache) => {
        return fetch(request)
          .then((response) => {
            cache.put(request, response.clone());
            return response;
          })
          .catch(() => {
            // Return offline fallback page
            if (request.destination === "document") {
              return caches.match("/index.html");
            }
          });
      });
    })
  );
});

// Push notification event
self.addEventListener("push", (event) => {
  console.log("[Service Worker] Push received:", event);

  let notificationData = {
    title: "New Story Added!",
    body: "Someone just shared a new story",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-96x96.png",
    data: {
      url: "/",
    },
  };

  // Parse push data if available
  if (event.data) {
    try {
      const pushData = event.data.json();
      console.log("[Service Worker] Push data:", pushData);

      notificationData = {
        title: pushData.title || "New Story Added!",
        body: pushData.body || pushData.message || "Check out the new story",
        icon: pushData.icon || "/icons/icon-192x192.png",
        badge: "/icons/icon-96x96.png",
        image: pushData.image || null,
        data: {
          url: pushData.url || "/",
          storyId: pushData.storyId || null,
        },
        actions: [
          {
            action: "open",
            title: "Open Story",
          },
          {
            action: "close",
            title: "Close",
          },
        ],
        requireInteraction: false,
        vibrate: [200, 100, 200],
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
      requireInteraction: notificationData.requireInteraction,
      vibrate: notificationData.vibrate,
    })
  );
});

// Notification click event
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
      // Check if there's already a window open
      let matchingClient = null;

      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(urlToOpen) && "focus" in client) {
          matchingClient = client;
          break;
        }
      }

      if (matchingClient) {
        return matchingClient.focus();
      } else {
        // Open new window
        const fullUrl = storyId
          ? `${self.location.origin}/#/detail/${storyId}`
          : `${self.location.origin}${urlToOpen}`;
        return clients.openWindow(fullUrl);
      }
    });

  event.waitUntil(promiseChain);
});

// Background sync for offline data
self.addEventListener("sync", (event) => {
  console.log("[Service Worker] Background sync:", event.tag);

  if (event.tag === "sync-stories") {
    event.waitUntil(syncOfflineStories());
  }
});

async function syncOfflineStories() {
  try {
    // Open IndexedDB to get pending stories
    const db = await openDB();
    const tx = db.transaction("pending-stories", "readonly");
    const store = tx.objectStore("pending-stories");
    const pendingStories = await getAllFromStore(store);

    console.log("[Service Worker] Syncing pending stories:", pendingStories);

    // Send each pending story to API
    for (const story of pendingStories) {
      try {
        const response = await fetch(
          "https://story-api.dicoding.dev/v1/stories",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${story.token}`,
            },
            body: story.formData,
          }
        );

        if (response.ok) {
          // Remove from pending stories after successful sync
          const deleteTx = db.transaction("pending-stories", "readwrite");
          const deleteStore = deleteTx.objectStore("pending-stories");
          await deleteStore.delete(story.id);
          console.log("[Service Worker] Story synced and removed:", story.id);
        }
      } catch (error) {
        console.error("[Service Worker] Error syncing story:", error);
      }
    }
  } catch (error) {
    console.error("[Service Worker] Error in background sync:", error);
  }
}

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("story-app-db", 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function getAllFromStore(store) {
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}
