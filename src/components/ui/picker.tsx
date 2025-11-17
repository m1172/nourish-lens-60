import { useEffect, useRef } from 'react';

interface PickerProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  unit?: string;
  step?: number;
}

export function Picker({ value, onChange, min, max, unit = '', step = 1 }: PickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);

  useEffect(() => {
    if (containerRef.current && !isScrollingRef.current) {
      const index = Math.round((value - min) / step);
      const scrollPosition = index * 60; // 60px per item
      containerRef.current.scrollTo({
        top: scrollPosition,
        behavior: 'smooth'
      });
    }
  }, [value, min, step]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    
    isScrollingRef.current = true;
    const scrollTop = containerRef.current.scrollTop;
    const index = Math.round(scrollTop / 60);
    const newValue = min + (index * step);
    
    if (newValue >= min && newValue <= max && newValue !== value) {
      onChange(newValue);
    }

    // Reset scrolling flag after scroll ends
    setTimeout(() => {
      isScrollingRef.current = false;
    }, 150);
  };

  const items = [];
  for (let i = min; i <= max; i += step) {
    items.push(i);
  }

  return (
    <div className="relative w-full h-[240px] overflow-hidden">
      {/* Top fade */}
      <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-background to-transparent z-10 pointer-events-none" />
      
      {/* Selected item background */}
      <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-[60px] bg-muted/50 rounded-2xl z-0" />
      
      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none" />
      
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          paddingTop: '90px',
          paddingBottom: '90px'
        }}
      >
        {items.map((item) => (
          <div
            key={item}
            className="h-[60px] flex items-center justify-center snap-center transition-all duration-200"
          >
            <span
              className={`text-3xl font-bold transition-all duration-200 ${
                item === value
                  ? 'text-foreground scale-110'
                  : Math.abs(item - value) <= step
                  ? 'text-muted-foreground/60 scale-95'
                  : 'text-muted-foreground/30 scale-90'
              }`}
            >
              {item}
              {item === value && unit && (
                <span className="text-xl ml-1 text-muted-foreground">{unit}</span>
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
  decimalPlaces = 1 
}: RulerPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);

  useEffect(() => {
    if (containerRef.current && !isScrollingRef.current) {
      const percentage = (value - min) / (max - min);
      const scrollPosition = percentage * (containerRef.current.scrollWidth - containerRef.current.clientWidth);
      containerRef.current.scrollTo({
        left: scrollPosition,
        behavior: 'smooth'
      });
    }
  }, [value, min, max]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    
    isScrollingRef.current = true;
    const scrollLeft = containerRef.current.scrollLeft;
    const scrollWidth = containerRef.current.scrollWidth - containerRef.current.clientWidth;
    const percentage = scrollLeft / scrollWidth;
    const rawValue = min + (percentage * (max - min));
    const newValue = Math.round(rawValue / step) * step;
    
    if (newValue >= min && newValue <= max && newValue !== value) {
      onChange(parseFloat(newValue.toFixed(decimalPlaces)));
    }

    setTimeout(() => {
      isScrollingRef.current = false;
    }, 150);
  };

  // Generate ruler marks
  const marks = [];
  const totalMarks = (max - min) / step;
  for (let i = 0; i <= totalMarks; i++) {
    const markValue = min + (i * step);
    const isMainMark = i % 10 === 0;
    const isMediumMark = i % 5 === 0;
    
    marks.push(
      <div key={i} className="flex flex-col items-center">
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
          <span className="text-xs text-muted-foreground mt-1 font-medium">
            {Math.round(markValue)}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full">
      <div className="text-center mb-8">
        <div className="text-7xl font-bold">
          {value.toFixed(decimalPlaces)}
          <span className="text-3xl text-muted-foreground ml-2">{unit}</span>
        </div>
      </div>
      
      <div className="relative h-32">
        {/* Center indicator */}
        <div className="absolute left-1/2 -translate-x-1/2 top-0 w-1 h-16 bg-primary z-10 rounded-full shadow-lg shadow-primary/50" />
        <div className="absolute left-1/2 -translate-x-1/2 top-0 w-3 h-3 bg-primary z-10 rounded-full" />
        
        {/* Ruler container */}
        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="overflow-x-scroll scrollbar-hide h-full"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
        >
          <div 
            className="flex items-start gap-2 h-full"
            style={{
              paddingLeft: '50%',
              paddingRight: '50%'
            }}
          >
            {marks}
          </div>
        </div>
      </div>
    </div>
  );
}
