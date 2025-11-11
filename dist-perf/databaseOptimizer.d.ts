interface PerformanceMetrics {
    queryId?: string;
    cacheHitRate?: number;
    hitRatio?: number;
    averageLatency?: number;
    averageExecutionTime?: number;
    throughput?: number;
    totalExecutions?: number;
    totalTime?: number;
    rowsReturned?: number;
    errorRate?: number;
}
export declare class DatabaseOptimizer {
    private dbPool;
    private queryPerformanceMetrics;
    private optimizedQueries;
    constructor();
    initialize(): Promise<void>;
    private initializeOptimizations;
    private setupIndexes;
    private createIndex;
    private setupPartitioning;
    private createPartitionedTable;
    private createPartition;
    private optimizeQueries;
    private createOptimizedViews;
    private createMaterializedViews;
    private setupMaterializedViewRefresh;
    private setupQueryMonitoring;
    optimizeConnectionPool(): Promise<void>;
    analyzeQueryPerformance(): Promise<Map<string, PerformanceMetrics>>;
    private getSlowQueries;
    performMaintenance(): Promise<void>;
    private updateTableStatistics;
    private vacuumTables;
    private reindexTables;
    private cleanupOldPartitions;
    getPerformanceReport(): Promise<string>;
    executeOptimizedQuery(queryName: string, params: any[]): Promise<any>;
    private trackQueryPerformance;
    getOptimizationStatistics(): Map<string, any>;
}
export {};
