import type { NodeTypeId } from './types';

const VALID_TYPES: NodeTypeId[] = ['lesson-quiz', 'interactive', 'flashcards', 'ai-tutor'];

export function validateNodeMeta(id: string, data: unknown): string[] {
  const problems: string[] = [];
  const d = data as Record<string, unknown>;

  if (typeof d !== 'object' || d === null) {
    return [`node "${id}": frontmatter is not an object`];
  }

  if (typeof d.title !== 'string' || d.title.trim() === '') {
    problems.push(`node "${id}": title is missing or not a string`);
  }

  if (!VALID_TYPES.includes(d.type as NodeTypeId)) {
    problems.push(
      `node "${id}": type must be one of ${VALID_TYPES.map((t) => `'${t}'`).join(', ')}, got ${JSON.stringify(d.type)}`,
    );
  }

  if (typeof d.xp !== 'number' || !Number.isFinite(d.xp)) {
    problems.push(`node "${id}": xp must be a number, got ${JSON.stringify(d.xp)}`);
  }

  if (typeof d.estMinutes !== 'number' || !Number.isFinite(d.estMinutes)) {
    problems.push(`node "${id}": estMinutes must be a number, got ${JSON.stringify(d.estMinutes)}`);
  }

  if (d.questions !== undefined) {
    if (!Array.isArray(d.questions)) {
      problems.push(`node "${id}": questions must be an array`);
    } else {
      (d.questions as unknown[]).forEach((q, i) => {
        const qo = q as Record<string, unknown>;
        if (typeof qo.id !== 'string') {
          problems.push(`node "${id}": questions[${i}].id must be a string`);
        }
        if (typeof qo.prompt !== 'string') {
          problems.push(`node "${id}": questions[${i}].prompt must be a string`);
        }
        if (!Array.isArray(qo.choices) || !(qo.choices as unknown[]).every((c) => typeof c === 'string')) {
          problems.push(`node "${id}": questions[${i}].choices must be an array of strings`);
        }
        if (typeof qo.answerIndex !== 'number' || !Number.isFinite(qo.answerIndex)) {
          problems.push(`node "${id}": questions[${i}].answerIndex must be a number, got ${JSON.stringify(qo.answerIndex)}`);
        }
      });
    }
  }

  return problems;
}
