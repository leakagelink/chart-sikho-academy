import { describe, it, expect } from 'vitest';
import { quizScore, makeCertificateNo, adminChangeSchema, earnsCertificate, CERTIFICATE_MIN_PERCENT } from './admin-rules';

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

describe('course certificate rule', () => {
  it('issues a certificate at 8 out of 10 (80%)', () => {
    const answers = Array.from({ length: 10 }, (_, i) => ({ correct: 'a', chosen: i < 8 ? 'a' : 'b', marks: 1 }));
    expect(earnsCertificate(quizScore(answers, 0, 40).percent)).toBe(true);
  });
  it('does not issue a certificate at 7 out of 10 (70%)', () => {
    const answers = Array.from({ length: 10 }, (_, i) => ({ correct: 'a', chosen: i < 7 ? 'a' : 'b', marks: 1 }));
    expect(earnsCertificate(quizScore(answers, 0, 40).percent)).toBe(false);
  });
  it('threshold is 80%', () => { expect(CERTIFICATE_MIN_PERCENT).toBe(80); expect(earnsCertificate(79.99)).toBe(false); });
});
