import routes from "../routes/routes.js";
import { getToken } from "../utils/auth-helper.js";

class App {
  constructor({ content }) {
    this._content = content;
    this._initialAppShell();
  }

  _initialAppShell() {
    const appBar = document.querySelector("app-bar");
    if (appBar) {
      appBar.addEventListener("logout", () => {
        window.location.hash = "#/login";
      });
    }
  }

  async renderPage() {
    const url = window.location.hash.slice(1).toLowerCase() || "/";
    const page = routes[url];

    if (!document.startViewTransition) {
      await this._renderPageContent(page);
      return;
    }

    document.startViewTransition(async () => {
      await this._renderPageContent(page);
    });
  }

  async _renderPageContent(page) {
    const token = getToken();
    const publicPages = ["/", "/login", "/register"];

    if (
      !token &&
      !publicPages.includes(window.location.hash.slice(1).toLowerCase() || "/")
    ) {
      window.location.hash = "#/login";
      return;
    }

    if (
      token &&
      publicPages.includes(window.location.hash.slice(1).toLowerCase() || "/")
    ) {
      window.location.hash = "#/home";
      return;
    }

    this._content.innerHTML = "";
    this._content.appendChild(await page.render());
    await page.afterRender();
  }
}

export default App;
