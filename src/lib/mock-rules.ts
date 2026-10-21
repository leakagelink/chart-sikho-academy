export function quizPassed(answers: number[], correct: number[]) {
  return correct.length > 0 && answers.length === correct.length && correct.every((value, index) => answers[index] === value);
}
export function certificateEligible(completed: number[], passed: boolean) {
  return [0, 1, 2].every((id) => completed.includes(id)) && passed;
}
export function saleCommission(kind: "signup" | "sale", verified: boolean, sampleAmount: number) {
  return kind === "sale" && verified ? sampleAmount : 0;
}