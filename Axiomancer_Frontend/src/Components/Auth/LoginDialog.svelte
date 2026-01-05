<script lang="ts">
  import { authStore } from "../../Store";
  import type { LoginRequest, RegisterRequest } from "../../Types";

  let { open = $bindable(false) }: { open: boolean } = $props();

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

  function switchMode() {
    isLogin = !isLogin;
    error = null;
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
        open = false;
      } else {
        error = result.error || "Login failed";
      }
    } catch (e) {
      error = e instanceof Error ? e.message : "Login failed";
    } finally {
      isLoading = false;
    }
  }

  async function handleRegister() {
    if (!registerData.username || !registerData.password || !registerData.email) {
      error = "Please fill in all required fields";
      return;
    }

    isLoading = true;
    error = null;

    try {
      const result = await authStore.register(registerData);
      if (result.success) {
        (window as any).notification.success("Registration Successful", "Welcome to Axiomancer! Your account has been created.");
        open = false;
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
    if (event.key === "Enter") {
      if (isLogin) {
        handleLogin();
      } else {
        handleRegister();
      }
    } else if (event.key === "Escape") {
      open = false;
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
  <div class="dialog-backdrop" onmousedown={() => open = false} onkeydown={(e) => e.key === 'Escape' && (open = false)} role="button" tabindex="0" aria-label="Close login dialog">
    <div class="dialog" onclick={(e) => e.stopPropagation()} onmousedown={(e) => e.stopPropagation()} onkeydown={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="dialog-title" tabindex="-1">
      <div class="dialog-header">
        <h2 id="dialog-title">{isLogin ? "Login" : "Register"}</h2>
        <button class="close-btn" onclick={() => open = false} aria-label="Close dialog">
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
              placeholder="Choose a username"
              disabled={isLoading}
            />
          </div>

          <div class="form-group">
            <label for="register-email">Email *</label>
            <input
              id="register-email"
              type="email"
              bind:value={registerData.email}
              placeholder="Enter your email"
              disabled={isLoading}
            />
          </div>

          <div class="form-group">
            <label for="register-password">Password *</label>
            <input
              id="register-password"
              type="password"
              bind:value={registerData.password}
              placeholder="Choose a password"
              disabled={isLoading}
            />
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
          disabled={isLoading}
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

  .form-group input:disabled {
    opacity: 0.6;
    cursor: not-allowed;
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