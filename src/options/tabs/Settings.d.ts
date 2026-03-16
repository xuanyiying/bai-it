import type { LLMMultiConfig } from "../../shared/types.ts";
interface SettingsProps {
    config: {
        llm: LLMMultiConfig;
    };
    configLoading: boolean;
    updateLLM: (partial: Partial<LLMMultiConfig>) => Promise<void>;
}
export declare function Settings({ config, configLoading: loading, updateLLM }: SettingsProps): any;
export {};
