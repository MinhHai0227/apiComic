-- AlterTable
ALTER TABLE `comment` ADD COLUMN `replyToId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `comment` ADD CONSTRAINT `comment_replyToId_fkey` FOREIGN KEY (`replyToId`) REFERENCES `comment`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
