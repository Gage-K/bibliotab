CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" varchar(255) NOT NULL,
	"email" varchar(255),
	"created_at" timestamp DEFAULT now(),
	"last_login" timestamp,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "passwords" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"password" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tabs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"tab_name" varchar(255) NOT NULL,
	"tab_artist" varchar(255),
	"tuning" jsonb NOT NULL,
	"tab_data" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"modified_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "passwords" ADD CONSTRAINT "passwords_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tabs" ADD CONSTRAINT "tabs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_users_username" ON "users" USING btree ("username");--> statement-breakpoint
CREATE INDEX "idx_users_email" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_passwords_user_id" ON "passwords" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_tabs_user_id" ON "tabs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_tabs_modified_at" ON "tabs" USING btree ("modified_at" DESC NULLS LAST);