import { render, screen } from '@testing-library/react';
import { ConnectionStatus } from '../ConnectionStatus';

describe('ConnectionStatus', () => {
  it('renders the main placeholder while connecting', () => {
    render(<ConnectionStatus phase="connecting" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders the error message as conversation-style text, matching the m-4 spacing used elsewhere', () => {
    const { container } = render(
      <ConnectionStatus phase="error" lastError="Handshake timed out" />,
    );
    expect(
      screen.getByText('Could not connect to the host'),
    ).toBeInTheDocument();
    expect(screen.getByText('Handshake timed out')).toBeInTheDocument();
    expect(container.querySelector('.m-4')).toBeInTheDocument();
  });

  it('renders the torndown message as conversation-style text, matching the m-4 spacing used elsewhere', () => {
    const { container } = render(<ConnectionStatus phase="torndown" />);
    expect(screen.getByText('Session ended by the host.')).toBeInTheDocument();
    expect(container.querySelector('.m-4')).toBeInTheDocument();
  });
});
