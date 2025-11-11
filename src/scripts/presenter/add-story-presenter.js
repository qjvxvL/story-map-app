import StoryApi from "../api/story-api.js";
import AuthRepository from "../data/auth-repository.js";
import CameraHelper from "../utils/camera-helper.js";
import Loading from "../views/components/loading.js";
import CONFIG from "../config/config.js";
import DBHelper from "../utils/db-helper.js";

class AddStoryPresenter {
  constructor() {
    this._form = null;
    this._map = null;
    this._marker = null;
    this._selectedLocation = null;
    this._photoFile = null;
    this._cameraHelper = new CameraHelper();
    this._photoMethod = "upload";
  }

  async init() {
    this._form = document.querySelector("#add-story-form");
    await this._initMap();
    this._attachEventListeners();
  }

  async _initMap() {
    const mapElement = document.querySelector("#location-map");

    if (!mapElement) return;

    // Initialize Leaflet map
    this._map = L.map("location-map").setView(
      [CONFIG.MAP_CONFIG.DEFAULT_LAT, CONFIG.MAP_CONFIG.DEFAULT_LNG],
      CONFIG.MAP_CONFIG.DEFAULT_ZOOM
    );

    // Add tile layer
    L.tileLayer(CONFIG.TILE_LAYERS.openStreetMap.url, {
      attribution: CONFIG.TILE_LAYERS.openStreetMap.attribution,
      maxZoom: CONFIG.MAP_CONFIG.MAX_ZOOM,
      minZoom: CONFIG.MAP_CONFIG.MIN_ZOOM,
    }).addTo(this._map);

    // Add click event to select location
    this._map.on("click", (e) => {
      this._handleMapClick(e);
    });
  }

  _handleMapClick(e) {
    const { lat, lng } = e.latlng;

    // Remove existing marker
    if (this._marker) {
      this._marker.remove();
    }

    // Add new marker
    this._marker = L.marker([lat, lng]).addTo(this._map);

    // Update location inputs
    document.querySelector("#latitude").value = lat.toFixed(6);
    document.querySelector("#longitude").value = lng.toFixed(6);

    this._selectedLocation = { lat, lon: lng };
  }

  _attachEventListeners() {
    // Form submission
    this._form.addEventListener("submit", async (e) => {
      e.preventDefault();
      await this._handleSubmit();
    });

    // Photo method selection
    const photoUploadRadio = document.querySelector("#photo-upload");
    const photoCameraRadio = document.querySelector("#photo-camera");

    photoUploadRadio.addEventListener("change", () => {
      this._handlePhotoMethodChange("upload");
    });

    photoCameraRadio.addEventListener("change", () => {
      this._handlePhotoMethodChange("camera");
    });

    // File upload
    const photoInput = document.querySelector("#photo");
    photoInput.addEventListener("change", (e) => {
      this._handleFileSelect(e);
    });

    // Remove photo button
    const removePhotoBtn = document.querySelector("#remove-photo");
    removePhotoBtn.addEventListener("click", () => {
      this._handleRemovePhoto();
    });

    // Camera controls
    const startCameraBtn = document.querySelector("#start-camera");
    const capturePhotoBtn = document.querySelector("#capture-photo");
    const retakePhotoBtn = document.querySelector("#retake-photo");

    startCameraBtn.addEventListener("click", async () => {
      await this._handleStartCamera();
    });

    capturePhotoBtn.addEventListener("click", async () => {
      await this._handleCapturePhoto();
    });

    retakePhotoBtn.addEventListener("click", () => {
      this._handleRetakePhoto();
    });

    // Cancel button
    const cancelBtn = document.querySelector("#cancel-btn");
    cancelBtn.addEventListener("click", () => {
      window.location.hash = "#/home";
    });
  }

  _handlePhotoMethodChange(method) {
    this._photoMethod = method;
    const uploadSection = document.querySelector("#upload-section");
    const cameraSection = document.querySelector("#camera-section");

    if (method === "upload") {
      uploadSection.classList.remove("hidden");
      cameraSection.classList.add("hidden");
      this._cameraHelper.stopCamera();
    } else {
      uploadSection.classList.add("hidden");
      cameraSection.classList.remove("hidden");
    }

    // Reset photo
    this._photoFile = null;
    this._handleRemovePhoto();
  }

  _handleFileSelect(e) {
    const file = e.target.files[0];

    if (!file) return;

    // Validate file
    if (!file.type.match("image.*")) {
      alert("File harus berupa gambar");
      e.target.value = "";
      return;
    }

    if (file.size > 1024 * 1024) {
      alert("Ukuran file maksimal 1MB");
      e.target.value = "";
      return;
    }

    this._photoFile = file;

    // Show preview
    const reader = new FileReader();
    reader.onload = (event) => {
      const preview = document.querySelector("#photo-preview");
      const previewContainer = document.querySelector("#preview-container");

      preview.src = event.target.result;
      previewContainer.classList.remove("hidden");
    };
    reader.readAsDataURL(file);

    // Clear error
    document.querySelector("#photo-error").textContent = "";
  }

