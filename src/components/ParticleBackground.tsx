'use client';

import { useEffect, useRef } from 'react';

interface Particle {
	x: number;
	y: number;
	vx: number;
	vy: number;
	radius: number;
}

const CONNECT_DIST = 100;
const MOUSE_DIST = 150;
const PARTICLE_COLOR = 'rgba(201, 162, 75, 0.35)';

const getParticleCount = (width: number, height: number) => {
	const density = (width * height) / 18000;
	const cap = width < 640 ? 40 : 80;
	return Math.max(24, Math.min(cap, Math.round(density)));
};

// Buckets particles into CONNECT_DIST-sized grid cells so each particle only
// needs to check its own and neighboring cells instead of every other particle.
const buildGrid = (particles: Particle[]) => {
	const grid = new Map<string, number[]>();
	for (let i = 0; i < particles.length; i++) {
		const cx = Math.floor(particles[i].x / CONNECT_DIST);
		const cy = Math.floor(particles[i].y / CONNECT_DIST);
		const key = `${cx},${cy}`;
		const bucket = grid.get(key);
		if (bucket) bucket.push(i);
		else grid.set(key, [i]);
	}
	return grid;
};

export default function ParticleBackground() {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
		if (reducedMotionQuery.matches) return;

		let particles: Particle[] = [];
		const mouse = { x: -1000, y: -1000 };

		const spawnParticles = () => {
			const count = getParticleCount(canvas.width, canvas.height);
			particles = Array.from({ length: count }).map(() => ({
				x: Math.random() * canvas.width,
				y: Math.random() * canvas.height,
				vx: (Math.random() - 0.5) * 1.5,
				vy: (Math.random() - 0.5) * 1.5,
				radius: Math.random() * 2 + 1,
			}));
		};

		let resizeTimeout: ReturnType<typeof setTimeout>;
		const resize = () => {
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;
			spawnParticles();
		};
		const handleResize = () => {
			clearTimeout(resizeTimeout);
			resizeTimeout = setTimeout(resize, 150);
		};
		window.addEventListener('resize', handleResize);
		resize();

		const handleMouseMove = (e: MouseEvent) => {
			mouse.x = e.clientX;
			mouse.y = e.clientY;
		};
		window.addEventListener('mousemove', handleMouseMove);

		let animationId: number;
		let running = true;

		const draw = () => {
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			ctx.fillStyle = PARTICLE_COLOR;

			for (let i = 0; i < particles.length; i++) {
				const p = particles[i];
				p.x += p.vx;
				p.y += p.vy;

				if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
				if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
			}

			const grid = buildGrid(particles);

			for (let i = 0; i < particles.length; i++) {
				const p = particles[i];

				ctx.beginPath();
				ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
				ctx.fill();

				// Line to cursor
				const dx = mouse.x - p.x;
				const dy = mouse.y - p.y;
				const dist = Math.sqrt(dx * dx + dy * dy);
				if (dist < MOUSE_DIST) {
					ctx.beginPath();
					ctx.moveTo(p.x, p.y);
					ctx.lineTo(mouse.x, mouse.y);
					ctx.strokeStyle = `rgba(201, 162, 75, ${0.35 - dist / MOUSE_DIST})`;
					ctx.stroke();
				}

				// Connections: only check particles in this cell + 8 neighbors, and
				// only pair with higher indices to avoid drawing each link twice.
				const cx = Math.floor(p.x / CONNECT_DIST);
				const cy = Math.floor(p.y / CONNECT_DIST);
				for (let ox = -1; ox <= 1; ox++) {
					for (let oy = -1; oy <= 1; oy++) {
						const bucket = grid.get(`${cx + ox},${cy + oy}`);
						if (!bucket) continue;
						for (const j of bucket) {
							if (j <= i) continue;
							const pj = particles[j];
							const pdx = pj.x - p.x;
							const pdy = pj.y - p.y;
							const pdist = Math.sqrt(pdx * pdx + pdy * pdy);
							if (pdist < CONNECT_DIST) {
								ctx.beginPath();
								ctx.moveTo(p.x, p.y);
								ctx.lineTo(pj.x, pj.y);
								ctx.strokeStyle = `rgba(201, 162, 75, ${0.18 - pdist / 500})`;
								ctx.stroke();
							}
						}
					}
				}
			}

			if (running) animationId = requestAnimationFrame(draw);
		};

		const handleVisibilityChange = () => {
			if (document.hidden) {
				running = false;
				cancelAnimationFrame(animationId);
			} else if (!running) {
				running = true;
				draw();
			}
		};
		document.addEventListener('visibilitychange', handleVisibilityChange);

		draw();

		return () => {
			running = false;
			clearTimeout(resizeTimeout);
			window.removeEventListener('resize', handleResize);
			window.removeEventListener('mousemove', handleMouseMove);
			document.removeEventListener('visibilitychange', handleVisibilityChange);
			cancelAnimationFrame(animationId);
		};
	}, []);

	return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-[1]" />;
}
