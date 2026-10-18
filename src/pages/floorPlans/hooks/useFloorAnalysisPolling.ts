import { useEffect, useRef } from 'react';

import { useQuery, useQueryClient } from '@tanstack/react-query';

import { floorGraphQueryOptions, floorQueryKeys } from '@apis/floors/floorQueries';

import { getFloorDetail } from '../api/floorPlansApi';

import type { FloorGraph } from '../api/mapGraphApi';

const EMPTY_GRAPH: FloorGraph = { nodes: [], edges: [] };

// AI 분석이 DONE으로 바뀐 직후엔 노드가 아직 생성 중일 수 있어 그래프가 비어 올 수 있음 — 재조회 설정
const GRAPH_RETRY_LIMIT = 5;
const GRAPH_RETRY_INTERVAL_MS = 2000;

// DONE 전환 후에도 서버가 문/계단 노드를 순차 생성하는 동안(방만 먼저 오는 경우가 많음)
// 그래프를 계속 다시 받아온다. 전환 시점부터 GRAPH_SETTLE_WINDOW_MS 동안, 노드 수가
// GRAPH_SETTLE_STABLE_TICKS번 연속(=실제 재조회 기준) 같아지면 생성이 끝난 것으로 보고 멈춘다.
const GRAPH_SETTLE_WINDOW_MS = 180_000;
const GRAPH_SETTLE_POLL_MS = 3000;
const GRAPH_SETTLE_STABLE_TICKS = 3;

