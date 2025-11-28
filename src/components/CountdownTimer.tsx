import React, { useState, useEffect } from 'react';
import { ProgressCircle } from './ProgressCircle';

interface CountdownTimerProps {
  endDate: Date;
  onExpire?: () => void;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({ endDate, onExpire }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    totalSeconds: 0,
    totalDuration: 0
  });

  useEffect(() => {
    const startDate = new Date();
    const totalDuration = Math.max(0, Math.floor((endDate.getTime() - startDate.getTime()) / 1000));

    const calculateTimeLeft = () => {
      const now = new Date();
      const difference = endDate.getTime() - now.getTime();

      if (difference <= 0) {
        onExpire?.();
        return { days: 0, hours: 0, minutes: 0, seconds: 0, totalSeconds: 0, totalDuration };
      }

      const totalSeconds = Math.floor(difference / 1000);
      const days = Math.floor(totalSeconds / (60 * 60 * 24));
      const hours = Math.floor((totalSeconds % (60 * 60 * 24)) / (60 * 60));
      const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
      const seconds = totalSeconds % 60;

      return { days, hours, minutes, seconds, totalSeconds, totalDuration };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [endDate, onExpire]);

  const totalHours = timeLeft.days * 24 + timeLeft.hours;
  const maxHours = 5 * 24; // 5 days in hours

  return (
    <div className="flex flex-col items-center gap-4">
      <ProgressCircle
        current={totalHours}
        target={maxHours}
        label="Time Remaining"
        sublabel={`${timeLeft.days}d ${timeLeft.hours}h ${timeLeft.minutes}m`}
        color="hsl(var(--chart-2))"
      />
      <div className="grid grid-cols-4 gap-2 text-center">
        <div className="bg-card border border-border rounded-lg p-2">
          <span className="text-xl font-bold text-foreground">{timeLeft.days}</span>
          <p className="text-xs text-muted-foreground">Days</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-2">
          <span className="text-xl font-bold text-foreground">{timeLeft.hours}</span>
          <p className="text-xs text-muted-foreground">Hours</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-2">
          <span className="text-xl font-bold text-foreground">{timeLeft.minutes}</span>
          <p className="text-xs text-muted-foreground">Mins</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-2">
          <span className="text-xl font-bold text-foreground">{timeLeft.seconds}</span>
          <p className="text-xs text-muted-foreground">Secs</p>
        </div>
      </div>
    </div>
  );
};
