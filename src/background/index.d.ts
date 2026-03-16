/**
 * Background Service Worker
 *
 * 职责：
 * 1. 接收 Content Script 的分块请求
 * 2. 查 IndexedDB 缓存，命中直接返回
 * 3. 未命中的句子调 LLM API
 * 4. 结果写入缓存后返回
 * 5. 管理配置和站点开关
 */
export {};
