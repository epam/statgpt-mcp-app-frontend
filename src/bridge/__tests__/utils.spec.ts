import { unwrapStructured } from '../utils';

describe('unwrapStructured', () => {
  it('extracts structuredContent from a root envelope', () => {
    const payload = { id: 1 };
    expect(unwrapStructured({ structuredContent: payload })).toBe(payload);
  });

  it('extracts structured_content from a root envelope', () => {
    const payload = { id: 2 };
    expect(unwrapStructured({ structured_content: payload })).toBe(payload);
  });

  it('extracts structuredContent nested under result', () => {
    const payload = { id: 3 };
    expect(unwrapStructured({ result: { structuredContent: payload } })).toBe(
      payload,
    );
  });

  it('extracts structured_content nested under result', () => {
    const payload = { id: 4 };
    expect(unwrapStructured({ result: { structured_content: payload } })).toBe(
      payload,
    );
  });

  it('returns the input unchanged when no known envelope key is present', () => {
    const input = { foo: 'bar', baz: 42 };
    expect(unwrapStructured(input)).toBe(input);
  });

  it('returns an empty object unchanged', () => {
    const input = {};
    expect(unwrapStructured(input)).toBe(input);
  });

  it('returns null unchanged', () => {
    expect(unwrapStructured(null)).toBeNull();
  });

  it('returns a number unchanged', () => {
    expect(unwrapStructured(42)).toBe(42);
  });

  it('returns a string unchanged', () => {
    expect(unwrapStructured('hello')).toBe('hello');
  });
});
