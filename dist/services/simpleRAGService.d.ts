interface ContextData {
    id: string;
    content: string;
    type: 'product' | 'outreach' | 'response_template';
}
export declare class SimpleRAGService {
    private static contexts;
    private static openai;
    static generateReplySuggestions(emailId: string): Promise<{
        suggestions: Array<{
            text: string;
            tone: string;
            confidence: number;
        }>;
        contextUsed: string[];
    }>;
    private static findRelevantContexts;
    private static generateSimpleSuggestions;
    static storeContext(content: string, type: 'product' | 'outreach' | 'response_template'): Promise<string>;
    static getContexts(): ContextData[];
    static updateContext(id: string, content: string): boolean;
    static deleteContext(id: string): boolean;
    static generateAdvancedReply(emailContent: string, contexts: ContextData[]): Promise<string>;
}
export {};
//# sourceMappingURL=simpleRAGService.d.ts.map