'use client';

import * as React from "react";

export interface CalendarProps {
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
  disabled?: (date: Date) => boolean;
  className?: string;
  mode?: 'single' | 'multiple' | 'range';
  initialFocus?: boolean;
}

export const Calendar: React.FC<CalendarProps> = ({ selected, onSelect, className }) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    onSelect?.(value ? new Date(value) : undefined);
  };

  return (
    <input
      type="date"
      className={className}
      value={selected ? selected.toISOString().slice(0, 10) : ''}
      onChange={handleChange}
    />
  );
};

Calendar.displayName = "Calendar";

export default Calendar;
