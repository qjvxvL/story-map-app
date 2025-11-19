class AuthRepository {
  static setToken(token) {
    localStorage.setItem("token", token);
  }

  static getToken() {
    return localStorage.getItem("token");
  }

  static setUser(user) {
    localStorage.setItem("user", JSON.stringify(user));
  }

  static getUser() {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  }

  // ✅ ADD: getUsername method
  static getUsername() {
    const user = this.getUser();
    return user ? user.name : null;
  }

  // ✅ ADD: logout method (alias for clearAuth)
  static logout() {
    this.clearAuth();
  }

  static clearAuth() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }

  static isAuthenticated() {
    return !!this.getToken();
  }

  static isLoggedIn() {
    return this.isAuthenticated();
  }
}

export default AuthRepository;
