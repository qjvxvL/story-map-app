class HomePage {
  async render() {
    return `
      <section class="home-section">
        <div class="home-header">
          <h2>Explore Stories</h2>
          <p>Temukan cerita-cerita menarik dari berbagai lokasi</p>
        </div>

        <div class="filter-container">
          <label for="location-filter" class="filter-label">Filter Lokasi:</label>
          <select id="location-filter" class="filter-select" aria-label="Filter stories by location">
            <option value="all">Semua Cerita</option>
            <option value="with-location">Dengan Lokasi</option>
            <option value="no-location">Tanpa Lokasi</option>
          </select>
        </div>

        <div class="home-content">
          <div class="stories-section">
            <h3 class="section-title">Daftar Cerita</h3>
            <div id="stories-list" class="stories-list" role="list">
              <!-- Stories will be loaded here -->
            </div>
          </div>

          <div class="map-section">
            <h3 class="section-title">Peta Lokasi Cerita</h3>
            <div id="map" class="map-container" role="application" aria-label="Interactive map showing story locations">
              <!-- Map will be initialized here -->
            </div>
          </div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    // Presenter will handle this
  }
}

export default HomePage;
