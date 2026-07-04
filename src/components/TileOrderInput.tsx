'use client';

import { useEffect, useState } from 'react';

interface TileOrderInputProps {
  tiles: string[];
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function TileOrderInput({ tiles, value, onChange, disabled }: TileOrderInputProps) {
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);

  useEffect(() => {
    setSelectedIndices([]);
    onChange('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tiles]);

  const handleTap = (index: number) => {
    if (disabled || selectedIndices.includes(index)) return;
    const nextIndices = [...selectedIndices, index];
    setSelectedIndices(nextIndices);
    onChange(nextIndices.map(i => tiles[i]).join(''));
  };

  const handleReset = () => {
    if (disabled) return;
    setSelectedIndices([]);
    onChange('');
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2 justify-center min-h-[2.5rem] p-3 rounded border border-[rgba(201,162,75,0.25)] bg-black/40">
        {selectedIndices.length === 0 ? (
          <span className="text-xs text-[rgba(201,162,75,0.4)]">타일을 순서대로 탭하세요...</span>
        ) : (
          selectedIndices.map((tileIndex, orderIndex) => (
            <span
              key={`selected-${orderIndex}`}
              className="antique-input px-3 py-1 text-sm"
              style={{ width: 'auto', display: 'inline-block' }}
            >
              {tiles[tileIndex]}
            </span>
          ))
        )}
      </div>

      <div className="flex flex-wrap gap-2 justify-center">
        {tiles.map((tile, index) => (
          <button
            key={index}
            type="button"
            disabled={disabled || selectedIndices.includes(index)}
            onClick={() => handleTap(index)}
            className="btn-antique px-4 py-2 text-sm disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {tile}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={handleReset}
        disabled={disabled || selectedIndices.length === 0}
        className="text-[10px] text-[rgba(201,162,75,0.6)] hover:text-[#c9a24b] transition-colors self-center underline disabled:opacity-30 disabled:cursor-not-allowed"
      >
        다시 섞기
      </button>
    </div>
  );
}
