import { expect, it } from 'vitest';
import { applyMemberBatch, selectedVisibleIds } from './member-selection';

it('Select All actions are limited to visible selected members', () => {
  expect(selectedVisibleIds(['one', 'two', 'hidden'], ['one', 'two'])).toEqual(['one', 'two']);
  expect(selectedVisibleIds([], ['one', 'two'])).toEqual([]);
});
it('applies once per member and reports failures without stopping remaining members', async () => {
  const changed: string[] = [];
  const result = await applyMemberBatch(['one', 'two', 'one', 'three'], async id => {
    if (id === 'two') throw new Error('Forbidden');
    changed.push(id);
  });
  expect(changed).toEqual(['one', 'three']);
  expect(result).toEqual({ succeeded: 2, failed: ['two'] });
});