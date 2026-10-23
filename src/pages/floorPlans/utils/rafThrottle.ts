// 브라우저는 mousemove를 초당 수백 번까지도 쏘는데, 드래그 중 매번 상태를 갱신하면 프레임마다
// 전체 도면(SVG 그래프·그리드·패널)이 재렌더됨 — 프레임당 최신 좌표 한 번만 반영되도록 묶어줌
export const rafThrottle = <A extends unknown[]>(fn: (...args: A) => void) => {
  let rafId: number | null = null;
  let latestArgs: A | null = null;
  const flush = () => {
    rafId = null;
    if (latestArgs) fn(...latestArgs);
  };
  const throttled = (...args: A) => {
    latestArgs = args;
    if (rafId === null) rafId = requestAnimationFrame(flush);
  };
  throttled.cancel = () => {
    if (rafId !== null) cancelAnimationFrame(rafId);
    rafId = null;
    latestArgs = null;
  };
  return throttled;
};
