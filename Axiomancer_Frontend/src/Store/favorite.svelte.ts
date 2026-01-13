import type { UserFavorite } from "@/Types";
import { favoriteService } from "@/Service";

interface FavoriteStore {
  favorites: UserFavorite | null;
  isLoading: boolean;
  error: string | null;

  // Methods
  loadFavorites: (userUuid: string) => Promise<void>;
  addToFavorite: (
    userUuid: string,
    type: "model" | "prompt" | "conversation",
    id: string
  ) => Promise<void>;
  removeFromFavorite: (
    userUuid: string,
    type: "model" | "prompt" | "conversation",
    id: string
  ) => Promise<void>;
  isFavorite: (type: "model" | "prompt" | "conversation", id: string) => boolean;
  reset: () => void;
}

function createFavoriteStore(): FavoriteStore {
  let favorites = $state<UserFavorite | null>(null);
  let isLoading = $state(false);
  let error = $state<string | null>(null);

  return {
    get favorites() {
      return favorites;
    },
    get isLoading() {
      return isLoading;
    },
    get error() {
      return error;
    },

    async loadFavorites(userUuid: string) {
      isLoading = true;
      error = null;
      try {
        favorites = await favoriteService.getFavorites(userUuid);
      } catch (err) {
        error = err instanceof Error ? err.message : "Failed to load favorites";
        console.error("Failed to load favorites:", err);
      } finally {
        isLoading = false;
      }
    },

    async addToFavorite(userUuid: string, type: "model" | "prompt" | "conversation", id: string) {
      error = null;
      try {
        const request: any = {};
        if (type === "model") request.model_key = id;
        else if (type === "prompt") request.prompt_id = id;
        else if (type === "conversation") request.conversation_id = id;

        favorites = await favoriteService.addToFavorite(userUuid, request);
      } catch (err) {
        error = err instanceof Error ? err.message : "Failed to add favorite";
        console.error("Failed to add favorite:", err);
        throw err;
      }
    },

    async removeFromFavorite(
      userUuid: string,
      type: "model" | "prompt" | "conversation",
      id: string
    ) {
      error = null;
      try {
        const request: any = {};
        if (type === "model") request.model_key = id;
        else if (type === "prompt") request.prompt_id = id;
        else if (type === "conversation") request.conversation_id = id;

        favorites = await favoriteService.removeFromFavorite(userUuid, request);
      } catch (err) {
        error = err instanceof Error ? err.message : "Failed to remove favorite";
        console.error("Failed to remove favorite:", err);
        throw err;
      }
    },

    isFavorite(type: "model" | "prompt" | "conversation", id: string): boolean {
      if (!favorites) return false;

      if (type === "model") return favorites.favorite_models.includes(id);
      if (type === "prompt") return favorites.favorite_prompts.includes(id);
      if (type === "conversation") return favorites.favorite_conversation.includes(id);

      return false;
    },

    reset() {
      favorites = null;
      isLoading = false;
      error = null;
    },
  };
}

export const favoriteStore = createFavoriteStore();
