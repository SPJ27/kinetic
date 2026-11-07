CREATE TABLE "metrics" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text,
	"container_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"value" text,
	"project_id" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "deployments" ADD COLUMN "commit" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "status" text DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "commit" text;--> statement-breakpoint
ALTER TABLE "metrics" ADD CONSTRAINT "metrics_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;