import { useState, useEffect } from "react";
import type { BaitConfig } from "../../shared/types.ts";
import { learningRecordDAO, pendingSentenceDAO } from "../../shared/db.ts";

export interface OnboardingInfo {
  hasApi: boolean;           // 任一 provider 有 key
  hasData: boolean;          // pending_count + analyzed_count > 0
  pendingCount: number;      // 用于 Dashboard 温和引导条显示数字
  loading: boolean;
}

export function useOnboardingState(
  db: IDBDatabase | null,
  config: BaitConfig,
  configLoading: boolean
): OnboardingInfo {
  const [info, setInfo] = useState<OnboardingInfo>({
    hasApi: false,
    hasData: false,
    pendingCount: 0,
    loading: true,
  });

  useEffect(() => {
    if (configLoading) return;

    const hasApi = Object.values(config.AI.providers).some(
      (p) => p.apiKey && p.apiKey.trim() !== ""
    );

    if (!db) {
      setInfo({ hasApi, hasData: false, pendingCount: 0, loading: true });
      return;
    }

    Promise.all([
      pendingSentenceDAO.getAll(db),
      learningRecordDAO.getAll(db),
    ]).then(([pending, records]) => {
      setInfo({
        hasApi,
        hasData: pending.length + records.length > 0,
        pendingCount: pending.filter(p => !p.analyzed).length,
        loading: false,
      });
    });
  }, [db, config, configLoading]);

  return info;
}
