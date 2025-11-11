import StoryApi from "../api/story-api.js";
import AuthRepository from "../data/auth-repository.js";
import DBHelper from "../utils/db-helper.js";
import Loading from "../views/components/loading.js";
import CONFIG from "../config/config.js";

class DetailPresenter {
  constructor(storyId) {
    this._storyId = storyId;
    this._story = null;
    this._map = null;
    this._isFavorite = false;
  }

  async init() {
    await this._loadStoryDetail();
    await this._checkFavoriteStatus();
  }

  async _loadStoryDetail() {
    try {
      Loading.show();

      const token = AuthRepository.getToken();
      const response = await StoryApi.getStoryDetail(token, this._storyId);

      if (response.error === false) {
        this._story = response.story;
        this._renderStoryDetail();

        if (this._story.lat && this._story.lon) {
          await this._initMap();
        }
      }
    } catch (error) {
      console.error("Error loading story detail:", error);
      alert("Gagal memuat detail cerita.");
      window.location.hash = "#/home";
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

    if (!mapElement) return;

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
  }

  _formatDate(dateString) {
    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(dateString).toLocaleDateString("id-ID", options);
  }
}

export default DetailPresenter;
