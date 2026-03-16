import type { ProviderKey, PatternKey } from "../shared/types.ts";
/** Provider 显示名 + 可用模型列表 + 提示文字 */
export declare const PROVIDER_INFO: Record<ProviderKey, {
    label: string;
    models: string[];
    hint: string;
}>;
/** 句式 key → 中文名映射 */
export declare const PATTERN_LABELS: Record<PatternKey, string>;
