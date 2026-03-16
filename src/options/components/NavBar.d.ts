import type { TabKey } from "../App.tsx";
interface NavBarProps {
    activeTab: TabKey;
    onTabChange: (tab: TabKey) => void;
}
export declare function NavBar({ activeTab, onTabChange }: NavBarProps): any;
export {};
