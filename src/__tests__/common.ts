import { isEmpty } from '../common';

describe('Tests for isEmpty()', () => {
  it('isEmpty() will return false for boolean values', () => {
    expect(isEmpty(true)).toBeFalsy();
    expect(isEmpty(false)).toBeFalsy();
  });

  it('isEmpty() will return false for NaN', () => {
    expect(isEmpty(NaN)).toBeFalsy();
  });

  it('isEmpty() will return false for numbers', () => {
    expect(isEmpty(0)).toBeFalsy();
    expect(isEmpty(-100)).toBeFalsy();
    expect(isEmpty(1000)).toBeFalsy();
    expect(isEmpty(Infinity)).toBeFalsy();
  });

  it('isEmpty() will return true for empty string', () => {
    expect(isEmpty('')).toBeTruthy();
  });

  it('isEmpty() will return false for non-empty strings', () => {
    expect(isEmpty('k')).toBeFalsy();
  });

  it('isEmpty() will return true for empty objects and arrays', () => {
    expect(isEmpty({})).toBeTruthy();
    expect(isEmpty([])).toBeTruthy();
  });
});
