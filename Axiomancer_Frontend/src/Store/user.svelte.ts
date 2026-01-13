// User Store - manages current user state and operations
import { userService } from "@/Service";
import type { User, UpdateUserRequest } from "@/Types";

class UserStore {
  currentUser = $state<User | null>(null);
  isLoading = $state(false);
  error = $state<string | null>(null);

  // Load current user profile
  async loadCurrentUser() {
    this.isLoading = true;
    this.error = null;

    try {
      const response = await userService.getCurrentProfile();

      if (response.success && response.data) {
        this.currentUser = response.data;
        return { success: true };
      } else {
        this.error = response.error || "Failed to load user profile";
        return { success: false, error: this.error };
      }
    } catch (e) {
      this.error = e instanceof Error ? e.message : "Failed to load user profile";
      return { success: false, error: this.error };
    } finally {
      this.isLoading = false;
    }
  }

  // Update current user profile
  async updateCurrentProfile(data: UpdateUserRequest) {
    this.isLoading = true;
    this.error = null;

    try {
      const response = await userService.updateCurrentProfile(data);

      if (response.success && response.data) {
        this.currentUser = response.data;
        return { success: true, data: response.data };
      } else {
        this.error = response.error || "Failed to update profile";
        return { success: false, error: this.error };
      }
    } catch (e) {
      this.error = e instanceof Error ? e.message : "Failed to update profile";
      return { success: false, error: this.error };
    } finally {
      this.isLoading = false;
    }
  }

  // Delete current user account
  async deleteCurrentProfile() {
    this.isLoading = true;
    this.error = null;

    try {
      const response = await userService.deleteCurrentProfile();

      if (response.success) {
        this.currentUser = null;
        return { success: true };
      } else {
        this.error = response.error || "Failed to delete account";
        return { success: false, error: this.error };
      }
    } catch (e) {
      this.error = e instanceof Error ? e.message : "Failed to delete account";
      return { success: false, error: this.error };
    } finally {
      this.isLoading = false;
    }
  }

  // Upload profile picture
  async uploadProfilePicture(file: File) {
    this.isLoading = true;
    this.error = null;

    try {
      const response = await userService.uploadCurrentProfilePicture(file);

      if (response.success && response.data) {
        // Reload user to get updated picture URL
        await this.loadCurrentUser();
        return { success: true, data: response.data };
      } else {
        this.error = response.error || "Failed to upload profile picture";
        return { success: false, error: this.error };
      }
    } catch (e) {
      this.error = e instanceof Error ? e.message : "Failed to upload profile picture";
      return { success: false, error: this.error };
    } finally {
      this.isLoading = false;
    }
  }

  // Get profile picture URL
  getProfilePictureUrl(): string {
    if (!this.currentUser?.picture_url) {
      return "/Picture/Profile/userUnidentified.png";
    }
    return userService.getProfilePictureUrl(this.currentUser.picture_url);
  }

  // Clear user state
  clear() {
    this.currentUser = null;
    this.isLoading = false;
    this.error = null;
  }
}

export const userStore = new UserStore();
