import { pgTable, text, timestamp, real, bigint, index } from "drizzle-orm/pg-core";
import { randomUUID } from "node:crypto";
import { projects } from "./projects";

const bytes = (name: string) => bigint(name, { mode: "number" }).notNull().default(0);

export const metrics = pgTable(
  "metrics",
  {
    id: text("id").primaryKey().$defaultFn(() => randomUUID()),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    containerId: text("container_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    cpuPercent: real("cpu_percent").notNull().default(0),
    memUsedBytes: bytes("mem_used_bytes"),
    memLimitBytes: bytes("mem_limit_bytes"),
    netRxBytes: bytes("net_rx_bytes"),    
    netTxBytes: bytes("net_tx_bytes"),
    blockReadBytes: bytes("block_read_bytes"),  
    blockWriteBytes: bytes("block_write_bytes"),
  },
  (t) => [index("metrics_project_created_idx").on(t.projectId, t.createdAt)]
);