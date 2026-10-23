import { useEffect } from 'react';
import type { RefObject } from 'react';

// 팝오버·드롭다운처럼 열려 있을 때만 바깥 클릭을 감지해 닫아야 하는 UI에서 공용으로 씀
const useClickOutside = (ref: RefObject<HTMLElement>, enabled: boolean, onOutside: () => void) => {
  useEffect(() => {
    if (!enabled) return;
    const handleMouseDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onOutside();
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [ref, enabled, onOutside]);
};

export default useClickOutside;
