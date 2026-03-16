interface DashboardProps {
    db: IDBDatabase | null;
    isExample: boolean;
    pendingCount: number;
    hasApi: boolean;
    onGoToReview: () => void;
    onGoToSettings: () => void;
}
export declare function Dashboard({ db, isExample, pendingCount, hasApi, onGoToReview, onGoToSettings }: DashboardProps): any;
export {};
