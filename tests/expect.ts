// expect.ts
// A small expect() on top of node:assert, so tests read like before without a test framework.
//   expect(value).toBe(other)   toEqual   toBeTruthy   toBeNull   toBeUndefined
//   toContain   toBeGreaterThan   toHaveProperty   toThrow   expect(value).not.toBeNull()

import assert from "node:assert/strict";

export interface Matchers {
  toBe(expected: unknown): void;
  toEqual(expected: unknown): void;
  toBeTruthy(): void;
  toBeNull(): void;
  toBeUndefined(): void;
  toContain(expected: string): void;
  toBeGreaterThan(expected: number): void;
  toHaveProperty(propertyName: string, expected: unknown): void;
  toThrow(expected?: RegExp): void;
  not: { toBeNull(): void };
}

class ValueMatchers implements Matchers {
  private readonly actual: unknown;
  readonly not: { toBeNull(): void };

  constructor(actual: unknown) {
    this.actual = actual;
    this.not = new NotMatchers(actual);
  }

  toBe(expected: unknown): void {
    assert.equal(this.actual, expected);
  }

  toEqual(expected: unknown): void {
    assert.deepEqual(this.actual, expected);
  }

  toBeTruthy(): void {
    assert.ok(this.actual);
  }

  toBeNull(): void {
    assert.equal(this.actual, null);
  }

  toBeUndefined(): void {
    assert.equal(this.actual, undefined);
  }

  toContain(expected: string): void {
    const actualText = String(this.actual);
    assert.ok(actualText.includes(expected), `"${actualText}" does not contain "${expected}"`);
  }

  toBeGreaterThan(expected: number): void {
    const actualNumber = Number(this.actual);
    assert.ok(actualNumber > expected, `${actualNumber} is not greater than ${expected}`);
  }

  toHaveProperty(propertyName: string, expected: unknown): void {
    const record = this.actual as Record<string, unknown>;
    assert.equal(record[propertyName], expected);
  }

  toThrow(expected?: RegExp): void {
    const action = this.actual as () => void;
    if (expected) {
      assert.throws(action, expected);
      return;
    }
    assert.throws(action);
  }
}

class NotMatchers {
  private readonly actual: unknown;

  constructor(actual: unknown) {
    this.actual = actual;
  }

  toBeNull(): void {
    assert.notEqual(this.actual, null);
  }
}

export function expect(actual: unknown): Matchers {
  return new ValueMatchers(actual);
}
