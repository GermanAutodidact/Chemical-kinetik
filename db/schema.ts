import {sqliteTable,text,index} from 'drizzle-orm/sqlite-core';
export const suggestions=sqliteTable('suggestions',{
 id:text('id').primaryKey(),createdAt:text('created_at').notNull(),version:text('version').notNull(),
 location:text('location').notNull(),proposal:text('proposal').notNull(),reason:text('reason').notNull(),
 author:text('author').notNull(),status:text('status').notNull().default('proposed'),
 requestId:text('request_id').notNull().unique(),fingerprint:text('fingerprint').notNull(),
},t=>[index('suggestions_created').on(t.createdAt),index('suggestions_fingerprint_created').on(t.fingerprint,t.createdAt)]);
