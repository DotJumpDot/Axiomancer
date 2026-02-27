import { Elysia, t } from "elysia";
import { UserService } from "./user_service";
import type {
  CreateUserRequest,
  UpdateUserRequest,
  AuthResponse,
  UploadResponse,
} from "./user_type";

export const userApi = new Elysia({ prefix: "/api", tags: ["User"] })
  // All routes require dual authentication (JWT + API Key)
  // Auth context is set by global middleware in index.ts

  // Get all users
  .get("/users", async (context: any) => {
    try {
      const { auth } = context;
      if (!auth?.user) {
        return {
          success: false,
          error: "Authentication required. Please provide both JWT token and API key.",
          status: 401,
        };
      }

      const users = await UserService.getAllUsers();
      return { success: true, data: users.map((user) => UserService.getPublicUser(user)) };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch users",
        status: 500,
      };
    }
  })

  // Get user by ID
  .get("/user/:id", async (context: any) => {
    try {
      const { params, auth } = context;
      if (!auth?.user) {
        return {
          success: false,
          error: "Authentication required. Please provide both JWT token and API key.",
          status: 401,
        };
      }

      const userId = parseInt(params.id);
      if (isNaN(userId)) {
        return { success: false, error: "Invalid user ID", status: 400 };
      }

      const user = await UserService.getUserById(userId);
      if (!user) {
        return { success: false, error: "User not found", status: 404 };
      }

      return { success: true, data: UserService.getPublicUser(user) };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch user",
        status: 500,
      };
    }
  })

  // Get user by UUID
  .get("/user/uuid/:uuid", async (context: any) => {
    try {
      const { params, auth } = context;
      if (!auth?.user) {
        return {
          success: false,
          error: "Authentication required. Please provide both JWT token and API key.",
          status: 401,
        };
      }

      const user = await UserService.getUserByUUID(params.uuid);
      if (!user) {
        return { success: false, error: "User not found", status: 404 };
      }

      return { success: true, data: UserService.getPublicUser(user) };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch user",
        status: 500,
      };
    }
  })

  // Create user
  .post(
    "/user/create",
    async (context: any) => {
      try {
        const { body, auth } = context;
        if (!auth?.user) {
          return {
            success: false,
            error: "Authentication required. Please provide both JWT token and API key.",
            status: 401,
          };
        }

        const user = await UserService.createUser(body);
        return {
          success: true,
          user: UserService.getPublicUser(user),
          status: 201,
        };
      } catch (error) {
        return {
          error: error instanceof Error ? error.message : "Failed to create user",
          status: 400,
        };
      }
    },
    {
      body: t.Object({
        username: t.String({ minLength: 3 }),
        password: t.String({ minLength: 4 }),
        email: t.String(),
        firstname: t.Optional(t.String()),
        lastname: t.Optional(t.String()),
        nickname: t.Optional(t.String()),
        role: t.Optional(t.String()),
        tel: t.Optional(t.String()),
      }),
    }
  )

  // Update user
  .put(
    "/user/:id",
    async (context: any) => {
      try {
        const { params, body, auth } = context;
        if (!auth?.user) {
          return {
            success: false,
            error: "Authentication required. Please provide both JWT token and API key.",
            status: 401,
          };
        }

        const userId = parseInt(params.id);
        if (isNaN(userId)) {
          return { error: "Invalid user ID", status: 400 };
        }

        const user = await UserService.updateUser(userId, body);
        if (!user) {
          return { error: "User not found", status: 404 };
        }

        return {
          success: true,
          user: UserService.getPublicUser(user),
        };
      } catch (error) {
        return {
          error: error instanceof Error ? error.message : "Failed to update user",
          status: 400,
        };
      }
    },
    {
      body: t.Object({
        email: t.Optional(t.String()),
        firstname: t.Optional(t.Union([t.String(), t.Null()])),
        lastname: t.Optional(t.Union([t.String(), t.Null()])),
        nickname: t.Optional(t.Union([t.String(), t.Null()])),
        role: t.Optional(t.String()),
        tel: t.Optional(t.Union([t.String(), t.Null()])),
        password: t.Optional(t.String({ minLength: 6 })),
        openrouter_api_key: t.Optional(t.Union([t.String(), t.Null()])),
      }),
    }
  )

  // Delete user
  .delete("/user/:id", async (context: any) => {
    try {
      const { params, auth } = context;
      if (!auth?.user) {
        return {
          success: false,
          error: "Authentication required. Please provide both JWT token and API key.",
          status: 401,
        };
      }

      const userId = parseInt(params.id);
      if (isNaN(userId)) {
        return { error: "Invalid user ID", status: 400 };
      }

      const deleted = await UserService.deleteUser(userId);
      if (!deleted) {
        return { error: "User not found", status: 404 };
      }

      return { success: true, message: "User deleted successfully" };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Failed to delete user",
        status: 500,
      };
    }
  })

  // Upload profile picture
  .post(
    "/user/:id/upload-profile",
    async (context: any) => {
      try {
        const { params, body, auth } = context;
        if (!auth?.user) {
          return {
            success: false,
            error: "Authentication required. Please provide both JWT token and API key.",
            status: 401,
          };
        }

        const userId = parseInt(params.id);
        if (isNaN(userId)) {
          return { error: "Invalid user ID", status: 400 };
        }

        // Check if user exists
        const user = await UserService.getUserById(userId);
        if (!user) {
          return { error: "User not found", status: 404 };
        }

        // Handle file upload
        const file = body.profile_picture as File;
        if (!file) {
          return { error: "No file provided", status: 400 };
        }

        const result = await UserService.uploadProfilePicture(userId, file);
        if (!result.success) {
          return { error: result.error, status: 400 };
        }

        return {
          success: true,
          message: "Profile picture uploaded successfully",
          url: result.url,
        };
      } catch (error) {
        return {
          error: error instanceof Error ? error.message : "Upload failed",
          status: 500,
        };
      }
    },
    {
      body: t.Object({
        profile_picture: t.File(),
      }),
    }
  )

  // Get user profile picture URL
  .get("/user/:id/profile-picture", async (context: any) => {
    try {
      const { params, auth } = context;
      if (!auth?.user) {
        return {
          success: false,
          error: "Authentication required. Please provide both JWT token and API key.",
          status: 401,
        };
      }

      const userId = parseInt(params.id);
      if (isNaN(userId)) {
        return { error: "Invalid user ID", status: 400 };
      }

      const user = await UserService.getUserById(userId);
      if (!user) {
        return { error: "User not found", status: 404 };
      }

      return {
        profile_picture_url: user.picture_url || null,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Failed to fetch profile picture",
        status: 500,
      };
    }
  })

  // ============ Current User Routes (/me) ============

  // Get current user profile
  .get("/user/me", async (context: any) => {
    try {
      const { auth } = context;
      if (!auth?.user) {
        return { success: false, error: "Unauthorized", status: 401 };
      }

      const fullUser = await UserService.getUserById(auth.user.id);
      if (!fullUser) {
        return { success: false, error: "User not found", status: 404 };
      }

      return { success: true, data: UserService.getPublicUser(fullUser) };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch profile",
        status: 500,
      };
    }
  })

  // Update current user profile
  .put(
    "/user/me",
    async (context: any) => {
      try {
        const { body, auth } = context;
        if (!auth?.user) {
          return { success: false, error: "Unauthorized", status: 401 };
        }

        const updatedUser = await UserService.updateUser(auth.user.id, body);
        if (!updatedUser) {
          return { success: false, error: "Failed to update profile", status: 500 };
        }

        return {
          success: true,
          data: UserService.getPublicUser(updatedUser),
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to update profile",
          status: 400,
        };
      }
    },
    {
      body: t.Object({
        email: t.Optional(t.String()),
        firstname: t.Optional(t.Union([t.String(), t.Null()])),
        lastname: t.Optional(t.Union([t.String(), t.Null()])),
        nickname: t.Optional(t.Union([t.String(), t.Null()])),
        tel: t.Optional(t.Union([t.String(), t.Null()])),
        password: t.Optional(t.String({ minLength: 6 })),
      }),
    }
  )

  // Delete current user account
  .delete("/user/me", async (context: any) => {
    try {
      const { auth } = context;
      if (!auth?.user) {
        return { success: false, error: "Unauthorized", status: 401 };
      }

      const deleted = await UserService.deleteUser(auth.user.id);
      if (!deleted) {
        return { success: false, error: "Failed to delete account", status: 500 };
      }

      return { success: true, message: "Account deleted successfully" };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete account",
        status: 500,
      };
    }
  })

  // Upload profile picture for current user
  .post(
    "/user/me/upload-profile",
    async (context: any) => {
      try {
        const { body, auth } = context;
        if (!auth?.user) {
          return { success: false, error: "Unauthorized", status: 401 };
        }

        const file = body.profile_picture as File;
        if (!file) {
          return { success: false, error: "No file provided", status: 400 };
        }

        const result = await UserService.uploadProfilePicture(auth.user.id, file);
        if (!result.success) {
          return { success: false, error: result.error, status: 400 };
        }

        return {
          success: true,
          message: "Profile picture uploaded successfully",
          url: result.url,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Upload failed",
          status: 500,
        };
      }
    },
    {
      body: t.Object({
        profile_picture: t.File(),
      }),
    }
  );
