import { extractCallToolPayload, unwrapStructured } from '../utils';
import { BridgeError } from '../types';

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

describe('extractCallToolPayload', () => {
  it('returns the JSON-parsed text content on a successful call', () => {
    const result = {
      content: [{ type: 'text', text: '{"data":{"foo":1}}' }],
      structuredContent: { statusCode: 200, contentType: 'application/json' },
    };
    expect(extractCallToolPayload(result)).toEqual({ data: { foo: 1 } });
  });

  it('unwraps a result nested under `.result` before reading content', () => {
    const result = {
      result: {
        content: [{ type: 'text', text: '{"data":{"foo":2}}' }],
        structuredContent: { statusCode: 200 },
      },
    };
    expect(extractCallToolPayload(result)).toEqual({ data: { foo: 2 } });
  });

  it('throws when structuredContent.statusCode indicates an upstream error', () => {
    const result = {
      content: [{ type: 'text', text: 'not found' }],
      structuredContent: { statusCode: 404, contentType: 'text/plain' },
    };
    expect(() => extractCallToolPayload(result)).toThrow(BridgeError);
    expect(() => extractCallToolPayload(result)).toThrow(/404/);
  });

  it('throws when isError is true even without an error statusCode', () => {
    const result = {
      content: [{ type: 'text', text: 'boom' }],
      structuredContent: { statusCode: 200 },
      isError: true,
    };
    expect(() => extractCallToolPayload(result)).toThrow(BridgeError);
  });

  it('throws when there is no text content block', () => {
    const result = {
      content: [],
      structuredContent: { statusCode: 200 },
    };
    expect(() => extractCallToolPayload(result)).toThrow(BridgeError);
  });

  it('throws when the text content is not valid JSON', () => {
    const result = {
      content: [{ type: 'text', text: 'not json' }],
      structuredContent: { statusCode: 200 },
    };
    expect(() => extractCallToolPayload(result)).toThrow(BridgeError);
  });

  it('does not fall back to structuredContent as the payload', () => {
    const result = {
      structuredContent: { statusCode: 200, contentType: 'application/json' },
    };
    expect(() => extractCallToolPayload(result)).toThrow(BridgeError);
  });

  it('throws for non-object input', () => {
    expect(() => extractCallToolPayload(null)).toThrow(BridgeError);
    expect(() => extractCallToolPayload('hello')).toThrow(BridgeError);
  });
});
