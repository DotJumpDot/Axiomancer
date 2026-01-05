import { Elysia, t } from "elysia";
import { UserService } from "./user_service";
import type {
  CreateUserRequest,
  UpdateUserRequest,
  AuthResponse,
  UploadResponse,
} from "./user_type";

export const userApi = new Elysia({ prefix: "/api", tags: ["User"] })
  // Get all users
  .get("/users", async () => {
    try {
      const users = await UserService.getAllUsers();
      return users.map((user) => UserService.getPublicUser(user));
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Failed to fetch users",
        status: 500,
      };
    }
  })

  // Get user by ID
  .get("/user/:id", async ({ params: { id } }) => {
    try {
      const userId = parseInt(id);
      if (isNaN(userId)) {
        return { error: "Invalid user ID", status: 400 };
      }

      const user = await UserService.getUserById(userId);
      if (!user) {
        return { error: "User not found", status: 404 };
      }

      return UserService.getPublicUser(user);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Failed to fetch user",
        status: 500,
      };
    }
  })

  // Get user by UUID
  .get("/user/uuid/:uuid", async ({ params: { uuid } }) => {
    try {
      const user = await UserService.getUserByUUID(uuid);
      if (!user) {
        return { error: "User not found", status: 404 };
      }

      return UserService.getPublicUser(user);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Failed to fetch user",
        status: 500,
      };
    }
  })

  // Create user
  .post(
    "/user/create",
    async ({ body }: { body: CreateUserRequest }) => {
      try {
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
    async ({ params: { id }, body }: { params: { id: string }; body: UpdateUserRequest }) => {
      try {
        const userId = parseInt(id);
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
      }),
    }
  )

  // Delete user
  .delete("/user/:id", async ({ params: { id } }) => {
    try {
      const userId = parseInt(id);
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
    async ({ params: { id }, body }) => {
      try {
        const userId = parseInt(id);
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
  .get("/user/:id/profile-picture", async ({ params: { id } }) => {
    try {
      const userId = parseInt(id);
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
  });
