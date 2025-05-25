-- AlterTable
ALTER TABLE `category` MODIFY `description` TEXT NOT NULL;

-- AlterTable
ALTER TABLE `comic` MODIFY `description` TEXT NOT NULL;

-- AlterTable
ALTER TABLE `comment` MODIFY `content` TEXT NOT NULL;

-- CreateTable
CREATE TABLE `view_history` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `comicId` INTEGER NULL,
    `chapterId` INTEGER NULL,
    `views` INTEGER NOT NULL DEFAULT 1,
    `create_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `view_history_comicId_create_at_idx`(`comicId`, `create_at`),
    INDEX `view_history_chapterId_create_at_idx`(`chapterId`, `create_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `view_history` ADD CONSTRAINT `view_history_comicId_fkey` FOREIGN KEY (`comicId`) REFERENCES `Comic`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `view_history` ADD CONSTRAINT `view_history_chapterId_fkey` FOREIGN KEY (`chapterId`) REFERENCES `Chapter`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
