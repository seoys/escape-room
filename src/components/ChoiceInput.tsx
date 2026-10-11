'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { ChoiceOption } from '@/types/room';
import { ShapeCellView } from '@/components/puzzle-visuals/ShapeMatrixVisual';

interface ChoiceInputProps {
	options: ChoiceOption[];
	onChange: (value: string) => void;
	disabled?: boolean;
}

export default function ChoiceInput({
	options,
	onChange,
	disabled,
}: ChoiceInputProps) {
	const [selected, setSelected] = useState<string | null>(null);

	// A new room brings new options: drop the previous selection and answer.
	useEffect(() => {
		setSelected(null);
		onChange('');
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [options]);

	const handleSelect = (value: string) => {
		if (disabled) return;
		setSelected(value);
		onChange(value);
	};

	return (
		<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
			{options.map(option => {
				const isSelected = selected === option.value;
				return (
					<button
						key={option.value}
						type="button"
						disabled={disabled}
						aria-pressed={isSelected}
						onClick={() => handleSelect(option.value)}
						className="btn-antique flex flex-col items-center justify-center gap-2 px-3 py-3 text-sm disabled:opacity-30 disabled:cursor-not-allowed"
						style={
							isSelected
								? {
										borderColor: 'var(--color-brass)',
										boxShadow:
											'0 0 12px rgba(232,150,90,0.5)',
									}
								: undefined
						}
					>
						{option.cell && (
							<ShapeCellView cell={option.cell} size={64} />
						)}
						{option.image && (
							<Image
								src={option.image}
								alt={option.label ?? option.value}
								width={96}
								height={96}
								unoptimized
								className="h-auto w-24"
							/>
						)}
						{option.label && <span>{option.label}</span>}
					</button>
				);
			})}
		</div>
	);
}
