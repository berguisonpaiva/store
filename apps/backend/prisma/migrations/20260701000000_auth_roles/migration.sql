-- RN01: reduce the `UserRole` enum to ADMIN/OPERADOR (remove MASTER).
-- Postgres cannot drop a value from an enum in place, so the type is recreated:
-- existing MASTER rows are migrated to ADMIN before the old type is dropped.

-- Migrate existing data off the value being removed.
UPDATE "users" SET "role" = 'ADMIN' WHERE "role" = 'MASTER';

-- Recreate the enum without MASTER.
ALTER TYPE "UserRole" RENAME TO "UserRole_old";

CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'OPERADOR');

ALTER TABLE "users"
  ALTER COLUMN "role" TYPE "UserRole"
  USING ("role"::text::"UserRole");

DROP TYPE "UserRole_old";
