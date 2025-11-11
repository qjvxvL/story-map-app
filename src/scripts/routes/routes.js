import LoginPage from "../views/pages/login.js";
import RegisterPage from "../views/pages/register.js";
import HomePage from "../views/pages/home.js";
import AddStoryPage from "../views/pages/add-story.js";
import DetailPage from "../views/pages/detail.js";
import Navbar from "../views/components/navbar.js";
import LoginPresenter from "../presenter/login-presenter.js";
import RegisterPresenter from "../presenter/register-presenter.js";
import HomePresenter from "../presenter/home-presenter.js";
import AddStoryPresenter from "../presenter/add-story-presenter.js";
import DetailPresenter from "../presenter/detail-presenter.js";
import AuthHelper from "../utils/auth-helper.js";
import FavoritesPage from "../views/pages/favorites.js";
import FavoritesPresenter from "../presenter/favorites-presenter.js";

class App {
  constructor({ content, navbar }) {
    this._content = content;
    this._navbar = navbar;

    this._routes = {
      "/": LoginPage,
      "/login": LoginPage,
      "/register": RegisterPage,
      "/home": HomePage,
      "/add-story": AddStoryPage,
      "/favorites": FavoritesPage,
      "/detail/:id": DetailPage,
    };

    this._presenters = {
      "/login": LoginPresenter,
      "/register": RegisterPresenter,
      "/home": HomePresenter,
      "/add-story": AddStoryPresenter,
      "/favorites": FavoritesPresenter,
      "/detail/:id": DetailPresenter,
    };
  }

  async renderPage() {
    const url = this._parseUrl();

    // Check authentication
    if (!AuthHelper.checkAuth()) {
      return;
    }

    // Render navbar
    this._renderNavbar();

    // Find matching route
    const route = this._findRoute(url);

    if (route) {
      await this._renderRoute(route, url);
    } else {
      // Default to login page
      window.location.hash = "#/login";
    }
  }

  _parseUrl() {
    const hash = window.location.hash.slice(1).toLowerCase() || "/";
    const splitUrl = hash.split("/");

    return {
      resource: splitUrl[1] || null,
      id: splitUrl[2] || null,
      verb: splitUrl[3] || null,
    };
  }

  _findRoute(url) {
    if (url.resource === null) {
      return "/";
    }

    if (url.id === null) {
      return `/${url.resource}`;
    }

    return `/${url.resource}/:id`;
  }

  async _renderRoute(route, url) {
    const page = new this._routes[route]();

    try {
      // Apply view transition if supported
      if (document.startViewTransition) {
        await document.startViewTransition(async () => {
          this._content.innerHTML = await page.render();
          await page.afterRender();
        }).finished;
      } else {
        this._content.innerHTML = await page.render();
        await page.afterRender();
      }

      // Initialize presenter
      const PresenterClass = this._presenters[route];
      if (PresenterClass) {
        let presenter;

        if (route === "/detail/:id") {
          presenter = new PresenterClass(url.id);
        } else {
          presenter = new PresenterClass();
        }

        await presenter.init();
      }
    } catch (error) {
      console.error("Error rendering page:", error);
    }
  }

  _renderNavbar() {
    this._navbar.innerHTML = Navbar.render();
    Navbar.afterRender();
  }
}

export default App;