// 층 상세(세그멘테이션 상태)와 맵그래프를 AI 분석이 끝날 때까지 폴링 — 업로드 직후 분석 상태
// 전환과 노드 순차 생성을 화면 새로고침 없이 따라가기 위한 조회 묶음
export const useFloorAnalysisPolling = (buildingId?: string, floorId?: string) => {
  const queryClient = useQueryClient();

  // 업로드 직후 백엔드가 mapImageKey를 아직 안 채워 보낼 수 있는데(한두 사이클), 예전엔 키가
  // 비면 "분석 중"이 아니라고 보고 상세 폴링을 멈춰서 — 이후 상태가 DONE으로 바뀌어도, 실제
  // 이미지 URL을 발급받게 해주는 mapImageKey가 채워져도 — 화면을 새로고침해야 반영되던 문제.
  // 업로드→분석 요청을 우리가 방금 걸었으면 키가 잠깐 비어도 계속 폴링하도록 이 플래그를 본다.
  const awaitingUploadAnalysisRef = useRef(false);

  // 현재 층 상세 — 세그멘테이션이 끝날 때까지(isAnalyzing) 짧은 간격으로 다시 조회해 상태 전환을
  // 감지해야 해서, 폴링 여부를 방금 받은 데이터 기준으로 매번 다시 판단하는 refetchInterval에 맡김
  const floorDetailQuery = useQuery({
    queryKey: floorQueryKeys.detail(buildingId, floorId),
    queryFn: ({ signal }) => {
      if (!buildingId || !floorId) throw new Error('층 상세 조회 조건이 필요합니다.');
      return getFloorDetail(buildingId, floorId, signal);
    },
    enabled: Boolean(buildingId && floorId),
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return false;
      const settled = data.segmentationStatus === 'DONE' || data.segmentationStatus === 'FAILED';
      const analyzing =
        !settled &&
        (data.segmentationStatus === 'PROCESSING' ||
          Boolean(data.mapImageUrl) ||
          awaitingUploadAnalysisRef.current);
      return analyzing ? 4000 : false;
    },
  });
  const floor = floorDetailQuery.data ?? null;
  const isFloorReady = floor?.segmentationStatus === 'DONE';

  // 세그멘테이션이 방금 끝났을 때(PENDING/PROCESSING → DONE) 서버가 노드를 순차 생성 중이라
  // 그래프가 비었거나 방(ROOM)만 오고 문/계단은 아직 없는 상태로 올 수 있음. 그 전환 시점부터
  // GRAPH_SETTLE_WINDOW_MS 동안 아래 graphQuery.refetchInterval이 그래프를 계속 다시 받아온다.
  // 이미 DONE인 층을 그냥 열 때(undefined → DONE)는 창을 안 열어 불필요한 폴링을 막고,
  // 재업로드로 DONE이 잠깐 풀렸다가(PENDING) 다시 붙으면 창을 새로 연다.
  const graphSettleUntilRef = useRef<number>(0);
  const graphNodeStreakRef = useRef<{ count: number; streak: number; updateCount: number }>({
    count: -1,
    streak: 0,
    updateCount: -1,
  });
  const prevSegStatusRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    const prev = prevSegStatusRef.current;
    const curr = floor?.segmentationStatus;
    prevSegStatusRef.current = curr;
    if (curr === 'DONE' || curr === 'FAILED') awaitingUploadAnalysisRef.current = false;
    const justFinished = (prev === 'PENDING' || prev === 'PROCESSING') && curr === 'DONE';
    if (justFinished) {
      graphSettleUntilRef.current = Date.now() + GRAPH_SETTLE_WINDOW_MS;
      graphNodeStreakRef.current = { count: -1, streak: 0, updateCount: -1 };
      // 분석이 끝나면 이 층에 걸린 모든 조회(이미지 URL·그래프·그리드·CCTV·유도등·구역·목록)를
      // 한 번에 무효화한다. 캐시마다 갱신 트리거(폴링/enabled 전환/staleTime)가 제각각이라
      // 업로드마다 어떤 건 뜨고 어떤 건 새로고침해야 뜨는 문제가 반복됐음 — 완료 시점에
      // 서버는 이미 일관된 상태이므로, 통째로 다시 받아오는 게 가장 확실하다.
      void queryClient.invalidateQueries({ queryKey: floorQueryKeys.all });
    } else if (curr && curr !== 'DONE') {
      graphSettleUntilRef.current = 0;
      graphNodeStreakRef.current = { count: -1, streak: 0, updateCount: -1 };
    }
  }, [floor?.segmentationStatus, queryClient]);

  // 맵그래프(노드/엣지) 조회. 노드가 아예 안 온 상태면 GRAPH_RETRY_LIMIT회까지 빠르게 재시도하고,
  // 노드가 오기 시작했으면 위 settle 창이 살아있는 동안 노드 수가 GRAPH_SETTLE_STABLE_TICKS번
  // 연속(실제 재조회 기준 — dataUpdateCount로 셈) 같아질 때까지 GRAPH_SETTLE_POLL_MS 간격으로 폴링.
  const graphQuery = useQuery({
    ...floorGraphQueryOptions(floorId),
    enabled: Boolean(floorId) && isFloorReady,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return false;
      if (data.nodes.length === 0) {
        return query.state.dataUpdateCount <= GRAPH_RETRY_LIMIT ? GRAPH_RETRY_INTERVAL_MS : false;
      }
      if (Date.now() >= graphSettleUntilRef.current) return false;
      const s = graphNodeStreakRef.current;
      if (query.state.dataUpdateCount !== s.updateCount) {
        s.updateCount = query.state.dataUpdateCount;
        if (data.nodes.length === s.count) s.streak += 1;
        else {
          s.count = data.nodes.length;
          s.streak = 1;
        }
      }
      return s.streak >= GRAPH_SETTLE_STABLE_TICKS ? false : GRAPH_SETTLE_POLL_MS;
    },
  });
  const graphData = graphQuery.data ?? EMPTY_GRAPH;

  // 방금 업로드→분석을 걸었으니, mapImageKey가 한두 사이클 비어 와도 상세 폴링이
  // 끊기지 않게 한다(refetchInterval이 이 플래그를 봄). DONE/FAILED에서 해제됨.
  const markAwaitingUploadAnalysis = () => {
    awaitingUploadAnalysisRef.current = true;
  };

  return { floorDetailQuery, floor, isFloorReady, graphData, markAwaitingUploadAnalysis };
};
