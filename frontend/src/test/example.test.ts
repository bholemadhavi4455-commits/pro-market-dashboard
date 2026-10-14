import { describe, it, expect } from 'vitest';

describe('Test Infrastructure', () => {
  it('should run basic tests', () => {
    expect(1 + 1).toBe(2);
  });

  it('should support TypeScript', () => {
    const greeting: string = 'Hello, Test!';
    expect(greeting).toBe('Hello, Test!');
  });
});
