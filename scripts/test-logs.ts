import "dotenv/config";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  const cols = await pool.query(
    "SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'logs' ORDER BY ordinal_position"
  );
  console.table(cols.rows);

  const project = await pool.query("SELECT id FROM projects ORDER BY created_at DESC LIMIT 1");
  const projectId = project.rows[0]?.id;

  if (!projectId) {
    console.log("No projects found, so there is nothing to attach a log row to.");
    return;
  }

  try {
    await pool.query(
      "INSERT INTO logs (id, output, type, project_id, log_type) VALUES (gen_random_uuid()::text, 'test', 'stdout', $1, 'deploy')",
      [projectId]
    );
    console.log("insert ok");
    await pool.query("DELETE FROM logs WHERE output = 'test'");
  } catch (e: any) {
    console.log("insert failed:", e.message, e.code, e.detail);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());