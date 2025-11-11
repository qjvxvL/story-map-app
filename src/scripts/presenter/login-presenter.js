import StoryApi from "../api/story-api.js";
import AuthRepository from "../data/auth-repository.js";
import Loading from "../views/components/loading.js";

class LoginPresenter {
  constructor() {
    this._form = null;
    this._emailInput = null;
    this._passwordInput = null;
    this._errorContainer = null;
  }

  async init() {
    this._form = document.querySelector("#login-form");
    this._emailInput = document.querySelector("#email");
    this._passwordInput = document.querySelector("#password");
    this._errorContainer = document.querySelector("#form-error");

    this._attachEventListeners();
  }

  _attachEventListeners() {
    this._form.addEventListener("submit", async (e) => {
      e.preventDefault();
      await this._handleLogin();
    });

    // Real-time validation
    this._emailInput.addEventListener("blur", () => {
      this._validateEmail();
    });

    this._passwordInput.addEventListener("blur", () => {
      this._validatePassword();
    });

    // Clear errors on input
    this._emailInput.addEventListener("input", () => {
      this._clearFieldError("email");
    });

    this._passwordInput.addEventListener("input", () => {
      this._clearFieldError("password");
    });
  }

  _validateEmail() {
    const email = this._emailInput.value.trim();
    const emailError = document.querySelector("#email-error");

    if (!email) {
      emailError.textContent = "Email tidak boleh kosong";
      this._emailInput.setAttribute("aria-invalid", "true");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      emailError.textContent = "Format email tidak valid";
      this._emailInput.setAttribute("aria-invalid", "true");
      return false;
    }

    emailError.textContent = "";
    this._emailInput.setAttribute("aria-invalid", "false");
    return true;
  }

  _validatePassword() {
    const password = this._passwordInput.value;
    const passwordError = document.querySelector("#password-error");

    if (!password) {
      passwordError.textContent = "Password tidak boleh kosong";
      this._passwordInput.setAttribute("aria-invalid", "true");
      return false;
    }

    if (password.length < 8) {
      passwordError.textContent = "Password minimal 8 karakter";
      this._passwordInput.setAttribute("aria-invalid", "true");
      return false;
    }

    passwordError.textContent = "";
    this._passwordInput.setAttribute("aria-invalid", "false");
    return true;
  }

  _clearFieldError(fieldName) {
    const errorElement = document.querySelector(`#${fieldName}-error`);
    if (errorElement) {
      errorElement.textContent = "";
    }
    const inputElement = document.querySelector(`#${fieldName}`);
    if (inputElement) {
      inputElement.setAttribute("aria-invalid", "false");
    }
  }

  async _handleLogin() {
    // Clear previous errors
    this._errorContainer.textContent = "";
    this._errorContainer.style.display = "none";

    // Validate all fields
    const isEmailValid = this._validateEmail();
    const isPasswordValid = this._validatePassword();

    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    const email = this._emailInput.value.trim();
    const password = this._passwordInput.value;

    try {
      Loading.show();

      const response = await StoryApi.login({ email, password });

      if (response.error === false && response.loginResult) {
        // Save authentication data
        AuthRepository.setToken(response.loginResult.token);
        AuthRepository.setUser({
          userId: response.loginResult.userId,
          name: response.loginResult.name,
        });

        // Redirect to home
        window.location.hash = "#/home";
      } else {
        throw new Error(response.message || "Login gagal");
      }
    } catch (error) {
      this._errorContainer.textContent =
        error.message || "Terjadi kesalahan saat login. Silakan coba lagi.";
      this._errorContainer.style.display = "block";
      this._errorContainer.focus();
    } finally {
      Loading.hide();
    }
  }
}

export default LoginPresenter;
