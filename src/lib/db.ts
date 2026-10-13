import "server-only";

import { neon } from "@neondatabase/serverless";

/** Use only from Server Components, Server Actions or Route Handlers. */
export function getDb() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      "Thiếu DATABASE_URL. Chạy neon env pull hoặc cấu hình .env.local.",
    );
  }

  // Resolve at query time so the UI can build without database credentials.
  return neon(databaseUrl);
}
