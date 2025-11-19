class KeyboardHelper {
  static enableKeyboardNavigation() {
    // Handle keyboard navigation for interactive elements
    document.addEventListener("keydown", (e) => {
      const focusableElements = document.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );

      const focusableArray = Array.from(focusableElements);
      const currentIndex = focusableArray.indexOf(document.activeElement);

      // Tab navigation enhancement
      if (e.key === "Tab") {
        if (currentIndex === focusableArray.length - 1 && !e.shiftKey) {
          e.preventDefault();
          focusableArray[0]?.focus();
        } else if (currentIndex === 0 && e.shiftKey) {
          e.preventDefault();
          focusableArray[focusableArray.length - 1]?.focus();
        }
      }

      // Escape key to close modals/popups
      if (e.key === "Escape") {
        const modal = document.querySelector(".modal:not(.hidden)");
        if (modal) {
          const closeBtn = modal.querySelector(".close-btn, .btn-secondary");
          closeBtn?.click();
        }
      }

      // Enter/Space for card selection
      if (
        (e.key === "Enter" || e.key === " ") &&
        document.activeElement.classList.contains("story-item")
      ) {
        e.preventDefault();
        document.activeElement.click();
      }
    });

    // Add visible focus indicators
    this._addFocusStyles();
  }

  static _addFocusStyles() {
    const style = document.createElement("style");
    style.textContent = `
      :focus-visible {
        outline: 3px solid #007bff;
        outline-offset: 2px;
        border-radius: 4px;
      }

      button:focus-visible,
      a:focus-visible {
        outline: 3px solid #007bff;
        outline-offset: 2px;
      }

      .story-item:focus-visible {
        outline: 3px solid #007bff;
        outline-offset: 2px;
        box-shadow: 0 4px 12px rgba(0, 123, 255, 0.2);
      }

      input:focus-visible,
      textarea:focus-visible,
      select:focus-visible {
        outline: 3px solid #007bff;
        outline-offset: 2px;
        border-color: #007bff;
      }
    `;
    document.head.appendChild(style);
  }
}

export default KeyboardHelper;
