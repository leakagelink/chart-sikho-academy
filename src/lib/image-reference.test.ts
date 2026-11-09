import { describe, expect, it } from 'vitest';
import { storedImageReference } from './image-reference';
describe('stored website image references', () => {
  it('allows file links rather than embedded image payloads', () => {
    expect(storedImageReference.safeParse('/api/public/site-file/courses/55dbf6f1-7d1d-45be-b7db-5cad9e2434cc.jpg').success).toBe(true);
    expect(storedImageReference.safeParse('data:image/png;base64,aGVsbG8=').success).toBe(false);
  });
  it('does not accept private payment or identity paths', () => {
    expect(storedImageReference.safeParse('/api/public/site-file/kyc-documents/55dbf6f1-7d1d-45be-b7db-5cad9e2434cc.jpg').success).toBe(false);
  });
});