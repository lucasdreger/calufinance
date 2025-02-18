CREATE TABLE IF NOT EXISTS "public"."budget_plans" (
    "id" serial PRIMARY KEY,
    "user_id" uuid NOT NULL REFERENCES "public"."users"("id") ON DELETE CASCADE,
    "name" varchar(255) NOT NULL,
    "description" text,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX budget_plans_user_id_idx ON "public"."budget_plans" ("user_id");
