export type BannerVariant = "browse" | "api" | "browse-with-api" | null;
interface OnboardingBannerProps {
    variant: BannerVariant;
    onGoToSettings: () => void;
}
export declare function OnboardingBanner({ variant, onGoToSettings }: OnboardingBannerProps): any;
export {};
