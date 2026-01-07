import { sql } from "../database/db";
import { encryptApiKey } from "../api/user/user_service";

/**
 * Migration script to encrypt existing plain text API keys
 * Run this script with: bun run src/scripts/encrypt_existing_api_keys.ts
 */

async function encryptExistingApiKeys() {
  console.log("Starting API key encryption migration...");

  try {
    // Get all users with API keys
    const users = await sql`
      SELECT id, uuid, username, openrouter_api_key 
      FROM "user" 
      WHERE openrouter_api_key IS NOT NULL 
      AND openrouter_api_key != ''
    `;

    if (users.length === 0) {
      console.log("No API keys found to encrypt.");
      return;
    }

    console.log(`Found ${users.length} users with API keys.`);

    let encrypted = 0;
    let skipped = 0;
    let failed = 0;

    for (const user of users) {
      try {
        const apiKey = user.openrouter_api_key as string;

        // Check if already encrypted (has : separators)
        if (apiKey.includes(":") && apiKey.split(":").length === 3) {
          console.log(`Skipping user ${user.username} - API key already encrypted`);
          skipped++;
          continue;
        }

        // Encrypt the plain text API key
        const encryptedKey = encryptApiKey(apiKey);

        // Update database
        await sql`
          UPDATE "user" 
          SET openrouter_api_key = ${encryptedKey}, 
              updated_at = CURRENT_TIMESTAMP 
          WHERE id = ${user.id}
        `;

        console.log(`✓ Encrypted API key for user: ${user.username}`);
        encrypted++;
      } catch (error) {
        console.error(`✗ Failed to encrypt API key for user ${user.username}:`, error);
        failed++;
      }
    }

    console.log("\n=== Migration Summary ===");
    console.log(`Total users: ${users.length}`);
    console.log(`Encrypted: ${encrypted}`);
    console.log(`Skipped (already encrypted): ${skipped}`);
    console.log(`Failed: ${failed}`);
    console.log("=========================\n");

    if (failed > 0) {
      console.warn("⚠️  Some API keys failed to encrypt. Check the logs above.");
      process.exit(1);
    } else {
      console.log("✓ Migration completed successfully!");
      process.exit(0);
    }
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

// Run the migration
encryptExistingApiKeys();
