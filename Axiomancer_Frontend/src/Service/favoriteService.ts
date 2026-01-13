import { apiClient } from "./apiClient";
import type {
  UserFavorite,
  UpdateUserFavoriteRequest,
  AddToFavoriteRequest,
  RemoveFromFavoriteRequest,
} from "@/Types";

class FavoriteService {
  // Get or create user favorites
  async getFavorites(userUuid: string): Promise<UserFavorite> {
    const response = await apiClient.get<UserFavorite>(`/api/favorites/${userUuid}`);
    if (!response.success || !response.data) {
      throw new Error(response.error || "Failed to fetch favorites");
    }
    return response.data;
  }

  // Update user favorites (full replace)
  async updateFavorites(userUuid: string, data: UpdateUserFavoriteRequest): Promise<UserFavorite> {
    const response = await apiClient.put<UserFavorite>(`/api/favorites/${userUuid}`, data);
    if (!response.success || !response.data) {
      throw new Error(response.error || "Failed to update favorites");
    }
    return response.data;
  }

  // Add to favorites
  async addToFavorite(userUuid: string, data: AddToFavoriteRequest): Promise<UserFavorite> {
    const response = await apiClient.post<UserFavorite>(`/api/favorites/${userUuid}/add`, data);
    if (!response.success || !response.data) {
      throw new Error(response.error || "Failed to add to favorites");
    }
    return response.data;
  }

  // Remove from favorites
  async removeFromFavorite(
    userUuid: string,
    data: RemoveFromFavoriteRequest
  ): Promise<UserFavorite> {
    const response = await apiClient.post<UserFavorite>(`/api/favorites/${userUuid}/remove`, data);
    if (!response.success || !response.data) {
      throw new Error(response.error || "Failed to remove from favorites");
    }
    return response.data;
  }

  // Delete user favorites
  async deleteFavorites(userUuid: string): Promise<void> {
    const response = await apiClient.delete(`/api/favorites/${userUuid}`);
    if (!response.success) {
      throw new Error(response.error || "Failed to delete favorites");
    }
  }
}

export const favoriteService = new FavoriteService();
