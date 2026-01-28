import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { CardValue } from '@/types';

interface PokerCardProps {
  value: CardValue;
  isSelected: boolean;
  isRevealed?: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export function PokerCard({ value, isSelected, isRevealed = false, onClick, disabled = false }: PokerCardProps) {
  return (
    <Card
      className={cn(
        'w-20 h-28 flex items-center justify-center cursor-pointer transition-all hover:scale-105',
        isSelected && 'ring-2 ring-primary bg-primary/10',
        disabled && 'opacity-50 cursor-not-allowed hover:scale-100'
      )}
      onClick={disabled ? undefined : onClick}
    >
      <span className="text-3xl font-bold">{isRevealed || isSelected ? value : '🂠'}</span>
    </Card>
  );
}
