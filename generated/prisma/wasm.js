
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 6.6.0
 * Query Engine version: f676762280b54cd07c770017ed3711ddde35f37a
 */
Prisma.prismaVersion = {
  client: "6.6.0",
  engine: "f676762280b54cd07c770017ed3711ddde35f37a"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  username: 'username',
  email: 'email',
  password: 'password',
  avatar: 'avatar',
  role: 'role',
  total_coin: 'total_coin',
  refresh_token: 'refresh_token',
  resetPasswordToken: 'resetPasswordToken',
  resetAttempts: 'resetAttempts',
  lastResetAttempt: 'lastResetAttempt',
  create_at: 'create_at',
  update_at: 'update_at'
};

exports.Prisma.CoinScalarFieldEnum = {
  id: 'id',
  coin_amount: 'coin_amount',
  price: 'price',
  create_at: 'create_at'
};

exports.Prisma.TransactionScalarFieldEnum = {
  id: 'id',
  coin_amount: 'coin_amount',
  price: 'price',
  status: 'status',
  create_at: 'create_at',
  userId: 'userId',
  coinId: 'coinId'
};

exports.Prisma.CountryScalarFieldEnum = {
  id: 'id',
  name: 'name',
  create_at: 'create_at',
  update_at: 'update_at'
};

exports.Prisma.ComicScalarFieldEnum = {
  id: 'id',
  title: 'title',
  title_eng: 'title_eng',
  slug: 'slug',
  description: 'description',
  author: 'author',
  status: 'status',
  cover_image: 'cover_image',
  views: 'views',
  follower: 'follower',
  is_active: 'is_active',
  create_at: 'create_at',
  update_at: 'update_at',
  countryId: 'countryId'
};

exports.Prisma.CategoryScalarFieldEnum = {
  id: 'id',
  name: 'name',
  slug: 'slug',
  description: 'description',
  create_at: 'create_at',
  update_at: 'update_at'
};

exports.Prisma.ChapterScalarFieldEnum = {
  id: 'id',
  chapter_name: 'chapter_name',
  chapter_title: 'chapter_title',
  slug: 'slug',
  is_locked: 'is_locked',
  price_xu: 'price_xu',
  auto_unlock_time: 'auto_unlock_time',
  views: 'views',
  chapter_image_url: 'chapter_image_url',
  create_at: 'create_at',
  update_at: 'update_at',
  comicId: 'comicId'
};

exports.Prisma.Chapter_imageScalarFieldEnum = {
  id: 'id',
  image_url: 'image_url',
  chapterId: 'chapterId'
};

exports.Prisma.Chapter_unlockScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  chapterId: 'chapterId',
  unlock_time: 'unlock_time'
};

exports.Prisma.NotificationScalarFieldEnum = {
  id: 'id',
  message: 'message',
  seen: 'seen',
  type: 'type',
  create_at: 'create_at',
  userId: 'userId'
};

exports.Prisma.ReplyNotificationScalarFieldEnum = {
  id: 'id',
  message: 'message',
  seen: 'seen',
  userId: 'userId',
  commentId: 'commentId',
  comicId: 'comicId',
  chapterId: 'chapterId',
  create_at: 'create_at'
};

exports.Prisma.Comic_followerScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  comicId: 'comicId'
};

exports.Prisma.Comic_historyScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  comicId: 'comicId',
  chapterId: 'chapterId',
  read_time: 'read_time'
};

exports.Prisma.View_historyScalarFieldEnum = {
  id: 'id',
  comicId: 'comicId',
  chapterId: 'chapterId',
  views: 'views',
  create_at: 'create_at'
};

exports.Prisma.CommentScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  comicId: 'comicId',
  chapterId: 'chapterId',
  content: 'content',
  parentId: 'parentId',
  replyToId: 'replyToId',
  create_at: 'create_at'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};

exports.Prisma.UserOrderByRelevanceFieldEnum = {
  username: 'username',
  email: 'email',
  password: 'password',
  avatar: 'avatar',
  refresh_token: 'refresh_token',
  resetPasswordToken: 'resetPasswordToken'
};

exports.Prisma.CountryOrderByRelevanceFieldEnum = {
  name: 'name'
};

exports.Prisma.ComicOrderByRelevanceFieldEnum = {
  title: 'title',
  title_eng: 'title_eng',
  slug: 'slug',
  description: 'description',
  author: 'author',
  cover_image: 'cover_image'
};

exports.Prisma.CategoryOrderByRelevanceFieldEnum = {
  name: 'name',
  slug: 'slug',
  description: 'description'
};

exports.Prisma.ChapterOrderByRelevanceFieldEnum = {
  chapter_name: 'chapter_name',
  chapter_title: 'chapter_title',
  slug: 'slug',
  chapter_image_url: 'chapter_image_url'
};

exports.Prisma.chapter_imageOrderByRelevanceFieldEnum = {
  image_url: 'image_url'
};

exports.Prisma.NotificationOrderByRelevanceFieldEnum = {
  message: 'message'
};

exports.Prisma.ReplyNotificationOrderByRelevanceFieldEnum = {
  message: 'message'
};

exports.Prisma.commentOrderByRelevanceFieldEnum = {
  content: 'content'
};
exports.userRole = exports.$Enums.userRole = {
  admin: 'admin',
  editor: 'editor',
  user: 'user'
};

exports.transactionStatus = exports.$Enums.transactionStatus = {
  pending: 'pending',
  completed: 'completed',
  failed: 'failed'
};

exports.comicStatus = exports.$Enums.comicStatus = {
  onGoing: 'onGoing',
  complete: 'complete'
};

exports.notifiType = exports.$Enums.notifiType = {
  payment: 'payment',
  unlock: 'unlock',
  reply: 'reply'
};

exports.Prisma.ModelName = {
  User: 'User',
  Coin: 'Coin',
  Transaction: 'Transaction',
  Country: 'Country',
  Comic: 'Comic',
  Category: 'Category',
  Chapter: 'Chapter',
  chapter_image: 'chapter_image',
  chapter_unlock: 'chapter_unlock',
  Notification: 'Notification',
  ReplyNotification: 'ReplyNotification',
  comic_follower: 'comic_follower',
  comic_history: 'comic_history',
  view_history: 'view_history',
  comment: 'comment'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }

        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
