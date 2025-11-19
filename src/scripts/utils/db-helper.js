const DB_NAME = "story-app-db";
const DB_VERSION = 2; // Increment version
const FAVORITES_STORE = "favorites";
const PENDING_STORIES_STORE = "pending-stories";

class DBHelper {
  static openDB() {
    return new Promise((resolve, reject) => {
      if (!("indexedDB" in window)) {
        reject(new Error("IndexedDB is not supported"));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error("Database failed to open:", request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        console.log("Database opened successfully");
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        console.log("Database upgrade needed from version", event.oldVersion);

        // Create favorites store if it doesn't exist
        if (!db.objectStoreNames.contains(FAVORITES_STORE)) {
          const favoritesStore = db.createObjectStore(FAVORITES_STORE, {
            keyPath: "id",
          });
          favoritesStore.createIndex("createdAt", "createdAt", {
            unique: false,
          });
          console.log("Favorites object store created");
        }

        // Create pending-stories store for offline sync
        if (!db.objectStoreNames.contains(PENDING_STORIES_STORE)) {
          const pendingStore = db.createObjectStore(PENDING_STORIES_STORE, {
            keyPath: "id",
            autoIncrement: true,
          });
          pendingStore.createIndex("timestamp", "timestamp", {
            unique: false,
          });
          console.log("Pending stories object store created");
        }
      };
    });
  }

  // Favorites methods
  static async addFavorite(story) {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([FAVORITES_STORE], "readwrite");
      const store = transaction.objectStore(FAVORITES_STORE);

      const favoriteData = {
        ...story,
        createdAt: new Date().toISOString(),
      };

      const request = store.add(favoriteData);

      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          console.log("Story added to favorites:", story.id);
          resolve(true);
        };

        request.onerror = () => {
          console.error("Error adding to favorites:", request.error);
          reject(request.error);
        };

        transaction.oncomplete = () => {
          db.close();
        };
      });
    } catch (error) {
      console.error("Error in addFavorite:", error);
      throw error;
    }
  }

  static async removeFavorite(storyId) {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([FAVORITES_STORE], "readwrite");
      const store = transaction.objectStore(FAVORITES_STORE);

      const request = store.delete(storyId);

      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          console.log("Story removed from favorites:", storyId);
          resolve(true);
        };

        request.onerror = () => {
          console.error("Error removing from favorites:", request.error);
          reject(request.error);
        };

        transaction.oncomplete = () => {
          db.close();
        };
      });
    } catch (error) {
      console.error("Error in removeFavorite:", error);
      throw error;
    }
  }

  static async getAllFavorites() {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([FAVORITES_STORE], "readonly");
      const store = transaction.objectStore(FAVORITES_STORE);

      const request = store.getAll();

      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          console.log("Retrieved all favorites:", request.result.length);
          resolve(request.result);
        };

        request.onerror = () => {
          console.error("Error getting favorites:", request.error);
          reject(request.error);
        };

        transaction.oncomplete = () => {
          db.close();
        };
      });
    } catch (error) {
      console.error("Error in getAllFavorites:", error);
      return [];
    }
  }

  static async isFavorite(storyId) {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([FAVORITES_STORE], "readonly");
      const store = transaction.objectStore(FAVORITES_STORE);

      const request = store.get(storyId);

      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          resolve(!!request.result);
        };

        request.onerror = () => {
          console.error("Error checking favorite:", request.error);
          reject(request.error);
        };

        transaction.oncomplete = () => {
          db.close();
        };
      });
    } catch (error) {
      console.error("Error in isFavorite:", error);
      return false;
    }
  }

  // Pending stories methods for offline sync
  static async addPendingStory(storyData, token) {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([PENDING_STORIES_STORE], "readwrite");
      const store = transaction.objectStore(PENDING_STORIES_STORE);

      const pendingData = {
        ...storyData,
        token,
        timestamp: new Date().toISOString(),
        synced: false,
      };

      const request = store.add(pendingData);

      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          console.log("Story added to pending queue:", request.result);
          resolve(request.result);
        };

        request.onerror = () => {
          console.error("Error adding pending story:", request.error);
          reject(request.error);
        };

        transaction.oncomplete = () => {
          db.close();
        };
      });
    } catch (error) {
      console.error("Error in addPendingStory:", error);
      throw error;
    }
  }

  static async getAllPendingStories() {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([PENDING_STORIES_STORE], "readonly");
      const store = transaction.objectStore(PENDING_STORIES_STORE);

      const request = store.getAll();

      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          console.log("Retrieved pending stories:", request.result.length);
          resolve(request.result);
        };

        request.onerror = () => {
          console.error("Error getting pending stories:", request.error);
          reject(request.error);
        };

        transaction.oncomplete = () => {
          db.close();
        };
      });
    } catch (error) {
      console.error("Error in getAllPendingStories:", error);
      return [];
    }
  }

  static async removePendingStory(id) {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([PENDING_STORIES_STORE], "readwrite");
      const store = transaction.objectStore(PENDING_STORIES_STORE);

      const request = store.delete(id);

      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          console.log("Pending story removed:", id);
          resolve(true);
        };

        request.onerror = () => {
          console.error("Error removing pending story:", request.error);
          reject(request.error);
        };

        transaction.oncomplete = () => {
          db.close();
        };
      });
    } catch (error) {
      console.error("Error in removePendingStory:", error);
      throw error;
    }
  }

  static async clearAllPendingStories() {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([PENDING_STORIES_STORE], "readwrite");
      const store = transaction.objectStore(PENDING_STORIES_STORE);

      const request = store.clear();

      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          console.log("All pending stories cleared");
          resolve(true);
        };

        request.onerror = () => {
          console.error("Error clearing pending stories:", request.error);
          reject(request.error);
        };

        transaction.oncomplete = () => {
          db.close();
        };
      });
    } catch (error) {
      console.error("Error in clearAllPendingStories:", error);
      throw error;
    }
  }
}

export default DBHelper;
