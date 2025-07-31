-- DropForeignKey
ALTER TABLE `comment` DROP FOREIGN KEY `comment_parentId_fkey`;

-- DropForeignKey
ALTER TABLE `comment` DROP FOREIGN KEY `comment_replyToId_fkey`;

-- DropIndex
DROP INDEX `comment_replyToId_fkey` ON `comment`;

-- AddForeignKey
ALTER TABLE `comment` ADD CONSTRAINT `comment_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `comment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `comment` ADD CONSTRAINT `comment_replyToId_fkey` FOREIGN KEY (`replyToId`) REFERENCES `comment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
