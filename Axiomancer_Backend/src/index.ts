import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { sql } from "./database/db";

const app = new Elysia()
  .use(swagger({ path: "/w" }))
  .get("/", () => "Hello Elysia")
  .get("/test-db", async () => {
    try {
      const result = await sql`SELECT 1 as test`;
      return { message: "Database connected", result };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { error: "Database connection failed", details: message };
    }
  })
  .listen(4100);

console.log(`🦊 Elysia is running at http://localhost:${app.server?.port}`);
console.log(`🦊 Elysia swagger at http://localhost:${app.server?.port}/w`);
