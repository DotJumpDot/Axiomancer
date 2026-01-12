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
      if (!auth?.user) {
        console.log("[Chat API] GET /api/conversations ✔️");
        return new Response(JSON.stringify({ success: true, data: [] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      const conversations = await ChatService.getAllConversations(auth.user.uuid);
      console.log("[Chat API] GET /api/conversations ✔️");
      return new Response(JSON.stringify({ success: true, data: conversations }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.log("[Chat API] GET /api/conversations ❌");
      return new Response(
        JSON.stringify({
          success: false,
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
        if (!auth?.user) {
          console.log("[Chat API] POST /api/conversations ❌");
          return new Response(
            JSON.stringify({
              success: false,
              error: "Authentication required to create conversations",
            }),
            { status: 401, headers: { "Content-Type": "application/json" } }
          );
        }

        // Determine auto_routing based on request (default false for single mode)
        const autoRouting = body.auto_routing_enabled ?? false;

        const conversation = await ChatService.createConversation(
          body as CreateConversationRequest,
          auth.user.uuid,
          autoRouting
        );
        console.log("[Chat API] POST /api/conversations ✔️");
        return new Response(JSON.stringify({ success: true, data: conversation }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      } catch (error) {
        console.log("[Chat API] POST /api/conversations ❌");
        return new Response(
          JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : "Failed to create conversation",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
    },
    {
      body: t.Object({
        title: t.String(),
        auto_routing_enabled: t.Optional(t.Boolean()),
      }),
    }
  )

  .get("/conversations/:id", async ({ params }) => {
    try {
      const conversation = await ChatService.getConversationById(params.id);
      if (!conversation) {
        console.log(`[Chat API] GET /api/conversations/${params.id} ❌`);
        return new Response(JSON.stringify({ success: false, error: "Conversation not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
      console.log(`[Chat API] GET /api/conversations/${params.id} ✔️`);
      return new Response(JSON.stringify({ success: true, data: conversation }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.log(`[Chat API] GET /api/conversations/${params.id} ❌`, error);
      return new Response(
        JSON.stringify({
          success: false,
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
          console.log(`[Chat API] PUT /api/conversations/${params.id} ❌`);
          return new Response(JSON.stringify({ success: false, error: "Conversation not found" }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
          });
        }
        console.log(`[Chat API] PUT /api/conversations/${params.id} ✔️`);
        return new Response(JSON.stringify({ success: true, data: conversation }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      } catch (error) {
        console.log(`[Chat API] PUT /api/conversations/${params.id} ❌`, error);
        return new Response(
          JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : "Failed to update conversation",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
    },
    {
      body: t.Object({
        title: t.Optional(t.String()),
        auto_routing_enabled: t.Optional(t.Boolean()),
      }),
    }
  )

  .delete("/conversations/:id", async ({ params }) => {
    try {
      const deleted = await ChatService.deleteConversation(params.id);
      if (!deleted) {
        console.log(`[Chat API] DELETE /api/conversations/${params.id} ❌`);
        return new Response(JSON.stringify({ success: false, error: "Conversation not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
      console.log(`[Chat API] DELETE /api/conversations/${params.id} ✔️`);
      return new Response(JSON.stringify({ success: true, data: { deleted: true } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.log(`[Chat API] DELETE /api/conversations/${params.id} ❌`, error);
      return new Response(
        JSON.stringify({
          success: false,
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
      console.log(`[Chat API] GET /api/conversations/${params.id}/messages ✔️`);
      return new Response(JSON.stringify({ success: true, data: messages }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error(
        "[Chat API] GET /api/conversations/:id/messages: Error getting messages:",
        error
      );
      console.log(`[Chat API] GET /api/conversations/${params.id}/messages ❌`);
      return new Response(
        JSON.stringify({
          success: false,
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
        console.log(`[Chat API] POST /api/conversations/${params.id}/messages ✔️`);
        return new Response(JSON.stringify({ success: true, data: message }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      } catch (error) {
        console.error(
          "[Chat API] POST /api/conversations/:id/messages: Error creating message:",
          error
        );
        console.log(`[Chat API] POST /api/conversations/${params.id}/messages ❌`);
        return new Response(
          JSON.stringify({
            success: false,
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
        if (!auth?.user) {
          const aiResponse = await ChatService.sendAnonymousMessage(body);
          console.log(`[Chat API] POST /api/conversations/${params.id}/send ✔️`);
          return new Response(JSON.stringify({ success: true, data: aiResponse }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }

        // Authenticated user - use full chat service with conversation storage
        const result = await ChatService.sendMessage(
          params.id,
          body.message,
          body.model_key,
          body.prompt_profile_id,
          {
            webSearch: body.webSearch,
            imageSearch: body.imageSearch,
          },
          auth.user.id
        );

        console.log(`[Chat API] POST /api/conversations/${params.id}/send ✔️`);
        return new Response(JSON.stringify({ success: true, data: result }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      } catch (error) {
        console.error("[Chat API] POST /api/conversations/:id/send: Error sending message:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to send message";
        const isNotFound = errorMessage.toLowerCase().includes("not found");

        console.log(`[Chat API] POST /api/conversations/${params.id}/send ❌`);
        return new Response(
          JSON.stringify({
            success: false,
            error: errorMessage,
          }),
          {
            status: isNotFound ? 404 : 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    },
    {
      body: t.Object({
        message: t.String(),
        model_key: t.Optional(t.String()),
        prompt_profile_id: t.Optional(t.String()),
        webSearch: t.Optional(t.Boolean()),
        imageSearch: t.Optional(t.Boolean()),
      }),
    }
  )

  // Get conversation with messages
  .get("/conversations/:id/full", async ({ params }) => {
    try {
      const result = await ChatService.getConversationWithMessages(params.id);
      if (!result) {
        console.log(`[Chat API] GET /api/conversations/${params.id}/full ❌`);
        return new Response(JSON.stringify({ success: false, error: "Conversation not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
      console.log(`[Chat API] GET /api/conversations/${params.id}/full ✔️`);
      return new Response(JSON.stringify({ success: true, data: result }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error(
        "[Chat API] GET /api/conversations/:id/full: Error getting conversation with messages:",
        error
      );
      console.log(`[Chat API] GET /api/conversations/${params.id}/full ❌`);
      return new Response(
        JSON.stringify({
          success: false,
          error:
            error instanceof Error ? error.message : "Failed to get conversation with messages",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  });
