import { useEffect } from 'react';

const ANIMATION_TOTAL_MS = 1400;

export interface FlyingEmoji {
  id: string;
  emoji: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

interface FlyingEmojiOverlayProps {
  emojis: FlyingEmoji[];
  onRemove: (id: string) => void;
}

const keyframes = `
  @keyframes flyEmoji {
    from { transform: translate(0, 0) scale(1); }
    to { transform: translate(var(--dx), var(--dy)) scale(1); }
  }
  @keyframes splatBounce {
    0%   { transform: translate(var(--dx), var(--dy)) scale(1); }
    40%  { transform: translate(var(--dx), var(--dy)) scale(1.6); }
    70%  { transform: translate(var(--dx), var(--dy)) scale(0.85); }
    100% { transform: translate(var(--dx), var(--dy)) scale(1.1); }
  }
  @keyframes fadeOut {
    from { opacity: 1;  transform: translate(var(--dx), var(--dy)) scale(1.1); }
    to   { opacity: 0;  transform: translate(var(--dx), var(--dy)) scale(1.1); }
  }
`;

function FlyingEmojiItem({
  flyingEmoji,
  onRemove,
}: {
  flyingEmoji: FlyingEmoji;
  onRemove: (id: string) => void;
}) {
  const { id, emoji, startX, startY, endX, endY } = flyingEmoji;

  useEffect(() => {
    const timer = setTimeout(() => onRemove(id), ANIMATION_TOTAL_MS);
    return () => clearTimeout(timer);
  }, [id, onRemove]);

  return (
    <span
      style={
        {
          position: 'absolute',
          left: startX,
          top: startY,
          fontSize: '2rem',
          lineHeight: 1,
          userSelect: 'none',
          animation: `flyEmoji 900ms ease-in-out forwards, splatBounce 250ms ease-out 900ms forwards, fadeOut 250ms ease-in 1150ms forwards`,
          '--dx': `${endX - startX}px`,
          '--dy': `${endY - startY}px`,
        } as React.CSSProperties
      }
    >
      {emoji}
    </span>
  );
}

export function FlyingEmojiOverlay({ emojis, onRemove }: FlyingEmojiOverlayProps) {
  return (
    <>
      <style>{keyframes}</style>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 9999,
        }}
      >
        {emojis.map((e) => (
          <FlyingEmojiItem key={e.id} flyingEmoji={e} onRemove={onRemove} />
        ))}
      </div>
    </>
  );
}
