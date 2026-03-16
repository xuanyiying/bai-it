import type { ReactNode } from "react";
interface GlassCardProps {
    children: ReactNode;
    className?: string;
    onClick?: () => void;
}
export declare function GlassCard({ children, className, onClick }: GlassCardProps): any;
export {};
