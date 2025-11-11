class LoginPage {
  async render() {
    return `
      <section class="auth-section">
        <div class="auth-container">
          <div class="auth-header">
            <h2>Login to Story Map</h2>
            <p>Masuk untuk berbagi cerita Anda</p>
          </div>
          
          <form id="login-form" class="auth-form" novalidate>
            <div class="form-group">
              <label for="email" class="form-label">Email</label>
              <input 
                type="email" 
                id="email" 
                name="email" 
                class="form-input" 
                placeholder="email@example.com"
                required
                aria-required="true"
                aria-describedby="email-error"
                autocomplete="email"
              />
              <span id="email-error" class="error-message" role="alert"></span>
            </div>

            <div class="form-group">
              <label for="password" class="form-label">Password</label>
              <input 
                type="password" 
                id="password" 
                name="password" 
                class="form-input" 
                placeholder="Min. 8 karakter"
                required
                aria-required="true"
                aria-describedby="password-error"
                autocomplete="current-password"
              />
              <span id="password-error" class="error-message" role="alert"></span>
            </div>

            <div id="form-error" class="error-message error-box" role="alert"></div>

            <button type="submit" class="btn btn-primary" id="login-btn">
              Login
            </button>
          </form>

          <div class="auth-footer">
            <p>Belum punya akun? <a href="#/register" class="auth-link">Daftar di sini</a></p>
          </div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    // Presenter will handle this
  }
}

export default LoginPage;
