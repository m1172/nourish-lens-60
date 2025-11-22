import { useEffect, useRef, useCallback } from 'react';

interface PickerProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  unit?: string;
  step?: number;
}

export function Picker({
  value,
  onChange,
  min,
  max,
  unit = '',
  step = 1,
}: PickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);
  const rafIdRef = useRef<number | null>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMountRef = useRef(true);

  // Initial scroll to value on mount
  useEffect(() => {
    const scrollToInitialValue = () => {
      if (containerRef.current && containerRef.current.scrollHeight > 0) {
        const index = Math.round((value - min) / step);
        const scrollPosition = index * 60; // 60px per item
        // Use 'auto' for initial mount to set position instantly
        containerRef.current.scrollTo({
          top: scrollPosition,
          behavior: 'auto',
        });
        isInitialMountRef.current = false;
        return true;
      }
      return false;
    };

    // Try immediately
    if (scrollToInitialValue()) return;

    // If not ready, try after a frame
    const timer = requestAnimationFrame(() => {
      if (!scrollToInitialValue()) {
        // If still not ready, try after a short delay
        setTimeout(scrollToInitialValue, 50);
      }
    });
    return () => cancelAnimationFrame(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount, but we need value/min/step from closure

  // Update scroll position when value changes (after initial mount)
  useEffect(() => {
    if (
      containerRef.current &&
      !isScrollingRef.current &&
      !isInitialMountRef.current
    ) {
      const index = Math.round((value - min) / step);
      const scrollPosition = index * 60; // 60px per item
      containerRef.current.scrollTo({
        top: scrollPosition,
        behavior: 'smooth',
      });
    }
  }, [value, min, step]);

  const handleScroll = useCallback(() => {
    if (!containerRef.current || isScrollingRef.current) return;

    // Cancel any pending animation frame
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
    }

    // Use requestAnimationFrame for smooth performance
    rafIdRef.current = requestAnimationFrame(() => {
      if (!containerRef.current) return;

      const scrollTop = containerRef.current.scrollTop;
      const index = Math.round(scrollTop / 60);
      const newValue = min + index * step;

      if (newValue >= min && newValue <= max && newValue !== value) {
        onChange(newValue);
      }
    });

    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // Mark as scrolling
    isScrollingRef.current = true;

    // Reset scrolling flag after scroll ends
    scrollTimeoutRef.current = setTimeout(() => {
      isScrollingRef.current = false;
      rafIdRef.current = null;
    }, 150);
  }, [min, max, step, value, onChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  const items = [];
  for (let i = min; i <= max; i += step) {
    items.push(i);
  }

  return (
    <div className='relative w-full h-[240px] overflow-hidden touch-pan-y'>
      {/* Top fade */}
      <div className='absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-background to-transparent z-10 pointer-events-none' />

      {/* Selected item background */}
      <div className='absolute top-1/2 -translate-y-1/2 left-0 right-0 h-[60px] bg-muted/50 rounded-2xl z-0' />

      {/* Bottom fade */}
      <div className='absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none' />

      <div
        ref={containerRef}
        onScroll={handleScroll}
        className='h-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide touch-pan-y'
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          paddingTop: '90px',
          paddingBottom: '90px',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {items.map((item) => (
          <div
            key={item}
            className='h-[60px] flex items-center justify-center snap-center'
          >
            <span
              className={`text-3xl font-bold transition-all duration-150 ${
                item === value
                  ? 'text-foreground scale-110'
                  : Math.abs(item - value) <= step
                  ? 'text-muted-foreground/60 scale-95'
                  : 'text-muted-foreground/30 scale-90'
              }`}
            >
              {item}
              {item === value && unit && (
                <span className='text-xl ml-1 text-muted-foreground'>
                  {unit}
                </span>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface RulerPickerProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  unit: string;
  step?: number;
  decimalPlaces?: number;
}

export function RulerPicker({
  value,
  onChange,
  min,
  max,
  unit,
  step = 0.1,
  decimalPlaces = 1,
}: RulerPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const firstMarkRef = useRef<HTMLDivElement | null>(null);
  const metricsRef = useRef<{ stepWidth: number; firstCenter: number } | null>(
    null
  );

  const isScrollingRef = useRef(false);
  const rafIdRef = useRef<number | null>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMountRef = useRef(true);

  const totalSteps = Math.round((max - min) / step);

  const getEffectiveScrollWidth = useCallback(() => {
    if (!containerRef.current) return 0;

    // Actual scrollable distance from min to max once the viewport width is removed
    const scrollWidth =
      containerRef.current.scrollWidth - containerRef.current.clientWidth;
    return scrollWidth > 0 ? scrollWidth : 0;
  }, []);

  // Measure spacing so scroll position maps cleanly to the numeric value
  const measureMetrics = useCallback(() => {
    if (!containerRef.current || !firstMarkRef.current) return;

    const firstMark = firstMarkRef.current;
    const secondMark = firstMark.nextElementSibling as HTMLDivElement | null;
    const spacing =
      secondMark && secondMark.offsetLeft !== undefined
        ? secondMark.offsetLeft - firstMark.offsetLeft
        : 0;

    const fallbackSpacing =
      totalSteps > 0 ? getEffectiveScrollWidth() / totalSteps : 0;
    const stepWidth = spacing || fallbackSpacing;

    if (stepWidth <= 0) return;

    const firstCenter = firstMark.offsetLeft + firstMark.offsetWidth / 2;
    metricsRef.current = { stepWidth, firstCenter };
  }, [getEffectiveScrollWidth, totalSteps]);

  const scrollToValue = (targetValue: number, behavior: ScrollBehavior) => {
    const container = containerRef.current;
    if (!container || totalSteps <= 0) return;

    if (!metricsRef.current) {
      measureMetrics();
    }

    const clampedValue = Math.min(Math.max(targetValue, min), max);
    const index = Math.round((clampedValue - min) / step);
    const clampedIndex = Math.min(Math.max(index, 0), totalSteps);

    const metrics = metricsRef.current;
    if (metrics) {
      const scrollPosition =
        metrics.firstCenter +
        clampedIndex * metrics.stepWidth -
        container.clientWidth / 2;

      container.scrollTo({
        left: scrollPosition,
        behavior,
      });
      return;
    }

    const effectiveScrollWidth = getEffectiveScrollWidth();
    if (effectiveScrollWidth <= 0 || max === min) return;

    const percentage = clampedIndex / totalSteps;
    const scrollPosition = percentage * effectiveScrollWidth;

    container.scrollTo({
      left: scrollPosition,
      behavior,
    });
  };

  useEffect(() => {
    measureMetrics();
    window.addEventListener('resize', measureMetrics);

    return () => window.removeEventListener('resize', measureMetrics);
  }, [measureMetrics]);

  // Initial scroll to value on mount
  useEffect(() => {
    const scrollToInitialValue = () => {
      if (!containerRef.current || containerRef.current.scrollWidth === 0) {
        return false;
      }

      scrollToValue(value, 'auto');
      isInitialMountRef.current = false;
      return true;
    };

    if (scrollToInitialValue()) return;

    const timer = requestAnimationFrame(() => {
      if (!scrollToInitialValue()) {
        setTimeout(scrollToInitialValue, 50);
      }
    });

    return () => cancelAnimationFrame(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Update scroll when value changes externally (after initial mount)
  useEffect(() => {
    if (
      containerRef.current &&
      !isScrollingRef.current &&
      !isInitialMountRef.current
    ) {
      scrollToValue(value, 'smooth');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, min, max, step]);

  const handleScroll = useCallback(() => {
    if (!containerRef.current || isScrollingRef.current) return;

    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
    }

    rafIdRef.current = requestAnimationFrame(() => {
      const container = containerRef.current;
      if (!container) return;

      if (!metricsRef.current) {
        measureMetrics();
      }

      const metrics = metricsRef.current;
      if (!metrics || max === min || totalSteps <= 0) return;

      const indicatorPosition =
        container.scrollLeft + container.clientWidth / 2;
      const indexFloat =
        (indicatorPosition - metrics.firstCenter) / metrics.stepWidth;

      const clampedIndex = Math.min(Math.max(indexFloat, 0), totalSteps);
      const index = Math.round(clampedIndex);
      const newValue = min + index * step;
      const roundedValue = parseFloat(newValue.toFixed(decimalPlaces));

      if (
        roundedValue >= min &&
        roundedValue <= max &&
        Math.abs(roundedValue - value) > 0.001
      ) {
        onChange(roundedValue);
      }
    });

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    isScrollingRef.current = true;

    scrollTimeoutRef.current = setTimeout(() => {
      isScrollingRef.current = false;
      rafIdRef.current = null;
    }, 150);
  }, [decimalPlaces, max, measureMetrics, min, onChange, step, totalSteps, value]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Generate ruler marks
  const marks = [];
  for (let i = 0; i <= totalSteps; i++) {
    const markValue = min + i * step;
    const isMainMark = i % 10 === 0;
    const isMediumMark = i % 5 === 0;

    marks.push(
      <div
        key={i}
        ref={i === 0 ? firstMarkRef : undefined}
        className='relative flex flex-col items-center shrink-0 w-[2px]'
      >
        <div
          className={`${
            isMainMark
              ? 'h-12 w-0.5 bg-foreground'
              : isMediumMark
              ? 'h-8 w-0.5 bg-muted-foreground/60'
              : 'h-6 w-0.5 bg-muted-foreground/30'
          }`}
        />
        {isMainMark && (
          <span className='absolute top-full left-1/2 -translate-x-1/2 mt-1 text-xs text-muted-foreground font-medium whitespace-nowrap'>
            {markValue.toFixed(decimalPlaces)}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className='relative w-full'>
      <div className='text-center mb-8'>
        <div className='text-7xl font-bold'>
          {value.toFixed(decimalPlaces)}
          <span className='text-3xl text-muted-foreground ml-2'>{unit}</span>
        </div>
      </div>

      <div className='relative h-32'>
        {/* Center indicator */}
        <div className='absolute left-1/2 -translate-x-1/2 top-0 w-1 h-16 bg-primary z-10 rounded-full shadow-lg shadow-primary/50' />
        <div className='absolute left-1/2 -translate-x-1/2 top-0 w-3 h-3 bg-primary z-10 rounded-full' />

        {/* Ruler container */}
        <div
          ref={containerRef}
          onScroll={handleScroll}
          className='overflow-x-scroll scrollbar-hide h-full'
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          <div
            className='relative flex items-start gap-2 h-full'
            style={{
              paddingLeft: '50%',
              paddingRight: '50%',
            }}
          >
            {marks}
          </div>
        </div>
      </div>
    </div>
  );
}
