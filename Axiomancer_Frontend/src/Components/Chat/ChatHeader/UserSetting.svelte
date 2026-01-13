<script lang="ts">
  import { authStore, userStore } from "@/Store";
  import type { UpdateUserRequest } from "@/Types";

  let isOpen = $state(false);
  let isLoading = $state(false);
  let error = $state<string | null>(null);
  let success = $state<string | null>(null);

  // Form state
  let formData = $state<UpdateUserRequest>({
    email: "",
    firstname: "",
    lastname: "",
    nickname: "",
    tel: "",
  });

  let originalData = $state<UpdateUserRequest>({});
  let selectedFile = $state<File | null>(null);
  let previewUrl = $state<string | null>(null);

  // Expose open method to parent
  export function open() {
    if (authStore.isAuthenticated) {
      loadUserData();
      isOpen = true;
      error = null;
      success = null;
      selectedFile = null;
      previewUrl = null;
    }
  }

  function close() {
    isOpen = false;
    error = null;
    success = null;
    selectedFile = null;
    previewUrl = null;
  }

  async function loadUserData() {
    try {
      isLoading = true;
      error = null;
      
      const result = await userStore.loadCurrentUser();
      
      if (result.success && userStore.currentUser) {
        const user = userStore.currentUser;
        
        // Also update authStore to keep both stores in sync
        authStore.updateCurrentUser({
          email: user.email || "",
          firstname: user.firstname || "",
          lastname: user.lastname || "",
          nickname: user.nickname || "",
          picture_url: user.picture_url || "",
        });
        
        originalData = {
          email: user.email || "",
          firstname: user.firstname || "",
          lastname: user.lastname || "",
          nickname: user.nickname || "",
          tel: user.tel || "",
        };
        
        formData = {
          email: user.email || "",
          firstname: user.firstname || "",
          lastname: user.lastname || "",
          nickname: user.nickname || "",
          tel: user.tel || "",
        };
      } else {
        error = result.error || "Failed to load user data";
      }
    } catch (e) {
      error = e instanceof Error ? e.message : "Failed to load user data";
    } finally {
      isLoading = false;
    }
  }

  function handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      selectedFile = input.files[0];
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        previewUrl = e.target?.result as string;
      };
      reader.readAsDataURL(selectedFile);
    }
  }

  async function handleProfilePictureUpload() {
    if (!selectedFile) return;

    try {
      isLoading = true;
      error = null;
      success = null;
      
      const result = await userStore.uploadProfilePicture(selectedFile);

      if (result.success) {
        success = "Profile picture updated successfully!";
        
        // Update authStore to reflect the new picture immediately
        if (userStore.currentUser) {
          authStore.updateCurrentUser({
            picture_url: userStore.currentUser.picture_url
          });
        }
        
        selectedFile = null;
        previewUrl = null;
        
        // Clear file input
        const fileInput = document.getElementById("profile-picture-input") as HTMLInputElement;
        if (fileInput) fileInput.value = "";
      } else {
        error = result.error || "Failed to upload profile picture";
      }
    } catch (e) {
      error = e instanceof Error ? e.message : "Failed to upload profile picture";
    } finally {
      isLoading = false;
    }
  }

  async function handleUpdateProfile() {
    try {
      isLoading = true;
      error = null;
      success = null;

      // Filter out empty values and unchanged fields
      const updateData: UpdateUserRequest = {};
      
      if (formData.email && formData.email !== originalData.email) {
        updateData.email = formData.email;
      }
      if (formData.firstname !== originalData.firstname) {
        updateData.firstname = formData.firstname || null;
      }
      if (formData.lastname !== originalData.lastname) {
        updateData.lastname = formData.lastname || null;
      }
      if (formData.nickname !== originalData.nickname) {
        updateData.nickname = formData.nickname || null;
      }
      if (formData.tel !== originalData.tel) {
        updateData.tel = formData.tel || null;
      }

      // Only update if there are changes
      if (Object.keys(updateData).length === 0) {
        error = "No changes to save";
        isLoading = false;
        return;
      }

      const result = await userStore.updateCurrentProfile(updateData);

      if (result.success) {
        success = "Profile updated successfully!";
        
        // Update authStore to keep both stores in sync
        if (userStore.currentUser) {
          const user = userStore.currentUser;
          authStore.updateCurrentUser({
            email: user.email || "",
            firstname: user.firstname || "",
            lastname: user.lastname || "",
            nickname: user.nickname || "",
          });
          
          originalData = {
            email: user.email || "",
            firstname: user.firstname || "",
            lastname: user.lastname || "",
            nickname: user.nickname || "",
            tel: user.tel || "",
          };
        }
      } else {
        error = result.error || "Failed to update profile";
      }
    } catch (e) {
      error = e instanceof Error ? e.message : "Failed to update profile";
    } finally {
      isLoading = false;
    }
  }

  async function handleDeleteAccount() {
    if (!confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      return;
    }

    try {
      isLoading = true;
      error = null;
      
      const result = await userStore.deleteCurrentProfile();

      if (result.success) {
        // Logout and close dialog
        authStore.logout();
        userStore.clear();
        close();
      } else {
        error = result.error || "Failed to delete account";
      }
    } catch (e) {
      error = e instanceof Error ? e.message : "Failed to delete account";
    } finally {
      isLoading = false;
    }
  }

  function hasChanges(): boolean {
    return (
      formData.email !== originalData.email ||
      formData.firstname !== originalData.firstname ||
      formData.lastname !== originalData.lastname ||
      formData.nickname !== originalData.nickname ||
      formData.tel !== originalData.tel
    );
  }

  function resetForm() {
    formData = {
      email: originalData.email || "",
      firstname: originalData.firstname || "",
      lastname: originalData.lastname || "",
      nickname: originalData.nickname || "",
      tel: originalData.tel || "",
    };
    error = null;
    success = null;
    selectedFile = null;
    previewUrl = null;
  }

  // Close on escape key
  $effect(() => {
    if (isOpen) {
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === "Escape") close();
      };
      window.addEventListener("keydown", handleEsc);
      return () => window.removeEventListener("keydown", handleEsc);
    }
  });

  // Track mousedown outside to close modal only on mousedown, not mouseup
  let mouseDownOutside = $state(false);
  
  function handleOverlayMouseDown(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (target.classList.contains('modal-overlay')) {
      mouseDownOutside = true;
    }
  }

  function handleOverlayMouseUp(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (target.classList.contains('modal-overlay') && mouseDownOutside) {
      close();
    }
    mouseDownOutside = false;
  }

  function handleOverlayMouseLeave() {
    mouseDownOutside = false;
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
{#if isOpen}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="modal-overlay"
    onmousedown={handleOverlayMouseDown}
    onmouseup={handleOverlayMouseUp}
    onmouseleave={handleOverlayMouseLeave}
  >
    <div class="modal-content" onclick={(e) => e.stopPropagation()}>
      <div class="modal-header">
        <h2>User Settings</h2>
        <!-- svelte-ignore a11y_consider_explicit_label -->
        <button class="close-btn" onclick={close}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div class="modal-body">
        {#if isLoading}
          <div class="loading-overlay">
            <div class="loading-spinner"></div>
          </div>
        {/if}

        {#if error}
          <div class="alert alert-error">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            {error}
          </div>
        {/if}

        {#if success}
          <div class="alert alert-success">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            {success}
          </div>
        {/if}

        <!-- Profile Picture Section -->
        <div class="section">
          <h3>Profile Picture</h3>
          <div class="profile-picture-section">
            <div class="profile-picture-preview">
              <img
                src={previewUrl || userStore.getProfilePictureUrl()}
                alt="Profile preview"
                class="profile-image"
              />
            </div>
            <div class="profile-picture-controls">
              <input 
                type="file" 
                id="profile-picture-input"
                accept="image/*" 
                onchange={handleFileSelect}
                style="display: none;"
              />
              <label for="profile-picture-input" class="file-input-label">
                Choose Photo
              </label>
              {#if selectedFile}
                <button 
                  class="upload-btn" 
                  onclick={handleProfilePictureUpload}
                  disabled={isLoading}
                >
                  Upload
                </button>
              {/if}
            </div>
          </div>
        </div>

        <!-- Personal Information Section -->
        <div class="section">
          <h3>Personal Information</h3>
          <div class="form-grid">
            <div class="form-group">
              <label for="firstname">First Name</label>
              <input 
                type="text" 
                id="firstname"
                bind:value={formData.firstname}
                placeholder="Enter first name"
              />
            </div>
            <div class="form-group">
              <label for="lastname">Last Name</label>
              <input 
                type="text" 
                id="lastname"
                bind:value={formData.lastname}
                placeholder="Enter last name"
              />
            </div>
            <div class="form-group">
              <label for="nickname">Nickname</label>
              <input 
                type="text" 
                id="nickname"
                bind:value={formData.nickname}
                placeholder="Enter nickname"
              />
            </div>
            <div class="form-group">
              <label for="email">Email</label>
              <input 
                type="email" 
                id="email"
                bind:value={formData.email}
                placeholder="Enter email"
              />
            </div>
            <div class="form-group">
              <label for="tel">Phone</label>
              <input 
                type="tel" 
                id="tel"
                bind:value={formData.tel}
                placeholder="Enter phone number"
              />
            </div>
          </div>
        </div>

        <!-- Account Information Section -->
        <div class="section">
          <h3>Account Information</h3>
          <div class="account-info">
            <div class="info-row">
              <span class="label">Username:</span>
              <span class="value">{userStore.currentUser?.username || "N/A"}</span>
            </div>
            <div class="info-row">
              <span class="label">User ID:</span>
              <span class="value">{userStore.currentUser?.uuid || "N/A"}</span>
            </div>
            <div class="info-row">
              <span class="label">Role:</span>
              <span class="value">{userStore.currentUser?.role || "N/A"}</span>
            </div>
            <div class="info-row">
              <span class="label">Member Since:</span>
              <span class="value">
                {userStore.currentUser?.created_at ? new Date(userStore.currentUser.created_at).toLocaleDateString() : "N/A"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <div class="footer-actions">
          <button 
            class="btn btn-secondary" 
            onclick={resetForm}
            disabled={!hasChanges() || isLoading}
          >
            Reset
          </button>
          <div class="spacer"></div>
          <button 
            class="btn btn-danger" 
            onclick={handleDeleteAccount}
            disabled={isLoading}
          >
            Delete Account
          </button>
          <button 
            class="btn btn-primary" 
            onclick={handleUpdateProfile}
            disabled={!hasChanges() || isLoading}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    backdrop-filter: blur(4px);
  }

  .modal-content {
    background: var(--bg-primary, #1a1a1a);
    border-radius: 12px;
    width: 90%;
    max-width: 600px;
    max-height: 90vh;
    overflow-y: auto;
    border: 1px solid var(--border-color, #333);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px;
    border-bottom: 1px solid var(--border-color, #333);
    background: var(--bg-secondary, #252525);
    border-radius: 12px 12px 0 0;
  }

  .modal-header h2 {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: var(--text-primary, #fff);
  }

  .close-btn {
    background: transparent;
    border: none;
    color: var(--text-secondary, #888);
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .close-btn:hover {
    background: var(--hover-bg, #333);
    color: var(--text-primary, #fff);
  }

  .modal-body {
    padding: 24px;
    position: relative;
  }

  .section {
    margin-bottom: 24px;
  }

  .section h3 {
    margin: 0 0 16px 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary, #fff);
  }

  /* Profile Picture Section */
  .profile-picture-section {
    display: flex;
    gap: 20px;
    align-items: center;
  }

  .profile-picture-preview {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    overflow: hidden;
    border: 2px solid var(--border-color, #333);
    background: var(--bg-tertiary, #2a2a2a);
  }

  .profile-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .profile-picture-controls {
    display: flex;
    gap: 8px;
    flex-direction: column;
  }

  .file-input-label {
    padding: 8px 16px;
    background: var(--bg-tertiary, #2a2a2a);
    border: 1px solid var(--border-color, #333);
    border-radius: 6px;
    color: var(--text-primary, #fff);
    cursor: pointer;
    font-size: 14px;
    text-align: center;
    transition: all 0.2s;
  }

  .file-input-label:hover {
    background: var(--hover-bg, #333);
    border-color: var(--border-color-hover, #444);
  }

  .upload-btn {
    padding: 8px 16px;
    background: var(--primary-color, #6366f1);
    border: none;
    border-radius: 6px;
    color: white;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s;
  }

  .upload-btn:hover {
    background: #5558e3;
  }

  .upload-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  /* Form Section */
  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .form-group label {
    font-size: 13px;
    font-weight: 500;
    color: var(--text-secondary, #aaa);
  }

  .form-group input {
    padding: 10px 12px;
    background: var(--bg-tertiary, #2a2a2a);
    border: 1px solid var(--border-color, #333);
    border-radius: 6px;
    color: var(--text-primary, #fff);
    font-size: 14px;
    transition: all 0.2s;
  }

  .form-group input:focus {
    outline: none;
    border-color: var(--primary-color, #6366f1);
    background: var(--bg-secondary, #252525);
  }

  .form-group input::placeholder {
    color: var(--text-tertiary, #666);
  }

  /* Account Information */
  .account-info {
    background: var(--bg-tertiary, #2a2a2a);
    border: 1px solid var(--border-color, #333);
    border-radius: 8px;
    padding: 12px;
  }

  .info-row {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px solid var(--border-color, #2a2a2a);
  }

  .info-row:last-child {
    border-bottom: none;
  }

  .info-row .label {
    font-weight: 500;
    color: var(--text-secondary, #aaa);
    font-size: 13px;
  }

  .info-row .value {
    color: var(--text-primary, #fff);
    font-size: 13px;
    font-weight: 500;
  }

  /* Alerts */
  .alert {
    padding: 12px 16px;
    border-radius: 6px;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
  }

  .alert-error {
    background: rgba(239, 68, 68, 0.15);
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: #fca5a5;
  }

  .alert-success {
    background: rgba(34, 197, 94, 0.15);
    border: 1px solid rgba(34, 197, 94, 0.3);
    color: #86efac;
  }

  /* Loading Overlay */
  .loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(26, 26, 26, 0.8);
    backdrop-filter: blur(2px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
    border-radius: 12px;
  }

  /* Loading Spinner */
  .loading-spinner {
    width: 32px;
    height: 32px;
    border: 3px solid var(--border-color, #333);
    border-top-color: var(--primary-color, #6366f1);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* Modal Footer */
  .modal-footer {
    padding: 16px 24px;
    border-top: 1px solid var(--border-color, #333);
    background: var(--bg-secondary, #252525);
    border-radius: 0 0 12px 12px;
  }

  .footer-actions {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .spacer {
    flex: 1;
  }

  /* Buttons */
  .btn {
    padding: 10px 20px;
    border-radius: 6px;
    border: none;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-primary {
    background: var(--primary-color, #6366f1);
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    background: #5558e3;
  }

  .btn-secondary {
    background: var(--bg-tertiary, #2a2a2a);
    color: var(--text-primary, #fff);
    border: 1px solid var(--border-color, #333);
  }

  .btn-secondary:hover:not(:disabled) {
    background: var(--hover-bg, #333);
    border-color: var(--border-color-hover, #444);
  }

  .btn-danger {
    background: rgba(239, 68, 68, 0.2);
    color: #fca5a5;
    border: 1px solid rgba(239, 68, 68, 0.3);
  }

  .btn-danger:hover:not(:disabled) {
    background: rgba(239, 68, 68, 0.3);
    border-color: rgba(239, 68, 68, 0.5);
  }

  /* Responsive */
  @media (max-width: 640px) {
    .modal-content {
      width: 95%;
      max-height: 95vh;
    }

    .form-grid {
      grid-template-columns: 1fr;
    }

    .profile-picture-section {
      flex-direction: column;
      align-items: flex-start;
    }

    .footer-actions {
      flex-direction: column;
      width: 100%;
    }

    .btn {
      width: 100%;
      justify-content: center;
    }

    .spacer {
      display: none;
    }
  }
</style>