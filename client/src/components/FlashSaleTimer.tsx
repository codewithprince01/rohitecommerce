import React, { useState, useEffect } from 'react';
import { Timer } from 'lucide-react';

interface FlashSaleTimerProps {
  initialSeconds?: number;
}

export default function FlashSaleTimer({ initialSeconds = 14400 }: FlashSaleTimerProps) {
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    const t = setInterval(() => setSeconds(s => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="flex items-center gap-1.5">
      <Timer size={14} className="text-accent-500" />
      <span className="text-xs text-neutral-600 font-medium">Ends in</span>
      <div className="flex items-center gap-1">
        {[pad(h), pad(m), pad(s)].map((val, i) => (
          <React.Fragment key={i}>
            <span className="bg-neutral-800 text-white text-xs font-bold px-1.5 py-0.5 rounded-md min-w-[24px] text-center">
              {val}
            </span>
            {i < 2 && <span className="text-neutral-600 font-bold text-xs">:</span>}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
