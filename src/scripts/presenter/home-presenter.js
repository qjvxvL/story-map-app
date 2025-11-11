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
    const mapElement = document.querySelector("#map");

    if (!mapElement) return;

    // Initialize Leaflet map
    this._map = L.map("map").setView(
      [CONFIG.MAP_CONFIG.DEFAULT_LAT, CONFIG.MAP_CONFIG.DEFAULT_LNG],
      CONFIG.MAP_CONFIG.DEFAULT_ZOOM
    );

    // Add base layers
    const openStreetMapLayer = L.tileLayer(
      CONFIG.TILE_LAYERS.openStreetMap.url,
      {
        attribution: CONFIG.TILE_LAYERS.openStreetMap.attribution,
        maxZoom: CONFIG.MAP_CONFIG.MAX_ZOOM,
        minZoom: CONFIG.MAP_CONFIG.MIN_ZOOM,
      }
    );

    const openTopoMapLayer = L.tileLayer(CONFIG.TILE_LAYERS.openTopoMap.url, {
      attribution: CONFIG.TILE_LAYERS.openTopoMap.attribution,
      maxZoom: CONFIG.MAP_CONFIG.MAX_ZOOM,
      minZoom: CONFIG.MAP_CONFIG.MIN_ZOOM,
    });

    // Add default layer
    openStreetMapLayer.addTo(this._map);

    // Add layer control
    const baseMaps = {
      [CONFIG.TILE_LAYERS.openStreetMap.name]: openStreetMapLayer,
      [CONFIG.TILE_LAYERS.openTopoMap.name]: openTopoMapLayer,
    };

    L.control.layers(baseMaps).addTo(this._map);
  }

  async _loadStories() {
    try {
      Loading.show();

      const token = AuthRepository.getToken();
      const response = await StoryApi.getStories(token, 1, 100, 1);

      if (response.error === false) {
        this._stories = response.listStory;
        this._renderStories();
        this._renderMarkers();
      }
    } catch (error) {
      console.error("Error loading stories:", error);
      alert("Gagal memuat cerita. Silakan refresh halaman.");
    } finally {
      Loading.hide();
    }
  }

  _renderStories() {
    const storiesListElement = document.querySelector("#stories-list");

    if (!storiesListElement) return;

    // Filter stories based on current filter
    let filteredStories = this._stories;

    if (this._currentFilter === "with-location") {
      filteredStories = this._stories.filter((story) => story.lat && story.lon);
    } else if (this._currentFilter === "no-location") {
      filteredStories = this._stories.filter(
        (story) => !story.lat || !story.lon
      );
    }

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

    // Add click event to story items
    const storyItems = document.querySelectorAll(".story-item");
    storyItems.forEach((item) => {
      const storyId = item.getAttribute("data-story-id");
      const story = this._stories.find((s) => s.id === storyId);

      item.addEventListener("click", () => {
        this._handleStoryClick(story);
      });

      item.addEventListener("keypress", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          this._handleStoryClick(story);
        }
      });
    });
  }

  _renderMarkers() {
    // Clear existing markers
    this._markers.forEach((marker) => marker.remove());
    this._markers = [];

    // Add markers for stories with location
    const storiesWithLocation = this._stories.filter(
      (story) => story.lat && story.lon
    );

    storiesWithLocation.forEach((story) => {
      const marker = L.marker([story.lat, story.lon])
        .addTo(this._map)
        .bindPopup(
          `
          <div class="marker-popup">
            <img src="${story.photoUrl}" alt="${
            story.name
          }" style="width: 100%; max-width: 200px; border-radius: 8px;" />
            <h4 style="margin: 8px 0;">${story.name}</h4>
            <p style="margin: 4px 0; font-size: 14px;">${this._truncateText(
              story.description,
              100
            )}</p>
            <button class="view-detail-btn" data-story-id="${
              story.id
            }" style="margin-top: 8px; padding: 6px 12px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
              Lihat Detail
            </button>
          </div>
        `,
          {
            maxWidth: 250,
          }
        );

      marker.on("click", () => {
        this._highlightMarker(marker, story);
      });

      marker.on("popupopen", () => {
        const viewDetailBtn = document.querySelector(
          `.view-detail-btn[data-story-id="${story.id}"]`
        );
        if (viewDetailBtn) {
          viewDetailBtn.addEventListener("click", () => {
            window.location.hash = `#/detail/${story.id}`;
          });
        }
      });

      this._markers.push({ marker, story });
    });

    // Fit map bounds to show all markers
    if (storiesWithLocation.length > 0) {
      const bounds = L.latLngBounds(
        storiesWithLocation.map((story) => [story.lat, story.lon])
      );
      this._map.fitBounds(bounds, { padding: [50, 50] });
    }
  }

  _highlightMarker(marker, story) {
    // Reset previous active marker
    if (this._activeMarker) {
      this._activeMarker.setIcon(new L.Icon.Default());
    }

    // Set new active marker with custom icon
    const activeIcon = L.icon({
      iconUrl:
        "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
      shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });

    marker.setIcon(activeIcon);
    this._activeMarker = marker;

    // Scroll to corresponding story item
    const storyItem = document.querySelector(
      `.story-item[data-story-id="${story.id}"]`
    );
    if (storyItem) {
      storyItem.scrollIntoView({ behavior: "smooth", block: "center" });
      storyItem.classList.add("highlighted");

      setTimeout(() => {
        storyItem.classList.remove("highlighted");
      }, 2000);
    }
  }

  _handleStoryClick(story) {
    if (story.lat && story.lon) {
      // Find corresponding marker
      const markerData = this._markers.find((m) => m.story.id === story.id);
      if (markerData) {
        // Pan to marker and open popup
        this._map.setView([story.lat, story.lon], 15);
        markerData.marker.openPopup();
        this._highlightMarker(markerData.marker, story);
      }
    }
  }

  _attachEventListeners() {
    const filterSelect = document.querySelector("#location-filter");

    if (filterSelect) {
      filterSelect.addEventListener("change", (e) => {
        this._currentFilter = e.target.value;
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
