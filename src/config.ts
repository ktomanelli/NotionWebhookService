import * as dotenv from 'dotenv';
dotenv.config();

export const notionKey = process.env.NOTION_KEY || '';
export const notionUserId = process.env.NOTION_USER_ID || '';