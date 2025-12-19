import * as dotenv from "dotenv";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import postgres from "postgres";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, "../../../.env") });

const { DB_HOST, DB_NAME, DB_USER, DB_PASSWORD, DB_PORT } = process.env;

console.log("Connecting to database with the following parameters:");
console.log(`DB_HOST: ${DB_HOST}`);
console.log(`DB_NAME: ${DB_NAME}`);
console.log(`DB_USER: ${DB_USER}`);
console.log(`DB_PORT: ${DB_PORT}`);

const connectionString = `postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;

export const sql = postgres(connectionString, {
  // options if needed
});
