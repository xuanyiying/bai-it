interface SegmentedControlProps {
    options: {
        key: string;
        label: string;
    }[];
    value: string;
    onChange: (key: string) => void;
    style?: React.CSSProperties;
}
export declare function SegmentedControl({ options, value, onChange, style }: SegmentedControlProps): any;
export {};
