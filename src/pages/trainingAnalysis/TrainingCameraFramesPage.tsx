import { useEffect, useMemo, useRef, useState } from 'react';

import clsx from 'clsx';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router';

import { extractApiError } from '@apis/errors/apiError';
import {
  MAX_TRAINING_DURATION_MS,
  TRAINING_SESSION_STATUS,
} from '@apis/trainingSessions/trainingSessionConstants';

import AlertIcon from '@assets/icons/ic-alert.svg?react';
import ChevronRightIcon from '@assets/icons/ic-chevron-right.svg?react';

import EmptyState from '@components/empty';
import LoadingState from '@components/loadingState';
import useToast from '@components/toast/useToast';

import {
  getScenarioDetailPath,
  getTrainingCameraFramesPath,
  getTrainingCamerasPath,
  ROUTES,
} from '@constants/path';

import useElapsedTrainingTime from '@hooks/useElapsedTrainingTime';

import { formatDuration } from '@utils/format';

import { useCameraFramesQuery } from './api/useCameraFramesQuery';
import { useSessionCamerasQuery } from './api/useSessionCamerasQuery';
import { useTrainingSessionQuery } from './api/useSessionContextQuery';
import { useSessionEventsQuery } from './api/useSessionEventsQuery';
import { useTrainingMonitoringSocket } from './api/useTrainingMonitoringSocket';
import { useTrainingScenarioId } from './api/useTrainingScenarioId';
import CameraSidebar from './components/CameraSidebar/CameraSidebar';
import SessionInfoCard from './components/SessionInfoCard/SessionInfoCard';
import {
  EVENT_SEVERITY_COLOR,
  EVENT_TYPE_LABEL,
  isLiveSessionStatus,
  TRAINING_SESSION_STATUS_VIEW,
  VIEWABLE_SESSION_STATUSES,
} from './constants/trainingAnalysis';
import * as styles from './TrainingCameraFramesPage.css';
import { CONGESTION_LEVEL_LABEL } from './types/trainingAnalysis';
import {
  formatCapturedTime,
  formatElapsedFromStart,
  formatSessionStartedClock,
  formatSessionStartedDate,
  getScenarioIdFromNavigationState,
} from './utils/trainingAnalysis';

import type { CongestionLevel, TrainingSessionStatus } from './types/trainingAnalysis';

const isViewable = (status: TrainingSessionStatus) =>
  (VIEWABLE_SESSION_STATUSES as readonly TrainingSessionStatus[]).includes(status);

const NEEDS_ATTENTION: CongestionLevel[] = ['CROWDED', 'VERY_CROWDED'];

// 프레임 끝에서 이만큼 남았을 때 다음 페이지를 미리 불러옴
const PREFETCH_THRESHOLD = 3;

