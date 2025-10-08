export declare class AIService {
    getAvailableModels(): Promise<any>;
    refreshModelsCache(): Promise<any>;
    analyzeResume(text: string, jobDescription: string, selectedModel?: string): Promise<any>;
    checkHealth(): Promise<{
        status: string;
        openrouter: boolean;
        models: any;
        error?: undefined;
    } | {
        status: string;
        openrouter: boolean;
        error: string;
        models?: undefined;
    }>;
}
//# sourceMappingURL=ai.service.d.ts.map