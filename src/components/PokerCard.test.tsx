import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PokerCard } from './PokerCard';

describe('PokerCard', () => {
  it('should render the card value', () => {
    render(<PokerCard value="5" isSelected={false} onClick={() => {}} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('should call onClick when clicked', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<PokerCard value="8" isSelected={false} onClick={handleClick} />);
    
    const card = screen.getByText('8').closest('div');
    await user.click(card!);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should apply selected styling when isSelected is true', () => {
    render(<PokerCard value="13" isSelected={true} onClick={() => {}} />);
    
    const card = screen.getByText('13').closest('div');
    expect(card).toHaveClass('ring-2', 'ring-primary', 'bg-primary/10');
  });

  it('should not apply selected styling when isSelected is false', () => {
    render(<PokerCard value="13" isSelected={false} onClick={() => {}} />);
    
    const card = screen.getByText('13').closest('div');
    expect(card).not.toHaveClass('ring-2');
  });

  it('should not call onClick when disabled', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<PokerCard value="3" isSelected={false} onClick={handleClick} disabled={true} />);
    
    const card = screen.getByText('3').closest('div');
    await user.click(card!);

    expect(handleClick).not.toHaveBeenCalled();
  });

  it('should apply disabled styling when disabled', () => {
    render(<PokerCard value="20" isSelected={false} onClick={() => {}} disabled={true} />);
    
    const card = screen.getByText('20').closest('div');
    expect(card).toHaveClass('opacity-50', 'cursor-not-allowed');
  });

  it('should render special card values', () => {
    const { rerender } = render(<PokerCard value="?" isSelected={false} onClick={() => {}} />);
    expect(screen.getByText('?')).toBeInTheDocument();

    rerender(<PokerCard value="☕" isSelected={false} onClick={() => {}} />);
    expect(screen.getByText('☕')).toBeInTheDocument();
  });
});
