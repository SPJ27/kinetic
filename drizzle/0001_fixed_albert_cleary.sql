CREATE TABLE "deployments" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"docker_deployment_id" text,
	"status" text DEFAULT 'queued' NOT NULL,
	"port" integer GENERATED ALWAYS AS IDENTITY (sequence name "deployments_port_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 65000 START WITH 4000 CACHE 1),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"type" text DEFAULT 'deployment' NOT NULL,
	"started_at" timestamp,
	"finished_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "port" DROP IDENTITY;--> statement-breakpoint
ALTER TABLE "logs" ADD COLUMN "log_type" text NOT NULL;--> statement-breakpoint
ALTER TABLE "deployments" ADD CONSTRAINT "deployments_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "deployments_project_id_idx" ON "deployments" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "deployments_created_at_idx" ON "deployments" USING btree ("created_at");