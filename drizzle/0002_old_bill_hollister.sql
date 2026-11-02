ALTER TABLE "projects" ALTER COLUMN "port" SET DEFAULT 4000;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "user_id" text DEFAULT 'vF16kpXdly62GDvKTZ0DOrN1qsR2kPEU' NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "subdomain" text NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;