// Base interface for all node types
export interface BaseTreeNode {
    id: string;
    name: string;
    type: "system" | "subsystem" | "component" | "function" | "fault";
}

// Interface for nodes that can have children
export interface ParentTreeNode extends BaseTreeNode {
    type: "system" | "subsystem" | "component" | "function";
    children: TreeNode[];
}

// Interface for fault nodes
export interface FaultTreeNode extends BaseTreeNode {
    type: "fault";
    effect?: string;
    cause?: string;
    severity?: number;
    occurrence?: number;
    detection?: number;
    controls?: {
        preventive: string;
        detection: string;
    };
    children?: never; // Explicitly state that FaultTreeNode doesn't have children
}

// Union type for all possible node types
export type TreeNode = ParentTreeNode | FaultTreeNode;

export interface FaultData {
    id: string;
    failureMode: string;
    effect: string;
    severity: number;
    cause: string;
    occurrence: number;
    controls: {
        preventive: string;
        detection: string;
    };
    detection: number;
}

export interface FunctionData {
    id: string;
    faults: Record<string, FaultData>;
}

export interface FMEARow {
    functions: Record<string, FunctionData>;
}

export type FMEAData = Record<string, FMEARow>;
