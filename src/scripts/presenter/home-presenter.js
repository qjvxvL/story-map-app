import StoryApi from "../api/story-api.js";
import AuthRepository from "../data/auth-repository.js";
import StoryItem from "../views/components/story-item.js";
import Loading from "../views/components/loading.js";
import CONFIG from "../config/config.js";

class HomePresenter {
  constructor() {
    this._stories = [];
    this._map = null;
    this._markers = [];
    this._currentFilter = "all";
    this._activeMarker = null;
  }

  async init() {
    await this._initMap();
    await this._loadStories();
    this._attachEventListeners();
  }

  async _initMap() {
    // Initialize map
    this._map = L.map("map").setView(
      [CONFIG.MAP_CONFIG.DEFAULT_LAT, CONFIG.MAP_CONFIG.DEFAULT_LNG],
      CONFIG.MAP_CONFIG.DEFAULT_ZOOM
    );

    // Add tile layers
    const baseLayers = {
      OpenStreetMap: L.tileLayer(CONFIG.TILE_LAYERS.openStreetMap.url, {
        attribution: CONFIG.TILE_LAYERS.openStreetMap.attribution,
        maxZoom: CONFIG.MAP_CONFIG.MAX_ZOOM,
      }),
      Topographic: L.tileLayer(CONFIG.TILE_LAYERS.openTopoMap.url, {
        attribution: CONFIG.TILE_LAYERS.openTopoMap.attribution,
        maxZoom: CONFIG.MAP_CONFIG.MAX_ZOOM,
      }),
    };

    baseLayers["OpenStreetMap"].addTo(this._map);
    L.control.layers(baseLayers).addTo(this._map);
  }

  async _loadStories() {
    try {
      Loading.show();

      const token = AuthRepository.getToken();
      console.log("🔑 Token exists:", !!token);
      console.log(
        "🔑 Token (first 30 chars):",
        token?.substring(0, 30) + "..."
      );

      console.log("📡 Fetching stories from API...");
      console.log(
        "📡 API URL:",
        `${CONFIG.BASE_URL}/stories?page=1&size=100&location=1`
      );

      const response = await StoryApi.getStories(token, 1, 100, 1);

      console.log("📦 API Response:", {
        error: response.error,
        message: response.message,
        listStoryLength: response.listStory?.length,
      });

      if (
        response.error === false &&
        response.listStory &&
        response.listStory.length > 0
      ) {
        this._stories = response.listStory;

        console.log("✅ Stories loaded successfully:", this._stories.length);
        console.log("📋 Sample story IDs (first 5):");
        this._stories.slice(0, 5).forEach((story, index) => {
          console.log(`  ${index + 1}. ID: ${story.id}`);
          console.log(`     Name: ${story.name}`);
          console.log(`     Photo: ${story.photoUrl?.substring(0, 50)}...`);
        });

        this._renderStories();
        this._renderMarkers();
      } else {
        console.error("❌ API returned error or empty list");
        throw new Error(response.message || "Tidak ada cerita tersedia");
      }
    } catch (error) {
      console.error("❌ Error loading stories:", error);
      console.error("❌ Error stack:", error.stack);

      const storiesListElement = document.querySelector("#stories-list");
      if (storiesListElement) {
        storiesListElement.innerHTML = `
          <div class="error-state" style="
            text-align: center;
            padding: 2rem;
            background: white;
            border-radius: 12px;
          ">
            <h3 style="color: #dc3545;">Error Loading Stories</h3>
            <p style="color: #6c757d; margin: 1rem 0;">${error.message}</p>
            <button onclick="window.location.reload()" class="btn btn-primary">
              Refresh Page
            </button>
          </div>
        `;
      }
    } finally {
      Loading.hide();
    }
  }