const TrainingCameraFramesPage = () => {
  const { sessionId, cctvId } = useParams<{ sessionId: string; cctvId: string }>();
  const { state: navigationState } = useLocation();
  const navigate = useNavigate();
  const routedScenarioId = getScenarioIdFromNavigationState(navigationState);
  const { show } = useToast();
  // 인덱스가 아니라 frameId로 선택 프레임을 추적함 — 과거 페이지를 더 불러오면 배열 앞쪽에
  // 프레임이 추가되는데(아래 frames 설명 참고), 고정된 숫자 인덱스로 추적하면 그 순간
  // 사용자가 보던 프레임이 페이지 크기만큼 과거로 밀려버림(실측으로 확인한 버그).
  // frameId로 추적하면 배열이 어떻게 늘어나든 항상 같은 프레임을 가리킴
  const [selectedFrameId, setSelectedFrameId] = useState<string | null>(null);
  const filmstripRef = useRef<HTMLDivElement>(null);
  // 사용자가 과거 프레임을 보고 있는 동안엔(마지막=최신 프레임에서 벗어나 있으면) 새 프레임이
  // 들어와도 보던 위치를 유지하고, 최신 프레임을 보고 있을 때만 새 프레임이 들어오는 대로 계속
  // 따라가게 함(라이브 방송의 "최신으로 이동" 개념과 동일)
  const stickToLatestRef = useRef(true);

  // 사이드바에서 cctvId만 바뀌면 프레임 목록도 카메라별로 새로 조회되므로,
  // 이전 카메라에서 선택했던 frameId를 그대로 들고 있지 않도록 초기화하고
  // 최신 프레임 추적도 다시 켬
  useEffect(() => {
    setSelectedFrameId(null);
    stickToLatestRef.current = true;
  }, [cctvId, sessionId]);

  const {
    session,
    isLoading: isSessionLoading,
    isError: isSessionError,
    error: sessionError,
  } = useTrainingSessionQuery(sessionId);
  const { scenarioId, isResolvingScenarioId } = useTrainingScenarioId({
    sessionId,
    status: session?.status,
    routedScenarioId,
  });
  // 진행 중 훈련이면 카메라·프레임·이벤트를 주기적으로 다시 조회해 최신 프레임을 반영
  const isLive = isLiveSessionStatus(session?.status);
  const {
    data: cameras = [],
    isLoading: isCamerasLoading,
    isError: isCamerasError,
    error: camerasError,
  } = useSessionCamerasQuery(sessionId, { live: isLive });
  const camera = cameras.find((c) => c.cctvId === cctvId);

  const {
    data: framePages,
    isLoading: isFramesLoading,
    isError: isFramesError,
    error: framesError,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useCameraFramesQuery(sessionId, cctvId, { live: isLive });
  // API는 최신순(newest-first) 커서 페이지네이션이라(다음 페이지 = 더 과거) 그대로 쓰면
  // 필름스트립이 최신→과거 순으로 놓여서 "다음 프레임"(→)을 누를 때마다 과거로 가는 이상한
  // 경험이 됐음(실측으로 확인한 버그). 화면에서는 시간순(과거→최신, 왼쪽→오른쪽)으로 뒤집어서
  // 씀 — "다음"이 항상 미래, "이전"이 항상 과거를 가리키게
  const frames = useMemo(
    () => [...(framePages?.pages.flatMap((page) => page.frames) ?? [])].reverse(),
    [framePages],
  );
  const lastFrameIndex = frames.length - 1;
  // BE 작업 예정 필드라 아직 없을 수 있음(현재 프레임 목록 응답엔 없음) — 오면 그 값을,
  // 없으면 지금까지 불러온 개수로 대신 표시함(아래 렌더링에서 처리)
  const totalFrameCount = framePages?.pages[0]?.totalCount ?? null;

  // selectedFrameId가 가리키는 프레임의 현재 위치를 매 렌더 새로 계산함 — frames 배열이
  // 어떻게 늘어나든(뒤에 최신 프레임 추가든, 앞에 과거 페이지 삽입이든) 항상 정확한 위치를 가리킴.
  // 아직 아무것도 선택 안 했거나(최초 로드) 선택했던 프레임이 더는 없으면 최신 프레임으로 봄
  const rawFrameIndex = selectedFrameId
    ? frames.findIndex((frame) => frame.frameId === selectedFrameId)
    : -1;
  const frameIndex = rawFrameIndex === -1 ? lastFrameIndex : rawFrameIndex;

  // 새 프레임이 들어오면(최초 로드 포함) 최신 추적 중일 때만 마지막(최신) 프레임으로 따라감
  useEffect(() => {
    if (frames.length > 0 && stickToLatestRef.current) {
      setSelectedFrameId(frames[frames.length - 1].frameId);
    }
  }, [frames]);

  const { data: events = [] } = useSessionEventsQuery(sessionId, camera?.code, { live: isLive });

  // 진행 중일 때만 1초 단위로 이어서 증가시키고, 종료됐으면 서버가 마지막으로 준 값을 그대로 표시
  const tickingElapsed = useElapsedTrainingTime(isLive ? (session?.startedAt ?? null) : null);
  const isAwaitingServerEnd =
    isLive &&
    session?.startedAt !== null &&
    session?.startedAt !== undefined &&
    Date.now() >= session.startedAt + MAX_TRAINING_DURATION_MS;
  const elapsedDisplay = isLive ? tickingElapsed : formatDuration(session?.elapsedSeconds ?? 0);

  const cameraRefs = useMemo(
    () => cameras.map((c) => ({ cctvId: c.cctvId, code: c.code })),
    [cameras],
  );
  useTrainingMonitoringSocket(sessionId, cameraRefs);

  // 세션/카메라/프레임 조회 실패 — 화면엔 아래 EmptyState로도 보이지만, 폴링 중 조용히 실패만
  // 하고 넘어가는 경우를 놓치지 않도록 최초 실패 시 1회 토스트로도 알림(floorPlans·buildings와
  // 톤 통일). 세션·카메라는 한 화면 아래서 같은 EmptyState로 묶어 보여주는 것과 맞춰 토스트도 묶음
  const sessionErrorToastShownRef = useRef(false);
  useEffect(() => {
    if (!isSessionError && !isCamerasError) {
      sessionErrorToastShownRef.current = false;
      return;
    }
    if (sessionErrorToastShownRef.current) return;
    sessionErrorToastShownRef.current = true;
    const relevantError = isSessionError ? sessionError : camerasError;
    show({
      title: '훈련 정보를 불러오지 못했습니다.',
      description: extractApiError(relevantError).message || undefined,
      variant: 'error',
    });
  }, [isSessionError, isCamerasError, sessionError, camerasError, show]);

  const framesErrorToastShownRef = useRef(false);
  useEffect(() => {
    if (!isFramesError) {
      framesErrorToastShownRef.current = false;
      return;
    }
    if (framesErrorToastShownRef.current) return;
    framesErrorToastShownRef.current = true;
    show({
      title: '프레임을 불러오지 못했습니다.',
      description: extractApiError(framesError).message || undefined,
      variant: 'error',
    });
  }, [isFramesError, framesError, show]);

  // 보던 훈련이 RUNNING을 벗어나면 이 화면은 자동으로 떠나지는데(아래 Navigate), 왜 화면이
  // 바뀌었는지 안내가 전혀 없었음 — FAILED(시간 초과)는 도착하는 시나리오 상세 화면이 이미
  // 자체 토스트·모달을 띄우므로 중복 안내하지 않고, 정상 종료·강제 종료만 여기서 안내
  const wasViewableRef = useRef(false);
  useEffect(() => {
    if (!session) return;
    if (isViewable(session.status)) {
      wasViewableRef.current = true;
      return;
    }
    if (wasViewableRef.current && session.status !== TRAINING_SESSION_STATUS.FAILED) {
      show({ title: '훈련이 종료되어 모니터링을 종료합니다.', variant: 'default' });
    }
    wasViewableRef.current = false;
  }, [session, show]);

  // 배열이 시간순으로 뒤집혀서, "다음 페이지(더 과거 프레임)"가 필요해지는 시점도 배열
  // 앞쪽(오래된 쪽, 인덱스 0 근처)임 — 그쪽 근처까지 보면 미리 불러와서 ‹로 넘길 때 끊기지 않게 함
  useEffect(() => {
    if (frameIndex <= PREFETCH_THRESHOLD - 1 && hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [frameIndex, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // 최신 프레임이 필름스트립 맨 오른쪽에 있어서(시간순으로 뒤집었으니) 프레임이 많으면
  // 화면 밖으로 벗어날 수 있음 — 선택된 프레임이 바뀔 때마다 보이는 위치로 스크롤해줌
  useEffect(() => {
    const container = filmstripRef.current;
    const activeEl = container?.children[frameIndex];
    if (activeEl instanceof HTMLElement) {
      activeEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [frameIndex]);

  if (session?.status === TRAINING_SESSION_STATUS.FAILED && scenarioId) {
    return (
      <Navigate
        to={getScenarioDetailPath(scenarioId)}
        replace
        state={{ timedOutSessionId: session.sessionId }}
      />
    );
  }

  if (session?.status === TRAINING_SESSION_STATUS.FAILED && isResolvingScenarioId) {
    return (
      <div className={styles.container}>
        <LoadingState />
      </div>
    );
  }

  if (!isSessionLoading && !isSessionError && (!session || !isViewable(session.status))) {
    return <Navigate to={ROUTES.TRAINING_ANALYSIS} replace />;
  }

  if (isSessionError || isCamerasError) {
    // 세션 조회만 실패하면 camerasError는 비어있어서(카메라 쿼리는 따로 실패하지 않음) 그대로
    // 쓰면 항상 빈 메시지 → 일반 안내 문구로만 떨어짐. 어느 쪽이 실패했는지에 맞는 에러를 골라 씀
    const relevantError = isSessionError ? sessionError : camerasError;
    return (
      <div className={styles.container}>
        <EmptyState
          title="훈련 정보를 불러오지 못했습니다"
          description={extractApiError(relevantError).message || '잠시 후 다시 시도해주세요'}
        />
      </div>
    );
  }

  if (isSessionLoading || isCamerasLoading || !session) {
    return (
      <div className={styles.container}>
        <LoadingState />
      </div>
    );
  }

  // 카메라 조회가 끝났는데 cctvId와 일치하는 카메라가 없으면(잘못된 URL·삭제된 카메라)
  // 무한 로딩 대신 카메라 목록으로 돌려보냄
  if (!camera) {
    return <Navigate to={getTrainingCamerasPath(session.sessionId)} replace />;
  }

  const statusView = TRAINING_SESSION_STATUS_VIEW[session.status];
  const currentFrame = frames[frameIndex];
  // RUNNING만 열람 가능한 화면이라 실제로는 항상 값이 있지만, context.startedAt이 예약 상태에서
  // null일 수 있는 타입이라 방어함
  const sessionStartedAtMs = session.startedAt;

  // 프레임을 어떤 경로로든(이전/다음 버튼, 필름스트립 클릭) 옮길 땐 항상 이걸 거침 —
  // 최신(마지막) 프레임으로 옮기면 다시 최신 추적을 켜고, 그 외로 옮기면 끔
  const selectFrame = (targetFrameId: string) => {
    setSelectedFrameId(targetFrameId);
    const targetIndex = frames.findIndex((frame) => frame.frameId === targetFrameId);
    stickToLatestRef.current = targetIndex === -1 || targetIndex >= lastFrameIndex;
  };
  const goPrev = () => {
    const prevFrame = frames[Math.max(0, frameIndex - 1)];
    if (prevFrame) selectFrame(prevFrame.frameId);
  };
  const goNext = () => {
    const nextFrame = frames[Math.min(lastFrameIndex, frameIndex + 1)];
    if (nextFrame) selectFrame(nextFrame.frameId);
  };
  const scrollFilmstrip = (direction: 1 | -1) => {
    filmstripRef.current?.scrollBy({ left: direction * 420, behavior: 'smooth' });
  };

  return (
    <div className={styles.container}>
      <SessionInfoCard
        sessionName={session.scenarioName}
        statusLabel={statusView.label}
        statusColor={statusView.color}
        meta={`${camera.location} · ${camera.code}`}
        notice={
          isAwaitingServerEnd
            ? '10분이 경과했습니다. 서버에서 훈련 종료 상태를 확인하고 있습니다.'
            : isLive
              ? `실시간 모니터링 중 · ${session.snapshotIntervalSec}초 간격으로 최신 CCTV 프레임이 수신됩니다.`
              : `훈련 중 ${session.snapshotIntervalSec}초 간격으로 수집된 CCTV 프레임 기록입니다. 프레임 사이 구간은 기록되지 않습니다.`
        }
        live={isLive}
        onBack={() =>
          void navigate(getTrainingCamerasPath(session.sessionId), { state: { scenarioId } })
        }
        stats={[
          { label: '날짜', value: formatSessionStartedDate(session.startedAt) },
          { label: '시작 시간', value: formatSessionStartedClock(session.startedAt) },
          { label: '진행 시간', value: elapsedDisplay },
          { label: '카메라', value: `${cameras.length}대` },
        ]}
      />

      {isFramesLoading && <LoadingState size="md" message="프레임을 불러오는 중..." />}

      {!isFramesLoading && isFramesError && (
        <EmptyState
          title="프레임을 불러오지 못했습니다"
          description={extractApiError(framesError).message || '잠시 후 다시 시도해주세요'}
        />
      )}

      {!isFramesLoading && !isFramesError && (
        <div className={styles.consolePanel}>
          <CameraSidebar
            cameras={cameras}
            activeCctvId={camera.cctvId}
            onSelect={(c) =>
              void navigate(getTrainingCameraFramesPath(session.sessionId, c.cctvId), {
                state: { scenarioId },
              })
            }
          />

          <div className={styles.viewerCol}>
            {frames.length === 0 || !currentFrame ? (
              <div className={styles.viewer}>
                <EmptyState size="compact" tone="dark" title="저장된 프레임이 없습니다" />
              </div>
            ) : (
              <>
                <div className={styles.viewer}>
                  {currentFrame.imageUrl ? (
                    <img
                      className={styles.viewerImg}
                      src={currentFrame.imageUrl}
                      alt={`${camera.code} ${formatCapturedTime(currentFrame.capturedAt)} 프레임`}
                    />
                  ) : (
                    <EmptyState size="compact" tone="dark" title="이미지 준비 중…" />
                  )}

                  <span className={styles.viewerTime}>
                    촬영 시각 {formatCapturedTime(currentFrame.capturedAt)} ·{' '}
                    {formatElapsedFromStart(currentFrame.capturedAt, sessionStartedAtMs)}
                  </span>
                  <span className={styles.viewerIndex}>
                    {frameIndex + 1}/{frames.length}
                    {hasNextPage ? '+' : ''}
                  </span>
                  {isLive && frameIndex === lastFrameIndex && (
                    <span className={styles.liveBadge}>
                      <span className={styles.liveDot} aria-hidden="true" />
                      LIVE
                    </span>
                  )}

                  <button
                    type="button"
                    className={styles.navBtn}
                    style={{ left: '1.2rem' }}
                    disabled={frameIndex === 0 && !hasNextPage}
                    aria-label="이전 프레임"
                    onClick={goPrev}
                  >
                    <ChevronRightIcon width={16} height={16} className={styles.navIconPrev} />
                  </button>
                  <button
                    type="button"
                    className={styles.navBtn}
                    style={{ right: '1.2rem' }}
                    disabled={frameIndex === lastFrameIndex}
                    aria-label="다음 프레임"
                    onClick={goNext}
                  >
                    <ChevronRightIcon width={16} height={16} />
                  </button>
                </div>

                <div className={styles.filmstripSection}>
                  <button
                    type="button"
                    className={styles.filmstripNavBtn}
                    aria-label="프레임 목록 왼쪽으로"
                    onClick={() => scrollFilmstrip(-1)}
                  >
                    <ChevronRightIcon width={14} height={14} className={styles.navIconPrev} />
                  </button>

                  <div className={styles.filmstrip} ref={filmstripRef}>
                    {frames.map((frame, index) => (
                      <button
                        key={frame.frameId}
                        type="button"
                        className={clsx(
                          styles.filmstripItem,
                          index === frameIndex && styles.filmstripItemActive,
                        )}
                        onClick={() => selectFrame(frame.frameId)}
                      >
                        {frame.imageUrl && (
                          <img className={styles.filmstripThumb} src={frame.imageUrl} alt="" />
                        )}
                        <span className={styles.filmstripIndex}>{index + 1}</span>
                        {NEEDS_ATTENTION.includes(frame.congestionLevel) && (
                          <AlertIcon
                            width={14}
                            height={14}
                            className={clsx(
                              styles.filmstripAlert,
                              frame.congestionLevel === 'VERY_CROWDED' &&
                                styles.filmstripAlertDanger,
                            )}
                          />
                        )}
                        <span className={styles.filmstripTime}>
                          {formatCapturedTime(frame.capturedAt)}
                        </span>
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    className={styles.filmstripNavBtn}
                    aria-label="프레임 목록 오른쪽으로"
                    onClick={() => scrollFilmstrip(1)}
                  >
                    <ChevronRightIcon width={14} height={14} />
                  </button>
                </div>

                <div className={styles.statRow}>
                  <div className={styles.statBox}>
                    <span className={styles.statLabel}>감지 인원</span>
                    <span className={styles.statValue}>{currentFrame.headcount}명</span>
                  </div>
                  <div className={styles.statBox}>
                    <span className={styles.statLabel}>밀집도</span>
                    <span className={styles.statValue}>{currentFrame.density.toFixed(1)}명/㎡</span>
                  </div>
                  <div className={styles.statBox}>
                    <span className={styles.statLabel}>혼잡 단계</span>
                    <span className={styles.statValue}>
                      {CONGESTION_LEVEL_LABEL[currentFrame.congestionLevel]}
                    </span>
                    <span className={styles.statSub}>{currentFrame.congestionLevel}</span>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className={styles.rightCol}>
            <div className={styles.panel}>
              <span className={styles.panelTitle}>세션 정보</span>
              {/* 촬영 장소·카메라 코드는 위 세션 정보 카드(SessionInfoCard)의 meta 줄에
                  이미 나와 있어서 중복 표시하지 않음 */}
              <div className={styles.infoRow}>
                <span className={styles.infoKey}>저장 프레임 수</span>
                <span className={styles.infoValue}>
                  {totalFrameCount !== null
                    ? `${totalFrameCount}개`
                    : `${frames.length}개${hasNextPage ? '+' : ''}`}
                </span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoKey}>저장 간격</span>
                <span className={styles.infoValue}>{session.snapshotIntervalSec}초</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoKey}>훈련 상태</span>
                <span className={styles.infoValue}>{statusView.label}</span>
              </div>
            </div>

            <div className={styles.panel}>
              <span className={styles.panelTitle}>이벤트 타임라인</span>
              {events.length === 0 ? (
                <EmptyState size="compact" title="기록된 이벤트가 없습니다" />
              ) : (
                <ul className={styles.timelineList}>
                  {events.map((event) => (
                    <li key={event.eventId} className={styles.timelineItem}>
                      <span
                        className={styles.timelineDot}
                        style={{ backgroundColor: EVENT_SEVERITY_COLOR[event.severity] }}
                      />
                      <div className={styles.timelineBody}>
                        <span className={styles.timelineLabel}>{event.message}</span>
                        <span className={styles.timelineMeta}>
                          {formatCapturedTime(event.occurredAt)} · {EVENT_TYPE_LABEL[event.type]}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainingCameraFramesPage;
