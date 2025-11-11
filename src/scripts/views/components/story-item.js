class StoryItem {
  static render(story) {
    return `
      <article class="story-item" data-story-id="${
        story.id
      }" tabindex="0" role="article">
        <img 
          src="${story.photoUrl}" 
          alt="Story photo by ${story.name}"
          class="story-image"
          loading="lazy"
        />
        <div class="story-content">
          <h3 class="story-name">${story.name}</h3>
          <p class="story-description">${this._truncateText(
            story.description,
            100
          )}</p>
          <div class="story-meta">
            <time datetime="${story.createdAt}" class="story-date">
              ${this._formatDate(story.createdAt)}
            </time>
            ${
              story.lat && story.lon
                ? `<span class="story-location" aria-label="Story location">📍 ${story.lat.toFixed(
                    4
                  )}, ${story.lon.toFixed(4)}</span>`
                : ""
            }
          </div>
        </div>
      </article>
    `;
  }

  static _truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  }

  static _formatDate(dateString) {
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

export default StoryItem;
