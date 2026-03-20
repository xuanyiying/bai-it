import { useState, useEffect, useCallback } from "react";
import type { BaitConfig, AIMultiConfig } from "../../shared/types.ts";
import { DEFAULT_CONFIG, migrateAIConfig } from "../../shared/types.ts";

export function useConfig() {
  const [config, setConfig] = useState<BaitConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    chrome.storage.sync.get(Object.keys(DEFAULT_CONFIG), (items) => {
      const raw = items as unknown as BaitConfig;
      // 补全缺失字段
      const merged: BaitConfig = {
        ...DEFAULT_CONFIG,
        ...raw,
        AI: migrateAIConfig(raw.AI),
      };
      if (!Array.isArray(merged.disabledSites)) merged.disabledSites = [];
      setConfig(merged);
      setLoading(false);
    });
  }, []);

  const saveConfig = useCallback(async (partial: Partial<BaitConfig>) => {
    setConfig((prev) => {
      const updated = { ...prev, ...partial };
      if (partial.AI) {
        updated.AI = { ...prev.AI, ...partial.AI };
      }
      chrome.storage.sync.set(updated as Record<string, unknown>);
      return updated;
    });
  }, []);

  const updateAI = useCallback(async (partial: Partial<AIMultiConfig>) => {
    setConfig((prev) => {
      const AI = { ...prev.AI, ...partial };
      if (partial.providers) {
        AI.providers = { ...prev.AI.providers, ...partial.providers };
      }
      const updated = { ...prev, AI };
      chrome.storage.sync.set(updated as Record<string, unknown>);
      return updated;
    });
  }, []);

  return { config, loading, saveConfig, updateAI };
}
