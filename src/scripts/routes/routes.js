import LoginPage from "../views/pages/login.js";
import RegisterPage from "../views/pages/register.js";
import HomePage from "../views/pages/home.js";
import AddStoryPage from "../views/pages/add-story.js";
import DetailPage from "../views/pages/detail.js";
import FavoritesPage from "../views/pages/favorites.js";

import LoginPresenter from "../presenter/login-presenter.js";
import RegisterPresenter from "../presenter/register-presenter.js";
import HomePresenter from "../presenter/home-presenter.js";
import AddStoryPresenter from "../presenter/add-story-presenter.js";
import DetailPresenter from "../presenter/detail-presenter.js";
import FavoritesPresenter from "../presenter/favorites-presenter.js";

const routes = {
  "/": {
    page: new LoginPage(),
    presenter: LoginPresenter,
  },
  "/login": {
    page: new LoginPage(),
    presenter: LoginPresenter,
  },
  "/register": {
    page: new RegisterPage(),
    presenter: RegisterPresenter,
  },
  "/home": {
    page: new HomePage(),
    presenter: HomePresenter,
  },
  "/add": {
    page: new AddStoryPage(),
    presenter: AddStoryPresenter,
  },
  "/detail/:id": {
    page: new DetailPage(),
    presenter: DetailPresenter, // ✅ Will be initialized with storyId in app.js
  },
  "/favorites": {
    page: new FavoritesPage(),
    presenter: FavoritesPresenter,
  },
};

export default routes;
