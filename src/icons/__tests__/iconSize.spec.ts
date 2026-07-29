import { Platform } from '../../host/hostContext';
import { ICON_SIZE } from '../iconSize';

describe('ICON_SIZE', () => {
  it('is 20px for desktop', () => {
    expect(ICON_SIZE[Platform.Desktop]).toBe(20);
  });

  it('is 24px for mobile', () => {
    expect(ICON_SIZE[Platform.Mobile]).toBe(24);
  });
});
