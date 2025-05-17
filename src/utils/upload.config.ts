import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import { extname } from 'path';

export const storage = {
  storage: diskStorage({
    destination: './uploadfile',
    filename: (req, file, callback) => {
      const name = file.originalname.split('.')[0];
      const ext = extname(file.originalname);
      const randomName = name + '-' + Date.now() + ext;
      callback(null, randomName);
    },
  }),
  fileFilter: (req, file, callback) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedMimes.includes(file.mimetype)) {
      return callback(
        new BadRequestException('Ảnh phải có định dạng jpeg, png, gif'),
        false,
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      return callback(
        new BadRequestException('Tập tin có dung lượng hơn 5MB.'),
        false,
      );
    }
    callback(null, true);
  },
};
