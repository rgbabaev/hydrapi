"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typeCheck_1 = require("../typeCheck");
describe('Tests for any()', () => {
    it('any() will return any received value', () => {
        expect(typeCheck_1.any('This is a string')).toEqual('This is a string');
        expect(typeCheck_1.any('')).toEqual('');
        expect(typeCheck_1.any(123)).toEqual(123);
        expect(typeCheck_1.any(true)).toEqual(true);
        expect(typeCheck_1.any(false)).toEqual(false);
        expect(typeCheck_1.any(NaN)).toEqual(NaN);
        expect(typeCheck_1.any(undefined)).toEqual(undefined);
        expect(typeCheck_1.any(null)).toEqual(null);
        expect(typeCheck_1.any({})).toEqual({});
        expect(typeCheck_1.any([])).toEqual([]);
    });
});
describe('Tests for string()', () => {
    const errMsg = 'Must be a string.';
    it('string() will throw error on non-string values', () => {
        expect(() => typeCheck_1.string(123)).toThrowError(errMsg);
        expect(() => typeCheck_1.string(true)).toThrowError(errMsg);
        expect(() => typeCheck_1.string(false)).toThrowError(errMsg);
        expect(() => typeCheck_1.string(NaN)).toThrowError(errMsg);
        expect(() => typeCheck_1.string(undefined)).toThrowError(errMsg);
        expect(() => typeCheck_1.string(null)).toThrowError(errMsg);
        expect(() => typeCheck_1.string({})).toThrowError(errMsg);
        expect(() => typeCheck_1.string([])).toThrowError(errMsg);
    });
    it('string() will return string', () => {
        expect(typeCheck_1.string('azazza')).toEqual('azazza');
        expect(typeCheck_1.string('')).toEqual('');
    });
});
describe('Tests for urlCode()', () => {
    const errMsg = 'Must contain only lower case letters, digits and "-".';
    it('urlCode() will throw error on non-string values', () => {
        expect(() => typeCheck_1.urlCode(123)).toThrowError(errMsg);
        expect(() => typeCheck_1.urlCode(true)).toThrowError(errMsg);
        expect(() => typeCheck_1.urlCode(false)).toThrowError(errMsg);
        expect(() => typeCheck_1.urlCode(NaN)).toThrowError(errMsg);
        expect(() => typeCheck_1.urlCode(undefined)).toThrowError(errMsg);
        expect(() => typeCheck_1.urlCode(null)).toThrowError(errMsg);
        expect(() => typeCheck_1.urlCode({})).toThrowError(errMsg);
        expect(() => typeCheck_1.urlCode([])).toThrowError(errMsg);
    });
    it('urlCode() will throw on empty string', () => {
        expect(() => typeCheck_1.urlCode('')).toThrowError(errMsg);
    });
    it('urlCode() will throw on wrong values', () => {
        expect(() => typeCheck_1.urlCode('-qewrq-qwerq')).toThrowError(errMsg);
        expect(() => typeCheck_1.urlCode('qwfeqw-')).toThrowError(errMsg);
        expect(() => typeCheck_1.urlCode('-valueuw')).toThrowError(errMsg);
        expect(() => typeCheck_1.urlCode('aweger_aergrwe')).toThrowError(errMsg);
        expect(() => typeCheck_1.urlCode('_wrg_')).toThrowError(errMsg);
        expect(() => typeCheck_1.urlCode('new-co&de')).toThrowError(errMsg);
        expect(() => typeCheck_1.urlCode('awesome$code')).toThrowError(errMsg);
    });
    it('urlCode() will return string', () => {
        expect(typeCheck_1.urlCode('azazza')).toEqual('azazza');
    });
});
//# sourceMappingURL=typeCheck.js.map