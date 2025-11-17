import React from 'react';

type Props = {
  value: number;
  onChange: (v: number) => void;
};

export default function WeeklyPacePicker({ value, onChange }: Props) {
  return (
    <div className='flex flex-col items-center justify-center py-8'>
      <p className='text-muted-foreground mb-4'>Expected progress per week</p>

      <div className='text-7xl font-bold mb-8'>
        {value.toFixed(1)}
        <span className='text-3xl text-muted-foreground ml-2'>kg</span>
      </div>

      <div className='w-full max-w-xs relative mb-8'>
        <input
          type='range'
          min={1}
          max={15}
          step={1}
          value={Math.round(value * 10)}
          onChange={(e) => onChange(parseInt(e.target.value, 10) / 10)}
          className='w-full accent-primary'
        />
        <div className='flex justify-between text-xs text-muted-foreground mt-2'>
          <span>0.1</span>
          <span>0.8</span>
          <span>1.5</span>
        </div>
      </div>
    </div>
  );
}
