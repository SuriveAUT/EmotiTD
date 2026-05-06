import { Text, type TextStyleOptions } from 'pixi.js';

const FONT = 'Inter, system-ui, -apple-system, "Segoe UI", sans-serif';

export function makeText(text: string, opts: Partial<TextStyleOptions> = {}): Text {
  return new Text({
    text,
    style: {
      fontFamily: FONT,
      fontSize: 13,
      fill: 0xe8edf2,
      letterSpacing: 1,
      ...opts
    }
  });
}

export function makeLabel(text: string, opts: Partial<TextStyleOptions> = {}): Text {
  return makeText(text, {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 3,
    fill: 0x7d8ba6,
    ...opts
  });
}

export function makeHeadline(text: string, opts: Partial<TextStyleOptions> = {}): Text {
  return makeText(text, {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 2,
    ...opts
  });
}
