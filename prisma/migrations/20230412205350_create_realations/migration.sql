-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_habbit_week_days" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "habit_id" TEXT NOT NULL,
    "week_day" INTEGER NOT NULL,
    CONSTRAINT "habbit_week_days_habit_id_fkey" FOREIGN KEY ("habit_id") REFERENCES "Habits" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_habbit_week_days" ("habit_id", "id", "week_day") SELECT "habit_id", "id", "week_day" FROM "habbit_week_days";
DROP TABLE "habbit_week_days";
ALTER TABLE "new_habbit_week_days" RENAME TO "habbit_week_days";
CREATE UNIQUE INDEX "habbit_week_days_habit_id_week_day_key" ON "habbit_week_days"("habit_id", "week_day");
CREATE TABLE "new_days_habits" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "day_id" TEXT NOT NULL,
    "habit_id" TEXT NOT NULL,
    CONSTRAINT "days_habits_day_id_fkey" FOREIGN KEY ("day_id") REFERENCES "days" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "days_habits_habit_id_fkey" FOREIGN KEY ("habit_id") REFERENCES "Habits" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_days_habits" ("day_id", "habit_id", "id") SELECT "day_id", "habit_id", "id" FROM "days_habits";
DROP TABLE "days_habits";
ALTER TABLE "new_days_habits" RENAME TO "days_habits";
CREATE UNIQUE INDEX "days_habits_day_id_habit_id_key" ON "days_habits"("day_id", "habit_id");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
