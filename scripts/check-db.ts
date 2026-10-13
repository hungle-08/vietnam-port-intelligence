import { loadEnvConfig } from "@next/env";
import { getDb } from "../src/lib/db";

async function main() {
  try {
    loadEnvConfig(process.cwd());
    const sql = getDb();
    const rows = await sql`SELECT 1 AS connected`;
    if (rows[0]?.connected !== 1) {
      throw new Error("Unexpected database response");
    }
    console.log("Neon: kết nối thành công (SELECT 1).");
  } catch {
    // Avoid printing connection credentials from driver errors.
    console.error(
      "Không thể kết nối Neon. Kiểm tra DATABASE_URL và kết nối mạng.",
    );
    process.exitCode = 1;
  }
}

void main();
