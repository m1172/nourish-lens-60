import React, { useEffect, useState } from 'react';
import { Check } from 'lucide-react';

type Item = { label: string; detail: string };

type Props = {
  items: Item[];
  onComplete?: () => void;
};

export default function CustomizingStep({ items, onComplete }: Props) {
  const [customizingProgress, setCustomizingProgress] = useState(0);
  const [visibleItems, setVisibleItems] = useState<number[]>([]);

  useEffect(() => {
    setCustomizingProgress(0);
    setVisibleItems([]);

    const itemDelay = 800;
    const timers: NodeJS.Timeout[] = [];

    items.forEach((_, i) => {
      timers.push(
        setTimeout(() => {
          setVisibleItems((prev) => [...prev, i]);
        }, i * itemDelay)
      );
    });

    const interval = setInterval(() => {
      setCustomizingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => onComplete && onComplete(), 600);
          return 100;
        }
        return prev + 5;
      });
    }, 300);

    return () => {
      timers.forEach(clearTimeout);
      clearInterval(interval);
    };
  }, [items, onComplete]);

  return (
    <div className='space-y-8'>
      <h2 className='text-3xl font-bold text-center'>
        Customizing your program
      </h2>
      <div className='space-y-6 py-8'>
        {items.map((item, idx) => {
          const itemProgress = Math.max(0, customizingProgress - idx * 25);
          const isComplete = customizingProgress > idx * 25 + 25;
          const isProcessing = itemProgress > 0 && itemProgress <= 25;

          return (
            <div
              key={item.label}
              className='space-y-2 transition-all duration-500'
              style={{
                opacity: visibleItems.includes(idx) ? 1 : 0,
                transform: visibleItems.includes(idx)
                  ? 'translateY(0)'
                  : 'translateY(10px)',
                transitionDelay: `${idx * 0.1}s`,
              }}
            >
              <div className='flex justify-between items-center'>
                <span className='text-muted-foreground'>{item.label}:</span>
                <div className='flex items-center gap-2'>
                  <span className='font-semibold'>{item.detail}</span>
                  {isProcessing && (
                    <div className='relative w-6 h-6'>
                      <svg className='w-6 h-6' viewBox='0 0 24 24'>
                        <circle
                          cx='12'
                          cy='12'
                          r='10'
                          fill='none'
                          stroke='currentColor'
                          strokeWidth='4'
                          className='text-muted-foreground/30'
                        />
                        <circle
                          cx='12'
                          cy='12'
                          r='10'
                          fill='none'
                          stroke='currentColor'
                          strokeWidth='4'
                          className='text-primary transition-all duration-300'
                          style={{
                            strokeDasharray: `${2 * Math.PI * 10}`,
                            strokeDashoffset: `${
                              2 * Math.PI * 10 * (1 - itemProgress / 25)
                            }`,
                            strokeLinecap: 'round',
                            transform: 'rotate(-90deg)',
                            transformOrigin: '12px 12px',
                          }}
                        />
                      </svg>
                    </div>
                  )}
                  {isComplete && <Check className='w-5 h-5 text-primary' />}
                </div>
              </div>
              <div className='h-2 bg-muted rounded-full overflow-hidden'>
                <div
                  className='h-full bg-primary transition-all duration-500'
                  style={{
                    width: `${Math.min(100, Math.max(0, itemProgress * 4))}%`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
