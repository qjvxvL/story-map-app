class Loading {
  static show() {
    const loading = document.querySelector("#loading");
    if (loading) {
      loading.classList.remove("hidden");
    }
  }

  static hide() {
    const loading = document.querySelector("#loading");
    if (loading) {
      loading.classList.add("hidden");
    }
  }
}

export default Loading;
