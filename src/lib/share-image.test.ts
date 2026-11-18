import { expect, it } from 'vitest';
import { shareDescription, shareImageUrl } from './share-image';
it('makes uploaded eBook covers absolute and share-sized (600px)', () => {
  expect(shareImageUrl('/api/public/site-file/ebooks/a.jpg')).toBe('https://chartsikho.in/api/public/site-file/ebooks/a.jpg?w=600');
});
it('requests an 800px rendition of uploaded artwork', () => {
  expect(shareImageUrl('https://chartsikho.in/__l5e/assets-v1/x/y.jpg')).toBe('https://chartsikho.in/__l5e/assets-v1/x/y.jpg?w=800');
});
it('skips missing or inline pictures', () => {
  expect(shareImageUrl('')).toBe('');
  expect(shareImageUrl('data:image/png;base64,AAA')).toBe('');
  expect(shareImageUrl('http://insecure.example/a.jpg')).toBe('');
});
it('cleans markdown descriptions', () => expect(shareDescription('## **Learn** charts', 'x')).toBe('Learn charts'));
