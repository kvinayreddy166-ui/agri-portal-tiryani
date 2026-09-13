import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// Centralized knowledge-base route paths + navigation helper.
export const KNOWLEDGE_PATHS = {
  dashboard: '/knowledge',
  library: '/knowledge/library',
  upload: '/knowledge/upload',
  categories: '/knowledge/categories',
  queue: '/knowledge/queue',
  analytics: '/knowledge/analytics',
  settings: '/knowledge/settings',
  assistant: '/knowledge/assistant',
  search: '/knowledge/search',
  viewer: '/knowledge/viewer',
} as const;

export type KnowledgePage = keyof typeof KNOWLEDGE_PATHS;

export function useKnowledgeNav() {
  const navigate = useNavigate();
  const go = useCallback(
    (page: KnowledgePage, state?: Record<string, unknown>) => {
      navigate(KNOWLEDGE_PATHS[page], { state });
    },
    [navigate]
  );
  return go;
}
