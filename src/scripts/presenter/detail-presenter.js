import StoryApi from "../api/story-api.js";
import AuthRepository from "../data/auth-repository.js";
import DBHelper from "../utils/db-helper.js";
import Loading from "../views/components/loading.js";
import CONFIG from "../config/config.js";

class DetailPresenter {
  constructor(storyId) {
    console.log("🏗️ DetailPresenter constructor called");
    console.log("  - storyId parameter received:", storyId);

    // Store whatever was passed (even if undefined)
    this._storyId = storyId;
    this._story = null;
    this._map = null;
    this._isFavorite = false;
  }

  async init() {
    // ✅ CRITICAL FIX: Parse URL SETIAP KALI di init()
    console.log("🔍 DetailPresenter init() called");
    console.log("  - this._storyId from constructor:", this._storyId);

    // SELALU parse dari URL untuk ensure correctness
    const hash = window.location.hash.slice(1); // Remove #
    console.log("  - Full hash:", hash);

    const parts = hash.split("/");
    console.log("  - URL parts:", parts);

    // Extract story ID from URL (parts[2])
    const urlStoryId = parts[2];
    console.log("  - Story ID from URL (parts[2]):", urlStoryId);

    // Use URL story ID (more reliable)
    if (urlStoryId && urlStoryId !== "undefined" && urlStoryId !== "") {
      this._storyId = urlStoryId;
      console.log("✅ Using story ID from URL:", this._storyId);
    } else {
      console.error("❌ No valid story ID found in URL!");
      console.error("❌ Hash:", hash);
      console.error("❌ Parts:", parts);

      // Show error immediately
      const detailContainer = document.querySelector("#story-detail");
      if (detailContainer) {
        detailContainer.innerHTML = `
          <div class="error-message" style="
            text-align: center;
            padding: 2rem;
            background: white;
            border-radius: 12px;
            margin: 2rem;
          ">
            <h2 style="color: #dc3545;">Error</h2>
            <p style="color: #6c757d; margin: 1rem 0;">
              Story ID tidak valid atau tidak ditemukan di URL
            </p>
            <p style="color: #999; font-size: 0.85rem; margin-top: 1rem;">
              URL: <code style="background: #f5f5f5; padding: 0.25rem 0.5rem; border-radius: 4px;">${hash}</code>
            </p>
            <a href="#/home" class="btn btn-primary" style="
              display: inline-block;
              margin-top: 1.5rem;
              padding: 0.75rem 1.5rem;
              background: #007bff;
              color: white;
              text-decoration: none;
              border-radius: 8px;
              font-weight: 600;
            ">Kembali ke Home</a>
          </div>
        `;
      }
      return;
    }

    console.log("📦 Final story ID for loading:", this._storyId);
    console.log("📦 Story ID type:", typeof this._storyId);
    console.log("📦 Story ID length:", this._storyId?.length);

    // Now load story with valid ID
    await this._loadStoryDetail();
    await this._checkFavoriteStatus();
  }

  async _loadStoryDetail() {
    try {
      Loading.show();
      const token = AuthRepository.getToken();

      console.log("📡 Fetching story from API...");
      console.log("🆔 Story ID to fetch:", this._storyId);
      console.log("🆔 Story ID length:", this._storyId?.length);
      console.log("🆔 Story ID type:", typeof this._storyId);
      console.log(
        "🔗 Full API URL:",
        `${CONFIG.BASE_URL}/stories/${this._storyId}`
      );

      const response = await StoryApi.getStoryDetail(token, this._storyId);

      if (!response.error) {
        this._story = response.story;
        console.log("✅ Story loaded:", this._story);
        this._renderStoryDetail();

        // Initialize map if location exists
        if (this._story.lat && this._story.lon) {
          await this._initMap();
        }
      } else {
        throw new Error(response.message || "Gagal memuat detail cerita");
      }
    } catch (error) {
      console.error("❌ Error loading story detail:", error);
      console.error("❌ Story ID was:", this._storyId);
      console.error(
        "❌ API URL was:",
        `${CONFIG.BASE_URL}/stories/${this._storyId}`
      );

      const detailContainer = document.querySelector("#story-detail");
      if (detailContainer) {
        detailContainer.innerHTML = `
          <div class="error-message" style="
            text-align: center;
            padding: 2rem;
            background: white;
            border-radius: 12px;
            margin: 2rem;
          ">
            <h2 style="color: #dc3545;">Error</h2>
            <p style="color: #6c757d; margin: 1rem 0;">${error.message}</p>
            <p style="color: #999; font-size: 0.85rem; margin-top: 1rem;">
              Story ID: <code style="background: #f5f5f5; padding: 0.25rem 0.5rem; border-radius: 4px;">${this._storyId}</code>
            </p>
            <p style="color: #999; font-size: 0.85rem;">
              API URL: <code style="background: #f5f5f5; padding: 0.25rem 0.5rem; border-radius: 4px; word-break: break-all;">
                ${CONFIG.BASE_URL}/stories/${this._storyId}
              </code>
            </p>
            <a href="#/home" class="btn btn-primary" style="
              display: inline-block;
              margin-top: 1.5rem;
              padding: 0.75rem 1.5rem;
              background: #007bff;
              color: white;
              text-decoration: none;
              border-radius: 8px;
              font-weight: 600;
            ">Kembali ke Home</a>
          </div>
        `;
      }
    } finally {
      Loading.hide();
    }
  }

