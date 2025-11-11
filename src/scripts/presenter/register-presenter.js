import StoryApi from "../api/story-api.js";
import Loading from "../views/components/loading.js";

class RegisterPresenter {
  constructor() {
    this._form = null;
    this._nameInput = null;
    this._emailInput = null;
    this._passwordInput = null;
    this._errorContainer = null;
  }

  async init() {
    this._form = document.querySelector("#register-form");
    this._nameInput = document.querySelector("#name");
    this._emailInput = document.querySelector("#email");
    this._passwordInput = document.querySelector("#password");
    this._errorContainer = document.querySelector("#form-error");

    this._attachEventListeners();
  }

  _attachEventListeners() {
    this._form.addEventListener("submit", async (e) => {
      e.preventDefault();
      await this._handleRegister();
    });

    // Real-time validation
    this._nameInput.addEventListener("blur", () => {
      this._validateName();
    });

    this._emailInput.addEventListener("blur", () => {
      this._validateEmail();
    });

    this._passwordInput.addEventListener("blur", () => {
      this._validatePassword();
    });

    // Clear errors on input
    this._nameInput.addEventListener("input", () => {
      this._clearFieldError("name");
    });

    this._emailInput.addEventListener("input", () => {
      this._clearFieldError("email");
    });

    this._passwordInput.addEventListener("input", () => {
      this._clearFieldError("password");
    });
  }

  _validateName() {
    const name = this._nameInput.value.trim();
    const nameError = document.querySelector("#name-error");

    if (!name) {
      nameError.textContent = "Nama tidak boleh kosong";
      this._nameInput.setAttribute("aria-invalid", "true");
      return false;
    }

    if (name.length < 3) {
      nameError.textContent = "Nama minimal 3 karakter";
      this._nameInput.setAttribute("aria-invalid", "true");
      return false;
    }

    nameError.textContent = "";
    this._nameInput.setAttribute("aria-invalid", "false");
    return true;
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

  async _handleRegister() {
    // Clear previous errors
    this._errorContainer.textContent = "";
    this._errorContainer.style.display = "none";

    // Validate all fields
    const isNameValid = this._validateName();
    const isEmailValid = this._validateEmail();
    const isPasswordValid = this._validatePassword();

    if (!isNameValid || !isEmailValid || !isPasswordValid) {
      return;
    }

    const name = this._nameInput.value.trim();
    const email = this._emailInput.value.trim();
    const password = this._passwordInput.value;

    try {
      Loading.show();

      const response = await StoryApi.register({ name, email, password });

      if (response.error === false) {
        alert("Registrasi berhasil! Silakan login.");
        window.location.hash = "#/login";
      } else {
        throw new Error(response.message || "Registrasi gagal");
      }
    } catch (error) {
      this._errorContainer.textContent =
        error.message ||
        "Terjadi kesalahan saat registrasi. Silakan coba lagi.";
      this._errorContainer.style.display = "block";
      this._errorContainer.focus();
    } finally {
      Loading.hide();
    }
  }
}

export default RegisterPresenter;
