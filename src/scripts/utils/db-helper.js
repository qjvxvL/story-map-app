const DB_NAME = "story-map-db";
const DB_VERSION = 1;

class DBHelper {
  static openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Stories store for caching
        if (!db.objectStoreNames.contains("stories")) {
          const storyStore = db.createObjectStore("stories", { keyPath: "id" });
          storyStore.createIndex("createdAt", "createdAt", { unique: false });
        }

        // Pending stories for background sync
        if (!db.objectStoreNames.contains("pending-stories")) {
          db.createObjectStore("pending-stories", {
            keyPath: "id",
            autoIncrement: true,
          });
        }

        // Favorites
        if (!db.objectStoreNames.contains("favorites")) {
          const favStore = db.createObjectStore("favorites", { keyPath: "id" });
          favStore.createIndex("addedAt", "addedAt", { unique: false });
        }
      };
    });
  }

  // Stories
  static async getAllStories() {
    const db = await this.openDB();
    const tx = db.transaction("stories", "readonly");
    const store = tx.objectStore("stories");
    return store.getAll();
  }

  static async saveStories(stories) {
    const db = await this.openDB();
    const tx = db.transaction("stories", "readwrite");
    const store = tx.objectStore("stories");

    stories.forEach((story) => {
      store.put(story);
    });

    return tx.complete;
  }

  static async clearStories() {
    const db = await this.openDB();
    const tx = db.transaction("stories", "readwrite");
    const store = tx.objectStore("stories");
    return store.clear();
  }

  // Pending Stories
  static async addPendingStory(story) {
    const db = await this.openDB();
    const tx = db.transaction("pending-stories", "readwrite");
    const store = tx.objectStore("pending-stories");
    return store.add(story);
  }

  static async getAllPendingStories() {
    const db = await this.openDB();
    const tx = db.transaction("pending-stories", "readonly");
    const store = tx.objectStore("pending-stories");
    return store.getAll();
  }

  static async deletePendingStory(id) {
    const db = await this.openDB();
    const tx = db.transaction("pending-stories", "readwrite");
    const store = tx.objectStore("pending-stories");
    return store.delete(id);
  }

  // Favorites
  static async addFavorite(story) {
    const db = await this.openDB();
    const tx = db.transaction("favorites", "readwrite");
    const store = tx.objectStore("favorites");

    const favoriteStory = {
      ...story,
      addedAt: new Date().toISOString(),
    };

    return store.add(favoriteStory);
  }

  static async getFavorite(id) {
    const db = await this.openDB();
    const tx = db.transaction("favorites", "readonly");
    const store = tx.objectStore("favorites");
    return store.get(id);
  }

  static async getAllFavorites() {
    const db = await this.openDB();
    const tx = db.transaction("favorites", "readonly");
    const store = tx.objectStore("favorites");
    const index = store.index("addedAt");
    return index.getAll();
  }

  static async deleteFavorite(id) {
    const db = await this.openDB();
    const tx = db.transaction("favorites", "readwrite");
    const store = tx.objectStore("favorites");
    return store.delete(id);
  }

  static async isFavorite(id) {
    const favorite = await this.getFavorite(id);
    return !!favorite;
  }
}

export default DBHelper;