  async _checkFavoriteStatus() {
    this._isFavorite = await DBHelper.isFavorite(this._storyId);
    this._updateFavoriteButton();
  }

  _updateFavoriteButton() {
    const favoriteBtn = document.querySelector("#favorite-btn");
    if (favoriteBtn) {
      if (this._isFavorite) {
        favoriteBtn.textContent = "❤️ Hapus dari Favorit";
        favoriteBtn.classList.remove("btn-primary");
        favoriteBtn.classList.add("btn-danger");
      } else {
        favoriteBtn.textContent = "🤍 Tambah ke Favorit";
        favoriteBtn.classList.remove("btn-danger");
        favoriteBtn.classList.add("btn-primary");
      }
    }
  }

  _renderStoryDetail() {
    const detailContainer = document.querySelector("#story-detail");

    if (!detailContainer) return;

    detailContainer.innerHTML = `
      <div class="detail-header">
        <button id="back-btn" class="btn-back" aria-label="Back to home">
          ← Kembali
        </button>
        <button id="favorite-btn" class="btn btn-primary">
          🤍 Tambah ke Favorit
        </button>
      </div>

      <article class="detail-content">
        <img 
          src="${this._story.photoUrl}" 
          alt="Story photo by ${this._story.name}"
          class="detail-image"
        />
        
        <div class="detail-info">
          <h2 class="detail-name">${this._story.name}</h2>
          <time datetime="${this._story.createdAt}" class="detail-date">
            📅 ${this._formatDate(this._story.createdAt)}
          </time>
          
          <div class="detail-description">
            <h3>Deskripsi:</h3>
            <p>${this._story.description}</p>
          </div>

          ${
            this._story.lat && this._story.lon
              ? `
            <div class="detail-location">
              <h3>Lokasi:</h3>
              <p>📍 Latitude: ${this._story.lat.toFixed(6)}</p>
              <p>📍 Longitude: ${this._story.lon.toFixed(6)}</p>
              <div id="detail-map" class="detail-map"></div>
            </div>
          `
              : ""
          }
        </div>
      </article>
    `;

    // Attach back button event
    const backBtn = document.querySelector("#back-btn");
    backBtn.addEventListener("click", () => {
      window.location.hash = "#/home";
    });

    backBtn.addEventListener("keypress", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        window.location.hash = "#/home";
      }
    });

    // Attach favorite button event
    const favoriteBtn = document.querySelector("#favorite-btn");
    favoriteBtn.addEventListener("click", () => {
      this._handleToggleFavorite();
    });
  }

  async _handleToggleFavorite() {
    try {
      Loading.show();

      if (this._isFavorite) {
        await DBHelper.deleteFavorite(this._storyId);
        this._isFavorite = false;
        alert("Cerita dihapus dari favorit");
      } else {
        await DBHelper.addFavorite(this._story);
        this._isFavorite = true;
        alert("Cerita ditambahkan ke favorit");
      }

      this._updateFavoriteButton();
    } catch (error) {
      console.error("Error toggling favorite:", error);
      alert("Gagal mengubah status favorit");
    } finally {
      Loading.hide();
    }
  }

  async _initMap() {
    const mapElement = document.querySelector("#detail-map");

    if (!mapElement) {
      console.warn("Map element not found");
      return;
    }

    // Wait for element to be fully rendered
    await new Promise((resolve) => setTimeout(resolve, 100));

    try {
      // Initialize Leaflet map
      this._map = L.map("detail-map").setView(
        [this._story.lat, this._story.lon],
        15
      );

      // Add tile layer
      L.tileLayer(CONFIG.TILE_LAYERS.openStreetMap.url, {
        attribution: CONFIG.TILE_LAYERS.openStreetMap.attribution,
        maxZoom: CONFIG.MAP_CONFIG.MAX_ZOOM,
        minZoom: CONFIG.MAP_CONFIG.MIN_ZOOM,
      }).addTo(this._map);

      // Add marker
      L.marker([this._story.lat, this._story.lon])
        .addTo(this._map)
        .bindPopup(`<b>${this._story.name}</b>`)
        .openPopup();

      // Force map resize after render
      setTimeout(() => {
        if (this._map) {
          this._map.invalidateSize();
        }
      }, 300);
    } catch (error) {
      console.error("Error initializing map:", error);
    }
  }

  _formatDate(dateString) {
    const date = new Date(dateString);
    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return date.toLocaleDateString("id-ID", options);
  }
}

export default DetailPresenter;
