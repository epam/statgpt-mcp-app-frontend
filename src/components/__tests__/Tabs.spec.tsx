import { render, screen, fireEvent } from '@testing-library/react';
import { Tabs } from '../Tabs';

describe('Tabs', () => {
  const items = [
    { id: 'a', label: 'A', content: <div>Content A</div> },
    { id: 'b', label: 'B', content: <div>Content B</div> },
  ];

  it("renders the first item's content by default", () => {
    render(<Tabs items={items} />);
    expect(screen.getByText('Content A')).toBeInTheDocument();
    expect(screen.queryByText('Content B')).not.toBeInTheDocument();
  });

  it('switches content when a tab button is clicked', () => {
    render(<Tabs items={items} />);
    fireEvent.click(screen.getByRole('button', { name: 'B' }));
    expect(screen.getByText('Content B')).toBeInTheDocument();
    expect(screen.queryByText('Content A')).not.toBeInTheDocument();
  });

  it('marks the active tab button distinctly from inactive ones', () => {
    render(<Tabs items={items} />);
    const buttonA = screen.getByRole('button', { name: 'A' });
    const buttonB = screen.getByRole('button', { name: 'B' });
    expect(buttonA.className).toContain('border-semantic-info');
    expect(buttonB.className).not.toContain('border-semantic-info');
  });

  it('falls back to the first item when the previously-active id is no longer present', () => {
    const { rerender } = render(<Tabs items={items} />);
    fireEvent.click(screen.getByRole('button', { name: 'B' }));
    expect(screen.getByText('Content B')).toBeInTheDocument();

    rerender(<Tabs items={[items[0]]} />);
    expect(screen.getByText('Content A')).toBeInTheDocument();
  });

  it('stretches the panel and content slot to fill height when fillHeight is set', () => {
    const { container } = render(<Tabs items={items} fillHeight />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toContain('h-full');
    const contentSlot = screen.getByText('Content A').parentElement;
    expect(contentSlot?.className).toContain('flex-1');
  });

  it('does not add fill-height classes when fillHeight is not set', () => {
    const { container } = render(<Tabs items={items} />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.className).not.toContain('h-full');
    const contentSlot = screen.getByText('Content A').parentElement;
    expect(contentSlot?.className).not.toContain('flex-1');
  });
});
