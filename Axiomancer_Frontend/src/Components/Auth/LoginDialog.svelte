<script lang="ts">
  import { authStore, settingsStore } from "@/Store";
  import type { LoginRequest, RegisterRequest } from "@/Types";
  import { getTranslations, type LanguageCode } from "@/Function";

  // Reactive translations
  let t = $derived(getTranslations(settingsStore.language as LanguageCode));

  // Custom transition combining fade and scale
  function dialogTransition(node: Element, options: { duration?: number; start?: number } = {}) {
    const { duration = 100, start = 0.8 } = options;
    
    return {
      duration,
      css: (t: number, u: number) => `
        opacity: ${t};
        transform: scale(${start + (1 - start) * t});
      `
    };
  }

  let isOpen = $state(false);

  export function open() {
    isLogin = true;
    isOpen = true;
  }

  // New method to open dialog in login mode with pre-filled username
  export function openLoginWithUsername(username: string) {
    isLogin = true;
    loginData.username = username;
    isOpen = true;
  }

  function close() {
    isOpen = false;
  }

  let isLogin = $state(true);
  let isLoading = $state(false);
  let error = $state<string | null>(null);

  let loginData = $state<LoginRequest>({
    username: "",
    password: "",
  });

  let registerData = $state<RegisterRequest>({
    username: "",
    password: "",
    email: "",
    firstname: "",
    lastname: "",
    nickname: "",
  });

  // Reset form data when user logs out
  $effect(() => {
    // This effect runs when isAuthenticated changes
    if (!authStore.isAuthenticated) {
      // Reset login data
      loginData = {
        username: "",
        password: "",
      };

      // Reset register data
      registerData = {
        username: "",
        password: "",
        email: "",
        firstname: "",
        lastname: "",
        nickname: "",
      };

      // Reset validation errors
      clearValidationErrors();

      // Reset error message
      error = null;
    }
  });

  // Real-time validation state
  let validationErrors = $state({
    username: "",
    password: "",
    email: "",
    confirmPassword: "",
  });
  
  // Confirm password field state
  let confirmPassword = $state("");

  // Real-time validation function
  function validateField(field: string, value: string) {
    if (field === "username") {
      if (!value) {
        validationErrors.username = "Username is required";
      } else if (value.length < 3) {
        validationErrors.username = "Username must be at least 3 characters";
      } else {
        validationErrors.username = "";
      }
    } else if (field === "password") {
      if (!value) {
        validationErrors.password = "Password is required";
      } else if (value.length < 4) {
        validationErrors.password = "Password must be at least 4 characters";
      } else {
        validationErrors.password = "";
      }
      // Also validate confirm password when password changes
      if (confirmPassword) {
        validateField("confirmPassword", confirmPassword);
      }
    } else if (field === "email") {
      if (!value) {
        validationErrors.email = "Email is required";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        validationErrors.email = "Please enter a valid email";
      } else {
        validationErrors.email = "";
      }
    } else if (field === "confirmPassword") {
      if (!value) {
        validationErrors.confirmPassword = "Please confirm your password";
      } else if (value !== registerData.password) {
        validationErrors.confirmPassword = "Passwords do not match";
      } else {
        validationErrors.confirmPassword = "";
      }
    }
  }

  // Event handlers for validation
  function handleUsernameInput(event: Event) {
    const target = event.target as HTMLInputElement;
    validateField('username', target.value);
  }

  function handlePasswordInput(event: Event) {
    const target = event.target as HTMLInputElement;
    validateField('password', target.value);
  }

  function handleEmailInput(event: Event) {
    const target = event.target as HTMLInputElement;
    validateField('email', target.value);
  }

  function handleConfirmPasswordInput(event: Event) {
    const target = event.target as HTMLInputElement;
    confirmPassword = target.value;
    validateField('confirmPassword', target.value);
  }

  // Clear validation errors when switching modes
  function clearValidationErrors() {
    validationErrors = {
      username: "",
      password: "",
      email: "",
      confirmPassword: "",
    };
    confirmPassword = "";
  }

  function switchMode() {
    isLogin = !isLogin;
    error = null;
    clearValidationErrors();
  }

  async function handleLogin() {
    if (!loginData.username || !loginData.password) {
      error = "Please fill in all fields";
      return;
    }

    isLoading = true;
    error = null;

    try {
      const result = await authStore.login(loginData);
      if (result.success) {
        (window as any).notification.success("Login Successful", "Welcome back to Axiomancer!");
        close();
      } else {
        error = result.error || "Login failed";
      }
    } catch (e) {
      error = e instanceof Error ? e.message : "Login failed";
    } finally {
      isLoading = false;
    }
  }

  // Check if register form is valid
  function isRegisterFormValid(): boolean {
    return (
      registerData.username.length >= 3 &&
      registerData.password.length >= 4 &&
      confirmPassword.length >= 4 &&
      registerData.password === confirmPassword &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerData.email) &&
      !validationErrors.username &&
      !validationErrors.password &&
      !validationErrors.email &&
      !validationErrors.confirmPassword
    );
  }

  async function handleRegister() {
    // Client-side validation matching backend rules
    if (!registerData.username || !registerData.password || !registerData.email || !confirmPassword) {
      error = "Please fill in all required fields";
      return;
    }

    if (registerData.username.length < 3) {
      error = "Username must be at least 3 characters long";
      return;
    }

    if (registerData.password.length < 4) {
      error = "Password must be at least 4 characters long";
      return;
    }

    if (registerData.password !== confirmPassword) {
      error = "Passwords do not match";
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerData.email)) {
      error = "Please enter a valid email address";
      return;
    }

    isLoading = true;
    error = null;

    try {
      const result = await authStore.register(registerData);
      if (result.success) {
        (window as any).notification.success("Registration Successful", "Welcome to Axiomancer! Your account has been created.");
        
        // Auto-switch to login mode and fill username
        isLogin = true;
        loginData.username = registerData.username;
        loginData.password = ""; // Clear password for security
        
        // Clear register form data
        registerData = {
          username: "",
          password: "",
          email: "",
          firstname: "",
          lastname: "",
          nickname: "",
        };
        
        // Clear validation errors
        clearValidationErrors();
        
        // Show additional notification to guide user
        setTimeout(() => {
          (window as any).notification.info("Please Login", "Enter your password to complete login");
        }, 500);
        
      } else {
        error = result.error || "Registration failed";
      }
    } catch (e) {
      error = e instanceof Error ? e.message : "Registration failed";
    } finally {
      isLoading = false;
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (!isOpen) return;

    const target = event.target as HTMLElement;
    const isInputFocused = target.tagName === "INPUT";

    if (event.key === "Enter" && isInputFocused) {
      if (isLogin) {
        handleLogin();
      } else {
        handleRegister();
      }
    } else if (event.key === "Escape") {
      close();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
  <div class="dialog-backdrop" onmousedown={close} onkeydown={(e) => e.key === 'Escape' && close()} role="button" tabindex="0" aria-label="Close login dialog">
    <div class="dialog" onclick={(e) => e.stopPropagation()} onmousedown={(e) => e.stopPropagation()} onkeydown={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="dialog-title" tabindex="-1" transition:dialogTransition={{ duration: 100, start: 0.8 }}>
      <div class="dialog-header">
        <h2 id="dialog-title">{isLogin ? "Login" : "Register"}</h2>
        <button class="close-btn" onclick={close} aria-label="Close dialog">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div class="dialog-body">
        {#if isLogin}
          <!-- Login Form -->
          <div class="form-group">
            <label for="login-username">Username</label>
            <input
              id="login-username"
              type="text"
              bind:value={loginData.username}
              placeholder="Enter your username"
              disabled={isLoading}
              onkeydown={(e) => e.key === 'Enter' && handleLogin()}
            />
          </div>

          <div class="form-group">
            <label for="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              bind:value={loginData.password}
              placeholder="Enter your password"
              disabled={isLoading}
              onkeydown={(e) => e.key === 'Enter' && handleLogin()}
            />
          </div>
        {:else}
          <!-- Register Form -->
          <div class="form-group">
            <label for="register-username">Username *</label>
            <input
              id="register-username"
              type="text"
              bind:value={registerData.username}
              oninput={handleUsernameInput}
              placeholder="Choose a username"
              disabled={isLoading}
              class:error={validationErrors.username}
            />
            {#if validationErrors.username}
              <div class="validation-error">{validationErrors.username}</div>
            {:else}
              <div class="password-hint">Minimum 3 characters</div>
            {/if}
          </div>

          <div class="form-group">
            <label for="register-email">Email *</label>
            <input
              id="register-email"
              type="email"
              bind:value={registerData.email}
              oninput={handleEmailInput}
              placeholder="Enter your email"
              disabled={isLoading}
              class:error={validationErrors.email}
            />
            {#if validationErrors.email}
              <div class="validation-error">{validationErrors.email}</div>
            {/if}
          </div>

          <div class="form-group">
            <label for="register-password">Password *</label>
            <input
              id="register-password"
              type="password"
              bind:value={registerData.password}
              oninput={handlePasswordInput}
              placeholder="Choose a password"
              disabled={isLoading}
              class:error={validationErrors.password}
            />
            {#if validationErrors.password}
              <div class="validation-error">{validationErrors.password}</div>
            {:else}
              <div class="password-hint">Minimum 4 characters</div>
            {/if}
          </div>

          <div class="form-group">
            <label for="register-confirm-password">Confirm Password *</label>
            <input
              id="register-confirm-password"
              type="password"
              value={confirmPassword}
              oninput={handleConfirmPasswordInput}
              onkeydown={(e) => e.key === 'Enter' && isRegisterFormValid() && handleRegister()}
              placeholder="Confirm your password"
              disabled={isLoading}
              class:error={validationErrors.confirmPassword}
            />
            {#if validationErrors.confirmPassword}
              <div class="validation-error">{validationErrors.confirmPassword}</div>
            {/if}
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="register-firstname">First Name</label>
              <input
                id="register-firstname"
                type="text"
                bind:value={registerData.firstname}
                placeholder="First name"
                disabled={isLoading}
              />
            </div>

            <div class="form-group">
              <label for="register-lastname">Last Name</label>
              <input
                id="register-lastname"
                type="text"
                bind:value={registerData.lastname}
                placeholder="Last name"
                disabled={isLoading}
              />
            </div>
          </div>

          <div class="form-group">
            <label for="register-nickname">Nickname</label>
            <input
              id="register-nickname"
              type="text"
              bind:value={registerData.nickname}
              placeholder="Display name"
              disabled={isLoading}
            />
          </div>
        {/if}

        {#if error}
          <div class="error-message">
            {error}
          </div>
        {/if}
      </div>

      <div class="dialog-footer">
        <button
          class="secondary-btn"
          onclick={switchMode}
          disabled={isLoading}
        >
          {isLogin ? "Need an account?" : "Already have an account?"}
        </button>

        <button
          class="primary-btn"
          onclick={isLogin ? handleLogin : handleRegister}
          disabled={isLoading || (!isLogin && !isRegisterFormValid())}
        >
          {#if isLoading}
            <svg class="spinner" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
            </svg>
          {/if}
          {isLogin ? "Login" : "Register"}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .dialog-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .dialog {
    background: var(--bg-primary, #1a1a1a);
    border: 1px solid var(--border-color, #2d2d2d);
    border-radius: 12px;
    width: 90%;
    max-width: 400px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
    transform-origin: center;
  }

  .dialog-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px 16px;
    border-bottom: 1px solid var(--border-color, #2d2d2d);
  }

  .dialog-header h2 {
    margin: 0;
    color: var(--text-primary, #fff);
    font-size: 20px;
    font-weight: 600;
  }

  .close-btn {
    background: none;
    border: none;
    color: var(--text-secondary, #888);
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: all 0.2s;
  }

  .close-btn:hover {
    background: var(--hover-bg, #2d2d2d);
    color: var(--text-primary, #fff);
  }

  .dialog-body {
    padding: 24px;
  }

  .form-group {
    margin-bottom: 16px;
  }

  .form-row {
    display: flex;
    gap: 12px;
  }

  .form-row .form-group {
    flex: 1;
  }

  .form-group label {
    display: block;
    margin-bottom: 6px;
    color: var(--text-primary, #fff);
    font-size: 14px;
    font-weight: 500;
  }

  .form-group input {
    width: 100%;
    padding: 10px 12px;
    background: var(--input-bg, #2d2d2d);
    border: 1px solid var(--border-color, #3d3d3d);
    border-radius: 6px;
    color: var(--text-primary, #fff);
    font-size: 14px;
    transition: border-color 0.2s;
  }

  .form-group input:focus {
    outline: none;
    border-color: var(--primary-color, #6366f1);
  }

  .form-group input.error {
    border-color: var(--error-border, #ef4444);
  }

  .form-group input:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .validation-error {
    margin-top: 4px;
    font-size: 12px;
    color: var(--error-border, #ef4444);
    font-weight: 500;
  }

  .password-hint {
    margin-top: 4px;
    font-size: 12px;
    color: var(--text-secondary, #888);
    font-style: italic;
  }

  .error-message {
    margin-top: 12px;
    padding: 10px 12px;
    background: var(--error-bg, #dc2626);
    border: 1px solid var(--error-border, #ef4444);
    border-radius: 6px;
    color: white;
    font-size: 14px;
  }

  .dialog-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 24px 24px;
    border-top: 1px solid var(--border-color, #2d2d2d);
    gap: 12px;
  }

  .secondary-btn {
    background: none;
    border: none;
    color: var(--text-secondary, #888);
    cursor: pointer;
    font-size: 14px;
    text-decoration: underline;
    transition: color 0.2s;
  }

  .secondary-btn:hover {
    color: var(--text-primary, #fff);
  }

  .secondary-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .primary-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    background: var(--primary-color, #6366f1);
    border: 1px solid var(--primary-color, #6366f1);
    border-radius: 6px;
    color: white;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s;
  }

  .primary-btn:hover:not(:disabled) {
    background: var(--primary-color-hover, #5855eb);
    border-color: var(--primary-color-hover, #5855eb);
  }

  .primary-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .spinner {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  /* Mobile responsiveness */
  @media (max-width: 480px) {
    .dialog {
      width: 95%;
      margin: 20px;
    }

    .form-row {
      flex-direction: column;
      gap: 16px;
    }
  }
</style>