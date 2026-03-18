import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { FlyingEmojiOverlay } from './FlyingEmojiOverlay';
import type { FlyingEmoji } from './FlyingEmojiOverlay';

describe('FlyingEmojiOverlay', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders emoji text in the DOM given a FlyingEmoji entry', () => {
    const emojis: FlyingEmoji[] = [{ id: '1', emoji: '🎉', startX: 0, startY: 0, endX: 100, endY: 100 }];
    render(<FlyingEmojiOverlay emojis={emojis} onRemove={() => {}} />);
    expect(screen.getByText('🎉')).toBeInTheDocument();
  });

  it('calls onRemove with the correct id after animation duration', () => {
    vi.useFakeTimers();
    const onRemove = vi.fn();
    const emojis: FlyingEmoji[] = [{ id: 'abc', emoji: '👍', startX: 0, startY: 0, endX: 200, endY: 200 }];

    render(<FlyingEmojiOverlay emojis={emojis} onRemove={onRemove} />);

    expect(onRemove).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(1400));

    expect(onRemove).toHaveBeenCalledOnce();
    expect(onRemove).toHaveBeenCalledWith('abc');
  });

  it('two simultaneous emojis both render and both call onRemove independently', () => {
    vi.useFakeTimers();
    const onRemove = vi.fn();
    const emojis: FlyingEmoji[] = [
      { id: 'x1', emoji: '🔥', startX: 0, startY: 0, endX: 100, endY: 100 },
      { id: 'x2', emoji: '❤️', startX: 50, startY: 50, endX: 200, endY: 200 },
    ];

    render(<FlyingEmojiOverlay emojis={emojis} onRemove={onRemove} />);

    expect(screen.getByText('🔥')).toBeInTheDocument();
    expect(screen.getByText('❤️')).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(1400));

    expect(onRemove).toHaveBeenCalledTimes(2);
    expect(onRemove).toHaveBeenCalledWith('x1');
    expect(onRemove).toHaveBeenCalledWith('x2');
  });
});
