class DetailPage {
  async render() {
    return `
      <section class="detail-section">
        <div class="detail-container">
          <div id="story-detail" class="story-detail">
            <!-- Story detail will be loaded here -->
          </div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    // Presenter will handle this
  }
}

export default DetailPage;
