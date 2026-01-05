import { Elysia, t } from "elysia";
import { ChatService } from "./chat_service";
import type {
  CreateConversationRequest,
  UpdateConversationRequest,
  CreateChatRequest,
} from "./chat_type";

export const chatApi = new Elysia({ prefix: "/api", tags: ["Chat"] })
  // Conversation routes
  .get("/conversations", async (context: any) => {
    const { auth } = context;
    try {
      // Only authenticated users can list conversations
      if (!auth?.tokenUser) {
        return { conversations: [] };
      }

      const conversations = await ChatService.getAllConversations(auth.tokenUser.id);
      return { conversations };
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : "Failed to get conversations",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  })

  .post(
    "/conversations",
    async (context: any) => {
      const { body, auth } = context;
      try {
        // Only authenticated users can create persistent conversations
        if (!auth?.tokenUser) {
          return new Response(
            JSON.stringify({ error: "Authentication required to create conversations" }),
            { status: 401, headers: { "Content-Type": "application/json" } }
          );
        }

        const conversation = await ChatService.createConversation(
          body as CreateConversationRequest,
          auth.tokenUser.id
        );
        return { conversation };
      } catch (error) {
        return new Response(
          JSON.stringify({
            error: error instanceof Error ? error.message : "Failed to create conversation",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
    },
    {
      body: t.Object({
        title: t.String(),
        system_prompt_snapshot: t.Optional(t.String()),
        auto_routing_enabled: t.Optional(t.Boolean()),
      }),
    }
  )

  .get("/conversations/:id", async ({ params }) => {
    try {
      const conversation = await ChatService.getConversationById(params.id);
      if (!conversation) {
        return new Response(JSON.stringify({ error: "Conversation not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
      return { conversation };
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : "Failed to get conversation",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  })

  .put(
    "/conversations/:id",
    async ({ params, body }) => {
      try {
        const conversation = await ChatService.updateConversation(
          params.id,
          body as UpdateConversationRequest
        );
        if (!conversation) {
          return new Response(JSON.stringify({ error: "Conversation not found" }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
          });
        }
        return { conversation };
      } catch (error) {
        return new Response(
          JSON.stringify({
            error: error instanceof Error ? error.message : "Failed to update conversation",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
    },
    {
      body: t.Object({
        title: t.Optional(t.String()),
        system_prompt_snapshot: t.Optional(t.String()),
        auto_routing_enabled: t.Optional(t.Boolean()),
      }),
    }
  )

  .delete("/conversations/:id", async ({ params }) => {
    try {
      const deleted = await ChatService.deleteConversation(params.id);
      if (!deleted) {
        return new Response(JSON.stringify({ error: "Conversation not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
      return { success: true };
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : "Failed to delete conversation",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  })

  // Chat message routes
  .get("/conversations/:id/messages", async ({ params }) => {
    try {
      const messages = await ChatService.getChatsByConversationId(params.id);
      return { messages };
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : "Failed to get messages",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  })

  .post(
    "/conversations/:id/messages",
    async ({ params, body }) => {
      try {
        const chatData: CreateChatRequest = {
          conversation_id: params.id,
          ...(body as Omit<CreateChatRequest, "conversation_id">),
        };

        const message = await ChatService.createChat(chatData);
        return { message };
      } catch (error) {
        return new Response(
          JSON.stringify({
            error: error instanceof Error ? error.message : "Failed to create message",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
    },
    {
      body: t.Object({
        role: t.Union([t.Literal("user"), t.Literal("assistant"), t.Literal("system")]),
        content: t.String(),
        model_id: t.Optional(t.String()),
        prompt_profile_id: t.Optional(t.String()),
        routing_mode: t.Optional(t.Union([t.Literal("auto"), t.Literal("manual")])),
        used_web_search: t.Optional(t.Boolean()),
        used_image_search: t.Optional(t.Boolean()),
        search_context: t.Optional(t.Any()),
        token_usage: t.Optional(t.Any()),
        latency_ms: t.Optional(t.Number()),
      }),
    }
  )

  // Send message and get AI response
  .post(
    "/conversations/:id/send",
    async (context: any) => {
      const { params, body, auth } = context;
      try {
        // For anonymous users, we don't save to database, just proxy to AI
        if (!auth?.tokenUser) {
          // Handle anonymous chat - direct AI call without database storage
          const aiResponse = await ChatService.sendAnonymousMessage(body);
          return aiResponse;
        }

        // Authenticated user - use full chat service with conversation storage
        const result = await ChatService.sendMessage(params.id, body.message, auth.tokenUser.id);
        return result;
      } catch (error) {
        return new Response(
          JSON.stringify({
            error: error instanceof Error ? error.message : "Failed to send message",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
    },
    {
      body: t.Object({
        message: t.String(),
      }),
    }
  )

  // Get conversation with messages
  .get("/conversations/:id/full", async ({ params }) => {
    try {
      const result = await ChatService.getConversationWithMessages(params.id);
      if (!result) {
        return new Response(JSON.stringify({ error: "Conversation not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
      return result;
    } catch (error) {
      return new Response(
        JSON.stringify({
          error:
            error instanceof Error ? error.message : "Failed to get conversation with messages",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  });
