class FavoritesPage {
  async render() {
    return `
      <section class="favorites-section">
        <div class="favorites-container">
          <div class="favorites-header">
            <h2>Cerita Favorit</h2>
            <p>Kumpulan cerita yang telah Anda simpan</p>
          </div>

          <div class="filter-container">
            <label for="favorite-filter" class="filter-label">Filter:</label>
            <select id="favorite-filter" class="filter-select">
              <option value="all">Semua Cerita</option>
              <option value="with-location">Dengan Lokasi</option>
              <option value="no-location">Tanpa Lokasi</option>
            </select>

            <label for="favorite-sort" class="filter-label" style="margin-left: 1rem;">Urutkan:</label>
            <select id="favorite-sort" class="filter-select">
              <option value="newest">Terbaru Ditambahkan</option>
              <option value="oldest">Terlama Ditambahkan</option>
              <option value="name-asc">Nama (A-Z)</option>
              <option value="name-desc">Nama (Z-A)</option>
            </select>

            <div style="margin-left: auto;">
              <input 
                type="search" 
                id="favorite-search" 
                class="form-input" 
                placeholder="Cari cerita favorit..."
                aria-label="Search favorites"
              />
            </div>
          </div>

          <div id="favorites-list" class="favorites-list">
            <!-- Favorites will be loaded here -->
          </div>

          <div id="empty-state" class="empty-state hidden">
            <p>Belum ada cerita favorit.</p>
            <a href="#/home" class="btn btn-primary">Jelajahi Cerita</a>
          </div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    // Presenter will handle this
  }
}

export default FavoritesPage;
