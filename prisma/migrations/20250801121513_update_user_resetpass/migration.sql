-- AlterTable
ALTER TABLE `user` ADD COLUMN `lastResetAttempt` DATETIME(3) NULL,
    ADD COLUMN `resetAttempts` INTEGER NOT NULL DEFAULT 0;
