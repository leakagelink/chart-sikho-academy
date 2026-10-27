import { describe, it, expect } from 'vitest';
import { quizScore, makeCertificateNo, adminChangeSchema } from './admin-rules';

describe('quiz scoring', () => {
  it('adds marks for correct, subtracts negative marks for wrong, 0 for skipped', () => {
    const r = quizScore([{ correct: 'a', chosen: 'a', marks: 2 }, { correct: 'b', chosen: 'c', marks: 2 }, { correct: 'c', chosen: null, marks: 2 }], 0.5, 40);
    expect(r).toEqual({ score: 1.5, total: 6, percent: 25, passed: false });
  });
  it('never goes below zero', () => {
    expect(quizScore([{ correct: 'a', chosen: 'b', marks: 1 }], 1, 40).score).toBe(0);
  });
  it('passes exactly at pass marks', () => {
    expect(quizScore([{ correct: 'a', chosen: 'a', marks: 2 }, { correct: 'a', chosen: null, marks: 3 }], 0, 40).passed).toBe(true);
  });
});
describe('certificates', () => {
  it('formats IDs as CS-YEAR-XXXXXX', () => { expect(makeCertificateNo(2026, 'ab12cd')).toBe('CS-2026-AB12CD'); });
  it('admin may change quizzes, questions, certificates and reviews', () => {
    for (const r of ['quizzes', 'questions', 'certificates', 'reviews']) expect(adminChangeSchema.safeParse({ resource: r, values: {} }).success).toBe(true);
  });
});
