import {
  any,
  string,
  urlCode,
  date
} from '../typeCheck';

describe('Tests for any()', () => {
  it('any() will return any received value', () => {
    expect(any('This is a string')).toEqual('This is a string');
    expect(any('')).toEqual('');
    expect(any(123)).toEqual(123);
    expect(any(true)).toEqual(true);
    expect(any(false)).toEqual(false);
    expect(any(NaN)).toEqual(NaN);
    expect(any(undefined)).toEqual(undefined);
    expect(any(null)).toEqual(null);
    expect(any({})).toEqual({});
    expect(any([])).toEqual([]);
  });
});

describe('Tests for string()', () => {
  const errMsg = 'Must be a string.';

  it('string() will throw error on non-string values', () => {
    expect(() => string(123)).toThrowError(errMsg);
    expect(() => string(true)).toThrowError(errMsg);
    expect(() => string(false)).toThrowError(errMsg);
    expect(() => string(NaN)).toThrowError(errMsg);
    expect(() => string(undefined)).toThrowError(errMsg);
    expect(() => string(null)).toThrowError(errMsg);
    expect(() => string({})).toThrowError(errMsg);
    expect(() => string([])).toThrowError(errMsg);
  });
  it('string() will return string', () => {
    expect(string('azazza')).toEqual('azazza');
    expect(string('')).toEqual('');
  });
});

describe('Tests for urlCode()', () => {
  const errMsg = 'Must contain only lower case letters, digits and "-".';

  it('urlCode() will throw error on non-string values', () => {
    expect(() => urlCode(123)).toThrowError(errMsg);
    expect(() => urlCode(true)).toThrowError(errMsg);
    expect(() => urlCode(false)).toThrowError(errMsg);
    expect(() => urlCode(NaN)).toThrowError(errMsg);
    expect(() => urlCode(undefined)).toThrowError(errMsg);
    expect(() => urlCode(null)).toThrowError(errMsg);
    expect(() => urlCode({})).toThrowError(errMsg);
    expect(() => urlCode([])).toThrowError(errMsg);
  });
  it('urlCode() will throw on empty string', () => {
    expect(() => urlCode('')).toThrowError(errMsg);
  });
  it('urlCode() will throw on wrong values', () => {
    expect(() => urlCode('-qewrq-qwerq')).toThrowError(errMsg);
    expect(() => urlCode('qwfeqw-')).toThrowError(errMsg);
    expect(() => urlCode('-valueuw')).toThrowError(errMsg);
    expect(() => urlCode('aweger_aergrwe')).toThrowError(errMsg);
    expect(() => urlCode('_wrg_')).toThrowError(errMsg);
    expect(() => urlCode('new-co&de')).toThrowError(errMsg);
    expect(() => urlCode('awesome$code')).toThrowError(errMsg);
  });
  it('urlCode() will return string', () => {
    expect(urlCode('azazza')).toEqual('azazza');
  });
});

describe('Tests for Date()', () => {
  const errMsg = 'Must be a string compatible with Date().';

  it('date() will throw error on non-Date values', () => {
    expect(() => date('')).toThrowError(errMsg);
    expect(() => date('exa')).toThrowError(errMsg);
    expect(() => date(123)).toThrowError(errMsg);
    expect(() => date(true)).toThrowError(errMsg);
    expect(() => date(false)).toThrowError(errMsg);
    expect(() => date(NaN)).toThrowError(errMsg);
    expect(() => date(undefined)).toThrowError(errMsg);
    expect(() => date(null)).toThrowError(errMsg);
    expect(() => date({})).toThrowError(errMsg);
    expect(() => date([])).toThrowError(errMsg);
  });
  // it('date() will throw on wrong values', () => {
  // });
  it('date() will return Date', () => {
    expect(date('2016-05-18').getTime()).toEqual(new Date('2016-05-18').getTime());
    expect(date('2016-05-18T16:00:00Z')).toEqual(new Date('2016-05-18T16:00:00Z'));
  });
});
