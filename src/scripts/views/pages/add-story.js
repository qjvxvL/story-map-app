class AddStoryPage {
  async render() {
    return `
      <section class="add-story-section">
        <div class="add-story-container">
          <div class="add-story-header">
            <h2>Tambah Cerita Baru</h2>
            <p>Bagikan cerita Anda dengan dunia</p>
          </div>

          <form id="add-story-form" class="add-story-form" novalidate>
            <div class="form-group">
              <label for="description" class="form-label">Deskripsi Cerita</label>
              <textarea 
                id="description" 
                name="description" 
                class="form-textarea" 
                placeholder="Ceritakan pengalaman Anda..."
                required
                aria-required="true"
                aria-describedby="description-error"
                rows="5"
              ></textarea>
              <span id="description-error" class="error-message" role="alert"></span>
            </div>

            <div class="form-group">
              <label class="form-label">Foto Cerita</label>
              
              <div class="photo-options">
                <div class="photo-option">
                  <input 
                    type="radio" 
                    id="photo-upload" 
                    name="photo-method" 
                    value="upload" 
                    checked
                    aria-label="Upload photo from file"
                  />
                  <label for="photo-upload">Upload dari File</label>
                </div>
                
                <div class="photo-option">
                  <input 
                    type="radio" 
                    id="photo-camera" 
                    name="photo-method" 
                    value="camera"
                    aria-label="Take photo with camera"
                  />
                  <label for="photo-camera">Ambil dengan Kamera</label>
                </div>
              </div>

              <div id="upload-section" class="upload-section">
                <input 
                  type="file" 
                  id="photo" 
                  name="photo" 
                  class="form-file" 
                  accept="image/*"
                  aria-describedby="photo-error"
                />
                <label for="photo" class="file-label">
                  <span class="file-icon">📁</span>
                  <span class="file-text">Pilih File Gambar</span>
                </label>
                <div id="preview-container" class="preview-container hidden">
                  <img id="photo-preview" src="" alt="Preview foto yang akan diupload" class="photo-preview" />
                  <button type="button" id="remove-photo" class="btn-remove" aria-label="Remove selected photo">
                    ✕ Hapus
                  </button>
                </div>
              </div>

              <div id="camera-section" class="camera-section hidden">
                <div class="camera-container">
                  <video id="camera-video" autoplay playsinline class="camera-video" aria-label="Camera preview"></video>
                  <canvas id="camera-canvas" class="camera-canvas hidden"></canvas>
                  <div class="camera-controls">
                    <button type="button" id="start-camera" class="btn btn-secondary">
                      📷 Aktifkan Kamera
                    </button>
                    <button type="button" id="capture-photo" class="btn btn-primary hidden">
                      📸 Ambil Foto
                    </button>
                    <button type="button" id="retake-photo" class="btn btn-secondary hidden">
                      🔄 Ulangi
                    </button>
                  </div>
                </div>
              </div>

              <span id="photo-error" class="error-message" role="alert"></span>
              <small class="form-help">Format: JPG, PNG, atau JPEG. Maksimal 1MB.</small>
            </div>

            <div class="form-group">
              <label class="form-label">Lokasi Cerita (Opsional)</label>
              <p class="form-help">Klik pada peta untuk memilih lokasi</p>
              
              <div id="location-map" class="location-map" role="application" aria-label="Interactive map for selecting story location">
                <!-- Map will be initialized here -->
              </div>

              <div class="location-info">
                <div class="location-item">
                  <label for="latitude" class="location-label">Latitude:</label>
                  <input 
                    type="text" 
                    id="latitude" 
                    name="latitude" 
                    class="location-input" 
                    readonly
                    aria-label="Selected latitude"
                  />
                </div>
                <div class="location-item">
                  <label for="longitude" class="location-label">Longitude:</label>
                  <input 
                    type="text" 
                    id="longitude" 
                    name="longitude" 
                    class="location-input" 
                    readonly
                    aria-label="Selected longitude"
                  />
                </div>
              </div>
            </div>

            <div id="form-error" class="error-message error-box" role="alert"></div>
            <div id="form-success" class="success-message success-box hidden" role="alert"></div>

            <div class="form-actions">
              <button type="button" id="cancel-btn" class="btn btn-secondary">
                Batal
              </button>
              <button type="submit" class="btn btn-primary" id="submit-btn">
                Posting Cerita
              </button>
            </div>
          </form>
        </div>
      </section>
    `;
  }

  async afterRender() {
    // Presenter will handle this
  }
}

export default AddStoryPage;