  _handleRemovePhoto() {
    const photoInput = document.querySelector("#photo");
    const preview = document.querySelector("#photo-preview");
    const previewContainer = document.querySelector("#preview-container");

    photoInput.value = "";
    preview.src = "";
    previewContainer.classList.add("hidden");
    this._photoFile = null;
  }

  async _handleStartCamera() {
    try {
      const videoElement = document.querySelector("#camera-video");
      await this._cameraHelper.startCamera(videoElement);

      // Show/hide buttons
      document.querySelector("#start-camera").classList.add("hidden");
      document.querySelector("#capture-photo").classList.remove("hidden");

      document.querySelector("#photo-error").textContent = "";
    } catch (error) {
      document.querySelector("#photo-error").textContent = error.message;
    }
  }

  async _handleCapturePhoto() {
    try {
      const blob = await this._cameraHelper.capturePhoto();

      // Convert blob to file
      this._photoFile = new File([blob], "camera-photo.jpg", {
        type: "image/jpeg",
      });

      // Show canvas with captured photo
      const canvas = document.querySelector("#camera-canvas");
      const video = document.querySelector("#camera-video");
      const context = canvas.getContext("2d");

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.classList.remove("hidden");
      video.classList.add("hidden");

      // Show/hide buttons
      document.querySelector("#capture-photo").classList.add("hidden");
      document.querySelector("#retake-photo").classList.remove("hidden");

      // Stop camera
      this._cameraHelper.stopCamera();

      document.querySelector("#photo-error").textContent = "";
    } catch (error) {
      document.querySelector("#photo-error").textContent = error.message;
    }
  }

  _handleRetakePhoto() {
    const canvas = document.querySelector("#camera-canvas");
    const video = document.querySelector("#camera-video");

    canvas.classList.add("hidden");
    video.classList.remove("hidden");

    // Show/hide buttons
    document.querySelector("#start-camera").classList.remove("hidden");
    document.querySelector("#retake-photo").classList.add("hidden");

    this._photoFile = null;
  }

  async _handleSubmit() {
    // Clear previous messages
    const errorContainer = document.querySelector("#form-error");
    const successContainer = document.querySelector("#form-success");

    errorContainer.textContent = "";
    errorContainer.style.display = "none";
    successContainer.textContent = "";
    successContainer.classList.add("hidden");

    // Validate form
    const description = document.querySelector("#description").value.trim();

    if (!description) {
      document.querySelector("#description-error").textContent =
        "Deskripsi tidak boleh kosong";
      return;
    }

    if (!this._photoFile) {
      document.querySelector("#photo-error").textContent = "Foto harus dipilih";
      return;
    }

    try {
      Loading.show();

      const token = AuthRepository.getToken();

      const storyData = {
        description,
        photo: this._photoFile,
      };

      // Add location if selected
      if (this._selectedLocation) {
        storyData.lat = this._selectedLocation.lat;
        storyData.lon = this._selectedLocation.lon;
      }

      // Check if online
      if (navigator.onLine) {
        // Online: send directly to API
        const response = await StoryApi.addStory(token, storyData);

        if (response.error === false) {
          successContainer.textContent = "Cerita berhasil diposting!";
          successContainer.classList.remove("hidden");

          // Reset form
          this._form.reset();
          this._handleRemovePhoto();
          this._cameraHelper.stopCamera();

          setTimeout(() => {
            window.location.hash = "#/home";
          }, 2000);
        } else {
          throw new Error(response.message || "Gagal memposting cerita");
        }
      } else {
        // Offline: save to IndexedDB for background sync
        await this._saveOfflineStory(storyData, token);

        successContainer.textContent =
          "Anda sedang offline. Cerita akan diposting otomatis saat online.";
        successContainer.classList.remove("hidden");

        // Reset form
        this._form.reset();
        this._handleRemovePhoto();
        this._cameraHelper.stopCamera();

        // Register sync
        if ("serviceWorker" in navigator && "sync" in self.registration) {
          const registration = await navigator.serviceWorker.ready;
          await registration.sync.register("sync-stories");
        }

        setTimeout(() => {
          window.location.hash = "#/home";
        }, 2000);
      }
    } catch (error) {
      errorContainer.textContent =
        error.message ||
        "Terjadi kesalahan saat memposting cerita. Silakan coba lagi.";
      errorContainer.style.display = "block";
      errorContainer.focus();
    } finally {
      Loading.hide();
    }
  }

  async _saveOfflineStory(storyData, token) {
    const pendingStory = {
      description: storyData.description,
      photo: storyData.photo,
      lat: storyData.lat || null,
      lon: storyData.lon || null,
      token: token,
      createdAt: new Date().toISOString(),
    };

    await DBHelper.addPendingStory(pendingStory);
    console.log("Story saved for background sync");
  }
}

export default AddStoryPresenter;
