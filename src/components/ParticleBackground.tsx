'use client';

import { useEffect, useRef } from 'react';

export default function ParticleBackground() {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		let particles: { x: number; y: number; vx: number; vy: number; radius: number }[] = [];
		const mouse = { x: -1000, y: -1000 };
		
		const resize = () => {
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;
            // recreate particles on resize
			particles = Array.from({ length: 80 }).map(() => ({
				x: Math.random() * canvas.width,
				y: Math.random() * canvas.height,
				vx: (Math.random() - 0.5) * 1.5,
				vy: (Math.random() - 0.5) * 1.5,
				radius: Math.random() * 2 + 1,
			}));
		};
		window.addEventListener('resize', resize);
		resize();

		const handleMouseMove = (e: MouseEvent) => {
			mouse.x = e.clientX;
			mouse.y = e.clientY;
		};
		window.addEventListener('mousemove', handleMouseMove);

		let animationId: number;
		const draw = () => {
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			
			// Draw and update particles
			for (let i = 0; i < particles.length; i++) {
				const p = particles[i];
				p.x += p.vx;
				p.y += p.vy;

				if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
				if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

				ctx.beginPath();
				ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
				ctx.fillStyle = 'rgba(16, 185, 129, 0.4)'; // emerald-500
				ctx.fill();

				// Draw lines
				const dx = mouse.x - p.x;
				const dy = mouse.y - p.y;
				const dist = Math.sqrt(dx * dx + dy * dy);
				if (dist < 150) {
					ctx.beginPath();
					ctx.moveTo(p.x, p.y);
					ctx.lineTo(mouse.x, mouse.y);
					ctx.strokeStyle = `rgba(16, 185, 129, ${0.4 - dist / 150})`;
					ctx.stroke();
				}
                
                // connect particles
                for (let j = i + 1; j < particles.length; j++) {
                    const pj = particles[j];
                    const pdx = pj.x - p.x;
                    const pdy = pj.y - p.y;
                    const pdist = Math.sqrt(pdx * pdx + pdy * pdy);
                    if (pdist < 100) {
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(pj.x, pj.y);
                        ctx.strokeStyle = `rgba(16, 185, 129, ${0.2 - pdist / 500})`; // faint connection
                        ctx.stroke();
                    }
                }
			}
			animationId = requestAnimationFrame(draw);
		};
		draw();

		return () => {
			window.removeEventListener('resize', resize);
			window.removeEventListener('mousemove', handleMouseMove);
			cancelAnimationFrame(animationId);
		};
	}, []);

	return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-[1]" />;
}
