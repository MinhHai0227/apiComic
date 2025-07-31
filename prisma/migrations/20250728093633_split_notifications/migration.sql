-- CreateTable
CREATE TABLE `ReplyNotification` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `message` VARCHAR(191) NOT NULL,
    `seen` BOOLEAN NOT NULL DEFAULT false,
    `userId` INTEGER NOT NULL,
    `commentId` INTEGER NOT NULL,
    `comicId` INTEGER NULL,
    `chapterId` INTEGER NULL,
    `create_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `ReplyNotification_userId_idx`(`userId`),
    INDEX `ReplyNotification_commentId_idx`(`commentId`),
    INDEX `ReplyNotification_comicId_idx`(`comicId`),
    INDEX `ReplyNotification_chapterId_idx`(`chapterId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ReplyNotification` ADD CONSTRAINT `ReplyNotification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReplyNotification` ADD CONSTRAINT `ReplyNotification_commentId_fkey` FOREIGN KEY (`commentId`) REFERENCES `comment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReplyNotification` ADD CONSTRAINT `ReplyNotification_comicId_fkey` FOREIGN KEY (`comicId`) REFERENCES `Comic`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReplyNotification` ADD CONSTRAINT `ReplyNotification_chapterId_fkey` FOREIGN KEY (`chapterId`) REFERENCES `Chapter`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
