CREATE TABLE "domains" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"domain" text[] DEFAULT '{}' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "status" SET DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "encrypted_env" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "metrics" ADD COLUMN "cpu_percent" real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "metrics" ADD COLUMN "mem_used_bytes" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "metrics" ADD COLUMN "mem_limit_bytes" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "metrics" ADD COLUMN "net_rx_bytes" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "metrics" ADD COLUMN "net_tx_bytes" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "metrics" ADD COLUMN "block_read_bytes" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "metrics" ADD COLUMN "block_write_bytes" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "domains" ADD CONSTRAINT "domains_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "domains_project_id_idx" ON "domains" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "domains_created_at_idx" ON "domains" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "metrics_project_created_idx" ON "metrics" USING btree ("project_id","created_at");--> statement-breakpoint
ALTER TABLE "metrics" DROP COLUMN "type";--> statement-breakpoint
ALTER TABLE "metrics" DROP COLUMN "value";