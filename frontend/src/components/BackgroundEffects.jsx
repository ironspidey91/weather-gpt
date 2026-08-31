import React, { useEffect, useRef } from 'react';

export default function BackgroundEffects({ conditionCategory }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let isVisible = true;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handleVisibility = () => {
      isVisible = !document.hidden;
    };

    window.addEventListener('resize', handleResize);
    document.addEventListener('visibilitychange', handleVisibility);

    // --- Particle Config ---
    const isRainy = conditionCategory === 'rain' || conditionCategory === 'heavy_rain' || conditionCategory === 'thunderstorm';
    const isSnowy = conditionCategory === 'snow';
    const isFoggy = conditionCategory === 'fog';
    const isClear = conditionCategory === 'clear';

    const count = isRainy ? 140 : isSnowy ? 80 : isFoggy ? 30 : 50;

    const particles = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      length: Math.random() * 18 + 8,
      speed: Math.random() * 6 + 3,
      opacity: Math.random() * 0.5 + 0.15,
      radius: Math.random() * 2.5 + 0.5,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: Math.random() * 0.02 + 0.005
    }));

    // Lightning state
    let lightningTimer = 0;
    let lightningAlpha = 0;

    const render = () => {
      if (!isVisible) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      // --- Thunderstorm Lightning ---
      if (conditionCategory === 'thunderstorm') {
        lightningTimer++;
        if (lightningTimer > 200 + Math.random() * 300) {
          lightningAlpha = 0.3 + Math.random() * 0.2;
          lightningTimer = 0;
        }
        if (lightningAlpha > 0) {
          ctx.fillStyle = `rgba(200, 220, 255, ${lightningAlpha})`;
          ctx.fillRect(0, 0, width, height);
          lightningAlpha *= 0.88;
          if (lightningAlpha < 0.01) lightningAlpha = 0;
        }
      }

      // --- Rain ---
      if (isRainy) {
        particles.forEach(p => {
          const intensity = conditionCategory === 'heavy_rain' ? 1.4 : conditionCategory === 'thunderstorm' ? 1.6 : 1;
          ctx.strokeStyle = `rgba(100, 180, 255, ${p.opacity * 0.6})`;
          ctx.lineWidth = 1.2;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - 1.5, p.y + p.length * intensity);
          ctx.stroke();

          p.y += p.speed * intensity * 1.2;
          p.x -= 0.8;
          if (p.y > height) { p.y = -25; p.x = Math.random() * width; }
        });
      }

      // --- Snow ---
      else if (isSnowy) {
        particles.forEach(p => {
          p.wobble += p.wobbleSpeed;
          ctx.fillStyle = `rgba(220, 230, 255, ${p.opacity * 0.7})`;
          ctx.beginPath();
          ctx.arc(p.x + Math.sin(p.wobble) * 15, p.y, p.radius * 1.5, 0, Math.PI * 2);
          ctx.fill();

          p.y += p.speed * 0.3;
          p.x += Math.sin(p.wobble) * 0.3;
          if (p.y > height) { p.y = -10; p.x = Math.random() * width; }
        });
      }

      // --- Fog ---
      else if (isFoggy) {
        particles.forEach((p, i) => {
          const bandY = (height * 0.3) + (i % 8) * (height * 0.08);
          const fogWidth = 300 + Math.sin(p.wobble) * 80;
          p.wobble += 0.003;
          p.x += 0.15;
          if (p.x > width + fogWidth) p.x = -fogWidth;

          const grad = ctx.createRadialGradient(p.x, bandY, 0, p.x, bandY, fogWidth);
          grad.addColorStop(0, `rgba(180, 200, 220, ${p.opacity * 0.08})`);
          grad.addColorStop(1, 'transparent');
          ctx.fillStyle = grad;
          ctx.fillRect(p.x - fogWidth, bandY - fogWidth * 0.3, fogWidth * 2, fogWidth * 0.6);
        });
      }

      // --- Clear Sky (gentle floating particles + sun glow) ---
      else if (isClear) {
        // Sun glow
        const grad = ctx.createRadialGradient(width * 0.8, height * 0.15, 20, width * 0.8, height * 0.15, 250);
        grad.addColorStop(0, 'rgba(255, 200, 80, 0.06)');
        grad.addColorStop(0.5, 'rgba(255, 180, 60, 0.02)');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // Gentle dust
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        particles.slice(0, 25).forEach(p => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius * 0.8, 0, Math.PI * 2);
          ctx.fill();
          p.y -= 0.15;
          p.x += Math.sin(p.y * 0.008) * 0.3;
          if (p.y < 0) { p.y = height + 5; p.x = Math.random() * width; }
        });
      }

      // --- Default (cloudy / partly cloudy) ---
      else {
        ctx.fillStyle = 'rgba(180, 200, 220, 0.06)';
        particles.forEach(p => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
          p.y -= 0.2;
          p.x += Math.sin(p.y * 0.01) * 0.4;
          if (p.y < 0) { p.y = height + 10; p.x = Math.random() * width; }
        });
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibility);
      cancelAnimationFrame(animationFrameId);
    };
  }, [conditionCategory]);

  return <canvas ref={canvasRef} className="weather-bg-canvas" />;
}
