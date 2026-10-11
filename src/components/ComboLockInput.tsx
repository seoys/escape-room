'use client';

import React, { useRef, useEffect } from 'react';
import {
  backspaceSlot,
  changeSlot,
  fromSlots,
  isComplete,
  toSlots,
} from '@/lib/combo-slots';

interface ComboLockInputProps {
  length?: number;
  value: string;
  onChange: (val: string) => void;
  onComplete?: () => void;
  disabled?: boolean;
  // Keyboard shown on phones. Combination locks are digits, so numeric by default.
  inputMode?: 'numeric' | 'text';
}

export default function ComboLockInput({
  length = 4,
  value,
  onChange,
  onComplete,
  disabled,
  inputMode = 'numeric',
}: ComboLockInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Component Mount시 첫 입력창 포커스
    if (inputRefs.current[0] && !disabled) {
      inputRefs.current[0].focus();
    }
  }, [disabled]);

  const handleChange = (index: number, inputVal: string) => {
    if (disabled) return;

    const result = changeSlot(toSlots(value, length), index, inputVal);
    onChange(fromSlots(result.slots));

    // 다음 칸으로 포커스 이동
    if (result.focus !== null) {
      inputRefs.current[result.focus]?.focus();
    }

    // 모두 채워졌다면 자동 완성 콜백 호출
    if (isComplete(result.slots)) {
      onComplete?.();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (e.key === 'Backspace') {
      const result = backspaceSlot(toSlots(value, length), index);
      if (result) {
        // 현재 슬롯이 비어있다면 지울 때 이전 슬롯으로 이동 및 삭제
        e.preventDefault();
        inputRefs.current[result.focus]?.focus();
        onChange(fromSlots(result.slots));
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    } else if (e.key === 'Enter') {
      onComplete?.();
    }
  };

  const slots = toSlots(value, length);

  return (
    <div className="flex gap-2 sm:gap-3 justify-center items-center py-4">
      {slots.map((slot, i) => (
        <input
          key={i}
          ref={(el) => {
            inputRefs.current[i] = el;
          }}
          type="text"
          inputMode={inputMode}
          maxLength={2}
          value={slot}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          disabled={disabled}
          className="w-12 h-16 sm:w-16 sm:h-20 md:w-20 md:h-24 bg-black/60 border-2 border-slate-700
            focus:border-[#c9a24b] rounded-lg text-3xl md:text-5xl text-center
            text-[#c9a24b] font-bold shadow-inner
            focus:shadow-[0_0_20px_rgba(201,162,75,0.4)] focus:scale-[1.05]
            transition-all duration-200 uppercase"
          style={{ fontFamily: 'var(--font-serif)' }}
          autoComplete="off"
        />
      ))}
    </div>
  );
}
