import { z } from 'zod';
export const storedImageReference = z.union([
  z.literal(''),
  z.string().max(500).regex(/^\/api\/public\/site-file\/(courses|categories|classes|webinars|seminars|ebooks|notifications|settings|banners)\/[0-9a-f-]{36}\.(png|jpg|webp|svg)$/),
  z.string().url().max(2000).startsWith('https://'),
]);