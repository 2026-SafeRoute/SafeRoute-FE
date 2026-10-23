import { useMutation, useQueryClient } from '@tanstack/react-query';

import type {
  CreateScenarioDraftRequest,
  UpdateScenarioRequest,
} from '@apis/__generated__/data-contracts';

import { scenarioQueryKeys } from './scenarioQueryKeys';
import {
  deleteScenario,
  patchScenario,
  postReadyScenario,
  postScenarioDraft,
} from './scenariosApi';

export const useCreateScenarioDraftMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateScenarioDraftRequest) => postScenarioDraft(body),
    onSuccess: (scenario) => {
      queryClient.setQueryData(scenarioQueryKeys.detail(scenario.id), scenario);
      void queryClient.invalidateQueries({ queryKey: scenarioQueryKeys.lists() });
    },
  });
};

export const useReadyScenarioMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: postReadyScenario,
    onSuccess: (scenario) => {
      queryClient.setQueryData(scenarioQueryKeys.detail(scenario.id), scenario);
      void queryClient.invalidateQueries({ queryKey: scenarioQueryKeys.lists() });
    },
  });
};

export const useUpdateScenarioMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ scenarioId, body }: { scenarioId: string; body: UpdateScenarioRequest }) =>
      patchScenario(scenarioId, body),
    onSuccess: (scenario) => {
      queryClient.setQueryData(scenarioQueryKeys.detail(scenario.id), scenario);
      void queryClient.invalidateQueries({ queryKey: scenarioQueryKeys.lists() });
      void queryClient.invalidateQueries({
        queryKey: scenarioQueryKeys.routeDiagnosis(scenario.id),
      });
    },
  });
};

export const useDeleteScenarioMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteScenario,
    onSuccess: (_, scenarioId) => {
      queryClient.removeQueries({
        queryKey: scenarioQueryKeys.detail(scenarioId),
        exact: true,
      });
      void queryClient.invalidateQueries({ queryKey: scenarioQueryKeys.lists() });
    },
  });
};
