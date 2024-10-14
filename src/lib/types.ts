export interface TreeNode {
    id: string;
    name: string;
    children?: TreeNode[];
    type: "system" | "subsystem" | "component" | "function" | "fault";
    effect?: string;
    cause?: string;
    severity?: number;
    occurrence?: number;
    detection?: number;
    controls?: string;
}

export interface FaultData {
    failureMode?: string;
    effect?: string;
    severity?: number; // Changed from string to number
    cause?: string;
    occurrence?: number;
    controls?: string;
    detection?: number;
}

export interface FunctionData {
    faults: Record<string, FaultData>;
}

export interface FMEARow {
    functions: Record<string, FunctionData>;
}

export type FMEAData = Record<string, FMEARow>;
