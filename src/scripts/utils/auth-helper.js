import AuthRepository from "../data/auth-repository.js";

class AuthHelper {
  static checkAuth() {
    const isAuthenticated = AuthRepository.isAuthenticated();
    const currentHash = window.location.hash;

    if (
      !isAuthenticated &&
      currentHash !== "#/login" &&
      currentHash !== "#/register"
    ) {
      window.location.hash = "#/login";
      return false;
    }

    if (
      isAuthenticated &&
      (currentHash === "#/login" || currentHash === "#/register")
    ) {
      window.location.hash = "#/home";
      return false;
    }

    return true;
  }

  static logout() {
    AuthRepository.clearAuth();
    window.location.hash = "#/login";
  }
}

export default AuthHelper;
