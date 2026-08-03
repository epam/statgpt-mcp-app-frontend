import { CHART_SERIES_COLORS } from '../../../constants/chartColors';
import {
  getLegendItems,
  hideLegend,
  tightenGrid,
} from '../chartOptionTransforms';

describe('hideLegend', () => {
  it('does nothing when there is no legend', () => {
    const option = { xAxis: { type: 'category' as const } };
    expect(hideLegend(option)).toEqual(option);
  });

  it('sets show:false on a single legend, leaving other keys as-is', () => {
    const result = hideLegend({ legend: { top: 0 } });
    expect(result.legend).toEqual({ top: 0, show: false });
  });

  it('sets show:false on every legend in an array', () => {
    const result = hideLegend({ legend: [{ top: 0 }, { top: 10 }] });
    expect(result.legend).toEqual([
      { top: 0, show: false },
      { top: 10, show: false },
    ]);
  });
});

describe('getLegendItems', () => {
  it('returns nothing when there is no series', () => {
    expect(getLegendItems({})).toEqual([]);
  });

  it('skips series without a name', () => {
    const result = getLegendItems({ series: [{ type: 'line' }] });
    expect(result).toEqual([]);
  });

  it('assigns colors from a single series entry (not wrapped in an array)', () => {
    const result = getLegendItems({ series: { name: 'Total' } });
    expect(result).toEqual([{ name: 'Total', color: CHART_SERIES_COLORS[0] }]);
  });

  it("falls back to this widget's own palette when option.color is unset", () => {
    const result = getLegendItems({
      series: [{ name: 'A' }, { name: 'B' }, { name: 'C' }],
    });
    expect(result).toEqual([
      { name: 'A', color: CHART_SERIES_COLORS[0] },
      { name: 'B', color: CHART_SERIES_COLORS[1] },
      { name: 'C', color: CHART_SERIES_COLORS[2] },
    ]);
  });

  it('uses the option palette when set, cycling once series outnumber colors', () => {
    const result = getLegendItems({
      color: ['#111111', '#222222'],
      series: [{ name: 'A' }, { name: 'B' }, { name: 'C' }],
    });
    expect(result).toEqual([
      { name: 'A', color: '#111111' },
      { name: 'B', color: '#222222' },
      { name: 'C', color: '#111111' },
    ]);
  });
});

describe('tightenGrid', () => {
  it('does nothing when there is no grid', () => {
    const option = { xAxis: { type: 'category' as const } };
    expect(tightenGrid(option)).toEqual(option);
  });

  it('zeroes left and bottom padding on a single grid, leaving right and other keys as-is', () => {
    const result = tightenGrid({
      grid: { left: '3%', right: '3%', bottom: '40px', containLabel: true },
    });
    expect(result.grid).toEqual({
      left: 0,
      right: '3%',
      bottom: 0,
      containLabel: true,
    });
  });

  it('zeroes left and bottom padding on every grid in an array', () => {
    const result = tightenGrid({
      grid: [
        { left: '3%', right: '3%', bottom: '40px' },
        { left: '5%', right: '5%', bottom: '20px' },
      ],
    });
    expect(result.grid).toEqual([
      { left: 0, right: '3%', bottom: 0 },
      { left: 0, right: '5%', bottom: 0 },
    ]);
  });
});
