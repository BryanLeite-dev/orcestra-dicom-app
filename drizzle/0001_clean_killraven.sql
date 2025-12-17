ALTER TABLE "users" ALTER COLUMN "openId" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "googleId" varchar(128);--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_googleId_unique" UNIQUE("googleId");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_email_unique" UNIQUE("email");