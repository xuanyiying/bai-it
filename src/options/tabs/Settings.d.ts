import type { AIMultiConfig } from "../../shared/types.ts";
interface SettingsProps {
    config: {
        AI: AIMultiConfig;
    };
    configLoading: boolean;
    updateAI: (partial: Partial<AIMultiConfig>) => Promise<void>;
}
export declare function Settings({ config, configLoading: loading, updateAI }: SettingsProps): any;
export { };
