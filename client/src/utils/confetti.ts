// utils/confetti.ts
import confetti from 'canvas-confetti';

export const launchConfetti = (e: React.MouseEvent<HTMLElement>) => {
  const rect = e.currentTarget.getBoundingClientRect();

  const x = (rect.left + rect.width / 2) / window.innerWidth;
  const y = (rect.top + rect.height / 2) / window.innerHeight;

  confetti({
    particleCount: 150,
    spread: 360,
    startVelocity: 20,
    gravity: 1,
    scalar: 1.2,
    origin: { x, y }
  });
};
