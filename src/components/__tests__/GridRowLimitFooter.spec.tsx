import { render, screen, fireEvent } from '@testing-library/react';
import { GridRowLimitFooter } from '../GridRowLimitFooter';
import { Platform } from '../../host/hostContext';

describe('GridRowLimitFooter', () => {
  it('renders the row count text and calls onOpenFullView when clicked', () => {
    const onOpenFullView = vi.fn();
    render(
      <GridRowLimitFooter
        total={12}
        visible={6}
        platform={Platform.Desktop}
        onOpenFullView={onOpenFullView}
      />,
    );
    expect(screen.getByText('Showing 6 of 12 results')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Open full view' }));
    expect(onOpenFullView).toHaveBeenCalledTimes(1);
  });
});
