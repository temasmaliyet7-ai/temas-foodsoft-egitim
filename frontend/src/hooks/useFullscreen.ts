import { useCallback, useEffect, useState } from 'react';

// Gerçek tarayıcı tam ekranını yönetir; çıkış olaylarını dinler.
export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const enter = useCallback(async (el: HTMLElement) => {
    try {
      if (el.requestFullscreen) await el.requestFullscreen();
      // @ts-expect-error webkit
      else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
      setIsFullscreen(true);
    } catch {
      // Bazı mobil tarayıcılar izin vermez — yine de katmanı açık göster.
      setIsFullscreen(true);
    }
  }, []);

  const exit = useCallback(async () => {
    try {
      if (document.fullscreenElement && document.exitFullscreen) await document.exitFullscreen();
    } catch {
      /* yoksay */
    }
    setIsFullscreen(false);
  }, []);

  useEffect(() => {
    const onChange = () => {
      const el = document.fullscreenElement || (document as any).webkitFullscreenElement;
      if (!el) setIsFullscreen(false);
    };
    document.addEventListener('fullscreenchange', onChange);
    document.addEventListener('webkitfullscreenchange', onChange);
    return () => {
      document.removeEventListener('fullscreenchange', onChange);
      document.removeEventListener('webkitfullscreenchange', onChange);
    };
  }, []);

  return { isFullscreen, enter, exit };
}
