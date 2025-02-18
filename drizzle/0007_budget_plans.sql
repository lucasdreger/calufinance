CREATE TABLE IF NOT EXISTS "public"."budget_plans" (
    "id" serial PRIMARY KEY,
    "user_id" uuid NOT NULL,
    "name" varchar(255) NOT NULL,
    "description" text,
    "start_date" date NOT NULL,
    "end_date" date NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "budget_plans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "budget_plans_user_id_idx" ON "public"."budget_plans" ("user_id");
