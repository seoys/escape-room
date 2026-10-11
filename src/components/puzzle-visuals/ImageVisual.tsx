import Image from 'next/image';

interface ImageVisualProps {
	src: string;
	alt: string;
	width: number;
	height: number;
}

export default function ImageVisual({
	src,
	alt,
	width,
	height,
}: ImageVisualProps) {
	return (
		<figure
			className="mb-6 rounded overflow-hidden bg-black/60"
			style={{ border: '1px solid rgba(201, 162, 75, 0.25)' }}
		>
			<Image
				src={src}
				alt={alt}
				width={width}
				height={height}
				unoptimized
				className="w-full h-auto"
			/>
		</figure>
	);
}
