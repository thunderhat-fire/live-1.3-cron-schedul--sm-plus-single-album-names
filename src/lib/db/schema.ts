import { relations } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
  boolean,
} from 'drizzle-orm/pg-core';

// Users table
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  image: varchar('image', { length: 255 }),
  role: varchar('role', { length: 20 }).default('user').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Forum Categories (e.g., General Discussion, Vinyl Talk, Technical Support)
export const forumCategory = pgTable('forum_category', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  order: integer('order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Forum Threads
export const forumThread = pgTable('forum_thread', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 200 }).notNull(),
  content: text('content').notNull(),
  categoryId: uuid('category_id').references(() => forumCategory.id, { onDelete: 'cascade' }).notNull(),
  authorId: uuid('author_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  isPinned: boolean('is_pinned').default(false).notNull(),
  isLocked: boolean('is_locked').default(false).notNull(),
  viewCount: integer('view_count').default(0).notNull(),
  lastReplyAt: timestamp('last_reply_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Forum Replies
export const forumReply = pgTable('forum_reply', {
  id: uuid('id').defaultRandom().primaryKey(),
  content: text('content').notNull(),
  threadId: uuid('thread_id').references(() => forumThread.id, { onDelete: 'cascade' }).notNull(),
  authorId: uuid('author_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  isEdited: boolean('is_edited').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Forum Reactions (likes, etc.)
export const forumReaction = pgTable('forum_reaction', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  threadId: uuid('thread_id').references(() => forumThread.id, { onDelete: 'cascade' }),
  replyId: uuid('reply_id').references(() => forumReply.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 20 }).notNull(), // 'like', 'helpful', etc.
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Add relationships to existing User type
export const userRelations = relations(users, ({ many }) => ({
  threads: many(forumThread),
  replies: many(forumReply),
  reactions: many(forumReaction),
}));

// Add relationships to Forum Category
export const forumCategoryRelations = relations(forumCategory, ({ many }) => ({
  threads: many(forumThread),
}));

// Add relationships to Forum Thread
export const forumThreadRelations = relations(forumThread, ({ one, many }) => ({
  category: one(forumCategory, {
    fields: [forumThread.categoryId],
    references: [forumCategory.id],
  }),
  author: one(users, {
    fields: [forumThread.authorId],
    references: [users.id],
  }),
  replies: many(forumReply),
  reactions: many(forumReaction),
}));

// Add relationships to Forum Reply
export const forumReplyRelations = relations(forumReply, ({ one, many }) => ({
  thread: one(forumThread, {
    fields: [forumReply.threadId],
    references: [forumThread.id],
  }),
  author: one(users, {
    fields: [forumReply.authorId],
    references: [users.id],
  }),
  reactions: many(forumReaction),
})); 