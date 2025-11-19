import DBHelper from "../utils/db-helper.js";
import StoryItem from "../views/components/story-item.js";
import Loading from "../views/components/loading.js";
import KeyboardHelper from "../utils/keyboard-helper.js"; // ✅ ADD

class FavoritesPresenter {
  constructor() {
    this._favorites = [];
    this._filteredFavorites = [];
    this._currentFilter = "all";
    this._currentSort = "newest";
    this._searchQuery = "";
  }

  async init() {
    await this._loadFavorites();
    this._attachEventListeners();
  }

  async _loadFavorites() {
    try {
      Loading.show();

      this._favorites = await DBHelper.getAllFavorites();
      this._applyFiltersAndSort();
      this._renderFavorites();
    } catch (error) {
      console.error("Error loading favorites:", error);
      alert("Gagal memuat cerita favorit.");
    } finally {
      Loading.hide();
    }
  }

  _applyFiltersAndSort() {
    let filtered = [...this._favorites];

    // Apply filter
    if (this._currentFilter === "with-location") {
      filtered = filtered.filter((story) => story.lat && story.lon);
    } else if (this._currentFilter === "no-location") {
      filtered = filtered.filter((story) => !story.lat || !story.lon);
    }

    // Apply search
    if (this._searchQuery) {
      const query = this._searchQuery.toLowerCase();
      filtered = filtered.filter(
        (story) =>
          story.name.toLowerCase().includes(query) ||
          story.description.toLowerCase().includes(query)
      );
    }

    // Apply sort
    switch (this._currentSort) {
      case "newest":
        filtered.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
        break;
      case "oldest":
        filtered.sort((a, b) => new Date(a.addedAt) - new Date(b.addedAt));
        break;
      case "name-asc":
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name-desc":
        filtered.sort((a, b) => b.name.localeCompare(a.name));
        break;
    }

    this._filteredFavorites = filtered;
  }

  _renderFavorites() {
    const favoritesListElement = document.querySelector("#favorites-list");
    const emptyStateElement = document.querySelector("#empty-state");

    if (this._filteredFavorites.length === 0) {
      favoritesListElement.innerHTML = "";
      emptyStateElement.classList.remove("hidden");
      return;
    }

    emptyStateElement.classList.add("hidden");

    favoritesListElement.innerHTML = this._filteredFavorites
      .map((story) => this._renderFavoriteItem(story))
      .join("");

    this._attachFavoriteEventListeners();
  }

  _renderFavoriteItem(story) {
    return `
      <article class="favorite-item" data-story-id="${story.id}" tabindex="0">
        <img 
          src="${story.photoUrl}" 
          alt="Story photo by ${story.name}"
          class="favorite-image"
        />
        
        <div class="favorite-content">
          <h3 class="favorite-name">${story.name}</h3>
          <p class="favorite-description">${this._truncateText(
            story.description,
            150
          )}</p>
          
          <div class="favorite-meta">
            <span class="favorite-date">
              ⭐ ${this._formatDate(story.addedAt)}
            </span>
            ${
              story.lat && story.lon
                ? `<span class="favorite-location">📍 Dengan Lokasi</span>`
                : ""
            }
          </div>

          <div class="favorite-actions">
            <button class="btn btn-primary btn-sm view-detail" data-id="${
              story.id
            }">
              Lihat Detail
            </button>
            <button class="btn btn-danger btn-sm remove-favorite" data-id="${
              story.id
            }" aria-label="Remove from favorites">
              ❌ Hapus
            </button>
          </div>
        </div>
      </article>
    `;
  }

  _attachFavoriteEventListeners() {
    // View detail buttons
    const viewButtons = document.querySelectorAll(".view-detail");
    viewButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
        e.stopPropagation();
        const storyId = button.getAttribute("data-id");
        window.location.hash = `#/detail/${storyId}`;
      });
    });

    // Remove favorite buttons
    const removeButtons = document.querySelectorAll(".remove-favorite");
    removeButtons.forEach((button) => {
      button.addEventListener("click", async (e) => {
        e.stopPropagation();
        const storyId = button.getAttribute("data-id");
        await this._handleRemoveFavorite(storyId);
      });
    });

    // Favorite items click
    const favoriteItems = document.querySelectorAll(".favorite-item");
    favoriteItems.forEach((item) => {
      item.addEventListener("click", () => {
        const storyId = item.getAttribute("data-story-id");
        window.location.hash = `#/detail/${storyId}`;
      });

      item.addEventListener("keypress", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          const storyId = item.getAttribute("data-story-id");
          window.location.hash = `#/detail/${storyId}`;
        }
      });
    });
  }

  async _handleRemoveFavorite(storyId) {
    if (confirm("Hapus cerita dari favorit?")) {
      try {
        Loading.show();
        await DBHelper.deleteFavorite(storyId);
        await this._loadFavorites();
      } catch (error) {
        console.error("Error removing favorite:", error);
        alert("Gagal menghapus favorit.");
      } finally {
        Loading.hide();
      }
    }
  }

  _attachEventListeners() {
    // Filter
    const filterSelect = document.querySelector("#favorite-filter");
    if (filterSelect) {
      filterSelect.addEventListener("change", (e) => {
        this._currentFilter = e.target.value;
        this._applyFiltersAndSort();
        this._renderFavorites();
      });
    }

    // Sort
    const sortSelect = document.querySelector("#favorite-sort");
    if (sortSelect) {
      sortSelect.addEventListener("change", (e) => {
        this._currentSort = e.target.value;
        this._applyFiltersAndSort();
        this._renderFavorites();
      });
    }

    // Search
    const searchInput = document.querySelector("#favorite-search");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        this._searchQuery = e.target.value;
        this._applyFiltersAndSort();
        this._renderFavorites();
      });
    }
  }

  _truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  }

  _formatDate(dateString) {
    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return new Date(dateString).toLocaleDateString("id-ID", options);
  }
}

export default FavoritesPresenter;
