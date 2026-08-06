import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { Tabs } from '../Tabs';

describe('Tabs', () => {
  const items = [
    { id: 'a', label: 'A', content: <div>Content A</div> },
    { id: 'b', label: 'B', content: <div>Content B</div> },
  ];

  it('renders the content of the item matching activeId', () => {
    render(<Tabs items={items} activeId="a" onSelect={vi.fn()} />);
    expect(screen.getByText('Content A')).toBeInTheDocument();
    expect(screen.queryByText('Content B')).not.toBeInTheDocument();
  });

  it('renders a different item when activeId changes', () => {
    const { rerender } = render(
      <Tabs items={items} activeId="a" onSelect={vi.fn()} />,
    );
    rerender(<Tabs items={items} activeId="b" onSelect={vi.fn()} />);
    expect(screen.getByText('Content B')).toBeInTheDocument();
    expect(screen.queryByText('Content A')).not.toBeInTheDocument();
  });

  it('calls onSelect with the clicked item id, without switching content itself', () => {
    const onSelect = vi.fn();
    render(<Tabs items={items} activeId="a" onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('button', { name: 'B' }));
    expect(onSelect).toHaveBeenCalledWith('b');
    expect(screen.getByText('Content A')).toBeInTheDocument();
  });

  it('marks the active tab button distinctly from inactive ones', () => {
    render(<Tabs items={items} activeId="a" onSelect={vi.fn()} />);
    const buttonA = screen.getByRole('button', { name: 'A' });
    const buttonB = screen.getByRole('button', { name: 'B' });
    expect(buttonA.className).toContain('border-semantic-info');
    expect(buttonB.className).not.toContain('border-semantic-info');
  });

  it('stretches the panel and content slot to fill height when fillHeight is set', () => {
    const { container } = render(
      <Tabs items={items} activeId="a" onSelect={vi.fn()} fillHeight />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toContain('h-full');
    const contentSlot = screen.getByText('Content A').parentElement;
    expect(contentSlot?.className).toContain('flex-1');
  });

  it('does not add fill-height classes when fillHeight is not set', () => {
    const { container } = render(
      <Tabs items={items} activeId="a" onSelect={vi.fn()} />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.className).not.toContain('h-full');
    const contentSlot = screen.getByText('Content A').parentElement;
    expect(contentSlot?.className).not.toContain('flex-1');
  });
});
