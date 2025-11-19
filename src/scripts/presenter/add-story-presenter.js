import StoryApi from "../api/story-api.js";
import AuthRepository from "../data/auth-repository.js";
import CameraHelper from "../utils/camera-helper.js";
import KeyboardHelper from "../utils/keyboard-helper.js"; // ✅ TAMBAHKAN INI
import Loading from "../views/components/loading.js";
import CONFIG from "../config/config.js";
import DBHelper from "../utils/db-helper.js";
import NotificationHelper from "../utils/notification-helper.js";

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
    KeyboardHelper.enableKeyboardNavigation(); // ✅ Ini sekarang bisa dipanggil
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
      await this._handleSubmit(e); // ✅ Pass event e
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

    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!validTypes.includes(file.type)) {
      document.querySelector("#photo-error").textContent =
        "Format file harus JPG, JPEG, atau PNG";
      e.target.value = "";
      return;
    }

    // Validate file size (max 1MB)
    if (file.size > 1000000) {
      document.querySelector("#photo-error").textContent =
        "Ukuran file maksimal 1MB";
      e.target.value = "";
      return;
    }

    // Save to instance variable
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

  async _handleSubmit(e) {
    e.preventDefault();
    Loading.show();

    try {
      const description = document.querySelector("#description").value.trim();
      const photo =
        this._photoFile || document.querySelector("#photo").files[0];
      const lat = this._selectedLocation?.lat;
      const lon = this._selectedLocation?.lon;

      // Validation
      if (!description) {
        throw new Error("Deskripsi wajib diisi");
      }

      if (!photo) {
        throw new Error("Foto wajib dipilih");
      }

      if (photo.size > 1000000) {
        throw new Error("Ukuran foto maksimal 1MB");
      }

      // Create FormData
      const formData = new FormData();
      formData.append("description", description);
      formData.append("photo", photo);

      if (lat && lon) {
        formData.append("lat", lat);
        formData.append("lon", lon);
      }

      // Check if online
      if (!navigator.onLine) {
        // Save to IndexedDB for background sync
        const token = AuthRepository.getToken();
        await DBHelper.addPendingStory(
          {
            description,
            photo,
            lat,
            lon,
            formData,
          },
          token
        );

        // Register sync
        if ("serviceWorker" in navigator && "SyncManager" in window) {
          const registration = await navigator.serviceWorker.ready;
          await registration.sync.register("sync-stories");
          console.log("Background sync registered");
        }

        Loading.hide();
        alert(
          "Anda sedang offline. Story akan dikirim otomatis saat online kembali."
        );
        window.location.hash = "#/home";
        return;
      }

      // If online, send directly
      const token = AuthRepository.getToken();
      const response = await StoryApi.addStory(token, {
        // ✅ Token dulu, object kedua
        description,
        photo,
        lat,
        lon,
      });

      if (!response.error) {
        Loading.hide();

        // Show notification
        NotificationHelper.showLocalNotification(
          "Story Berhasil Ditambahkan!",
          description.substring(0, 50) + "...",
          {
            icon: URL.createObjectURL(photo),
          }
        );

        // Trigger sync for any pending stories
        this._syncPendingStories();

        alert("Story berhasil ditambahkan!");
        window.location.hash = "#/home";
      } else {
        throw new Error(response.message || "Gagal menambahkan story");
      }
    } catch (error) {
      Loading.hide();
      console.error("Error adding story:", error);

      const errorBox = document.querySelector("#form-error");
      if (errorBox) {
        errorBox.textContent =
          error.message || "Terjadi kesalahan saat menambahkan story";
        errorBox.style.display = "block";
      } else {
        alert(error.message || "Terjadi kesalahan saat menambahkan story");
      }
    }
  }

  async _syncPendingStories() {
    try {
      const pendingStories = await DBHelper.getAllPendingStories();

      if (pendingStories.length === 0) {
        return;
      }

      console.log("Syncing pending stories:", pendingStories.length);

      for (const story of pendingStories) {
        try {
          const formData = new FormData();
          formData.append("description", story.description);
          formData.append("photo", story.photo);

          if (story.lat && story.lon) {
            formData.append("lat", story.lat);
            formData.append("lon", story.lon);
          }

          const response = await fetch(`${CONFIG.BASE_URL}/stories`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${story.token}`,
            },
            body: formData,
          });

          if (response.ok) {
            await DBHelper.removePendingStory(story.id);
            console.log("Pending story synced:", story.id);
          }
        } catch (error) {
          console.error("Error syncing story:", error);
        }
      }
    } catch (error) {
      console.error("Error in sync pending stories:", error);
    }
  }
}

export default AddStoryPresenter;
