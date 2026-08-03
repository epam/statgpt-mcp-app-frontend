import { alignLegendLeft, tightenGrid } from '../chartOptionTransforms';

describe('alignLegendLeft', () => {
  it('does nothing when there is no legend', () => {
    const option = { xAxis: { type: 'category' as const } };
    expect(alignLegendLeft(option)).toEqual(option);
  });

  it('sets left on a single legend', () => {
    const result = alignLegendLeft({ legend: { top: 0 } });
    expect(result.legend).toEqual({ top: 0, left: 'left' });
  });

  it('sets left on every legend in an array', () => {
    const result = alignLegendLeft({ legend: [{ top: 0 }, { top: 10 }] });
    expect(result.legend).toEqual([
      { top: 0, left: 'left' },
      { top: 10, left: 'left' },
    ]);
  });
});

describe('tightenGrid', () => {
  it('does nothing when there is no grid', () => {
    const option = { xAxis: { type: 'category' as const } };
    expect(tightenGrid(option)).toEqual(option);
  });

  it('zeroes left padding on a single grid, leaving right and other keys as-is', () => {
    const result = tightenGrid({
      grid: { left: '3%', right: '3%', bottom: '40px', containLabel: true },
    });
    expect(result.grid).toEqual({
      left: 0,
      right: '3%',
      bottom: '40px',
      containLabel: true,
    });
  });

  it('zeroes left padding on every grid in an array', () => {
    const result = tightenGrid({
      grid: [
        { left: '3%', right: '3%' },
        { left: '5%', right: '5%' },
      ],
    });
    expect(result.grid).toEqual([
      { left: 0, right: '3%' },
      { left: 0, right: '5%' },
    ]);
  });
});
