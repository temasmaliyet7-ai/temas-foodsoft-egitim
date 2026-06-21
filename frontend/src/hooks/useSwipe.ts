import { useEffect, useRef } from 'react';

interface SwipeOptions {
  onLeft: () => void; // sola kaydır → sonraki
  onRight: () => void; // sağa kaydır → önceki
  minDistance?: number;
}

// index.html'deki addSwipeNavigation mantığının React uyarlaması.
// Yatay kaydırma + hızlı flick algılar; dikey kaydırmayı yok sayar.
export function useSwipe<T extends HTMLElement>(options: SwipeOptions) {
  const ref = useRef<T | null>(null);
  const opts = useRef(options);
  opts.current = options;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const minDistance = options.minDistance ?? 42;

    let startX = 0;
    let startY = 0;
    let lastX = 0;
    let lastY = 0;
    let tracking = false;
    let axis: 'x' | 'y' | null = null;
    let startTime = 0;

    const begin = (x: number, y: number) => {
      tracking = true;
      startX = lastX = x;
      startY = lastY = y;
      axis = null;
      startTime = Date.now();
    };
    const move = (x: number, y: number): boolean => {
      if (!tracking) return false;
      lastX = x;
      lastY = y;
      const dx = x - startX;
      const dy = y - startY;
      if (!axis) {
        if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return false;
        axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      }
      return axis === 'x';
    };
    const finish = (x: number, y: number) => {
      if (!tracking) return;
      const dx = x - startX;
      const dy = y - startY;
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);
      const elapsed = Date.now() - startTime;
      tracking = false;
      axis = null;
      const strong = absX >= minDistance && absX > absY * 1.15;
      const flick = elapsed <= 320 && absX >= 24 && absX > absY * 1.05;
      if (!(strong || flick)) return;
      if (dx < 0) opts.current.onLeft();
      else opts.current.onRight();
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      begin(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!tracking || e.touches.length !== 1) return;
      if (move(e.touches[0].clientX, e.touches[0].clientY)) e.preventDefault();
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (!e.changedTouches.length) return;
      finish(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      if (e.button !== 0) return;
      begin(e.clientX, e.clientY);
    };
    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch' || !tracking) return;
      if (move(e.clientX, e.clientY)) e.preventDefault();
    };
    const onPointerUp = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      finish(e.clientX, e.clientY);
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', onPointerUp);

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerup', onPointerUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return ref;
}