  _renderStories() {
    const storiesListElement = document.querySelector("#stories-list");

    if (!storiesListElement) {
      console.error("❌ Stories list element not found!");
      return;
    }

    // Apply filter
    let filteredStories = this._stories;
    if (this._currentFilter === "with-location") {
      filteredStories = this._stories.filter((story) => story.lat && story.lon);
    } else if (this._currentFilter === "no-location") {
      filteredStories = this._stories.filter(
        (story) => !story.lat || !story.lon
      );
    }

    console.log(
      "📋 Filtered stories:",
      filteredStories.length,
      `(filter: ${this._currentFilter})`
    );

    if (filteredStories.length === 0) {
      storiesListElement.innerHTML = `
        <div class="empty-state">
          <p>Tidak ada cerita ditemukan.</p>
        </div>
      `;
      return;
    }

    storiesListElement.innerHTML = filteredStories
      .map((story) => StoryItem.render(story))
      .join("");

    console.log("✅ Stories rendered to DOM");

    // Attach event listeners
    const storyItems = document.querySelectorAll(".story-item");
    console.log(
      "🔗 Attaching event listeners to",
      storyItems.length,
      "story items"
    );

    storyItems.forEach((item, index) => {
      const storyId = item.getAttribute("data-story-id");
      const story = this._stories.find((s) => s.id === storyId);

      if (!story) {
        console.error(`❌ Story not found for ID: ${storyId}`);
        return;
      }

      console.log(`📌 Card ${index + 1}:`, {
        id: story.id,
        name: story.name,
        hasLocation: !!(story.lat && story.lon),
      });

      // Click event
      item.addEventListener("click", (e) => {
        e.preventDefault();
        console.log("🖱️ Card clicked!", {
          id: story.id,
          name: story.name,
        });
        this._handleStoryClick(story);
      });

      // Keyboard event
      item.addEventListener("keypress", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          console.log("⌨️ Keyboard activated:", story.id);
          this._handleStoryClick(story);
        }
      });

      // Make focusable
      item.setAttribute("tabindex", "0");
    });

    console.log("✅ Event listeners attached successfully");
  }

  _renderMarkers() {
    // Clear existing markers
    this._markers.forEach((marker) => this._map.removeLayer(marker));
    this._markers = [];

    // Add markers for stories with location
    this._stories
      .filter((story) => story.lat && story.lon)
      .forEach((story) => {
        const marker = L.marker([story.lat, story.lon])
          .addTo(this._map)
          .bindPopup(
            `
            <div class="marker-popup">
              <img src="${story.photoUrl}" alt="${
              story.name
            }" style="width: 100%; max-height: 150px; object-fit: cover; border-radius: 8px; margin-bottom: 8px;">
              <h4 style="margin: 0 0 8px 0;">${story.name}</h4>
              <p style="margin: 0 0 8px 0; font-size: 0.9rem;">${this._truncateText(
                story.description,
                100
              )}</p>
              <a href="#/detail/${
                story.id
              }" class="btn btn-sm btn-primary" style="display: inline-block; padding: 0.5rem 1rem; text-decoration: none;">
                Lihat Detail
              </a>
            </div>
          `,
            { maxWidth: 250 }
          );

        marker.on("click", () => {
          this._highlightMarker(marker, story);
        });

        this._markers.push(marker);
      });

    console.log("✅ Rendered", this._markers.length, "markers on map");
  }

  _highlightMarker(marker, story) {
    // Reset previous active marker
    if (this._activeMarker) {
      this._activeMarker.setIcon(L.Icon.Default.prototype);
    }

    // Highlight new marker
    const highlightIcon = L.icon({
      iconUrl:
        "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
      shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });

    marker.setIcon(highlightIcon);
    this._activeMarker = marker;

    // Scroll to story in list
    const storyElement = document.querySelector(
      `[data-story-id="${story.id}"]`
    );
    if (storyElement) {
      storyElement.scrollIntoView({ behavior: "smooth", block: "center" });
      storyElement.focus();
    }
  }

  async _handleStoryClick(story) {
    console.log("📖 _handleStoryClick called");
    console.log("  - Story ID:", story.id);
    console.log("  - Story ID type:", typeof story.id);
    console.log("  - Story ID length:", story.id?.length);
    console.log("  - Story Name:", story.name);

    // Validate story ID
    if (!story.id || story.id === "" || story.id === "undefined") {
      console.error("❌ Invalid story ID!");
      alert("Story ID tidak valid. Silakan refresh halaman.");
      return;
    }

    // Test API call first
    try {
      const token = AuthRepository.getToken();
      console.log("🧪 Testing API call for story ID:", story.id);

      const testResponse = await fetch(
        `${CONFIG.BASE_URL}/stories/${story.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("🧪 Test API response status:", testResponse.status);

      if (testResponse.status === 404) {
        console.error("❌ Story not found in API!");
        alert(
          `Story "${story.name}" tidak ditemukan di server. Mungkin sudah dihapus.`
        );
        // Refresh data
        await this._loadStories();
        return;
      }

      if (testResponse.status === 401) {
        console.error("❌ Token expired!");
        alert("Sesi Anda telah berakhir. Silakan login kembali.");
        window.location.hash = "#/login";
        return;
      }

      if (testResponse.ok) {
        const testData = await testResponse.json();
        console.log("✅ Story exists in API:", testData);

        // Navigate to detail
        console.log("  - Navigating to:", `#/detail/${story.id}`);
        console.log("  - Current hash before:", window.location.hash);

        window.location.hash = `#/detail/${story.id}`;

        console.log("  - Current hash after:", window.location.hash);
      }
    } catch (error) {
      console.error("❌ Error testing API:", error);
      alert("Terjadi kesalahan saat memuat detail cerita.");
    }
  }

  _attachEventListeners() {
    // Filter dropdown
    const filterSelect = document.querySelector("#location-filter");
    if (filterSelect) {
      filterSelect.addEventListener("change", (e) => {
        this._currentFilter = e.target.value;
        console.log("🔍 Filter changed to:", this._currentFilter);
        this._renderStories();
      });
    }
  }

  _truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  }
}

export default HomePresenter;
