// src/components/fmea-worksheet.tsx
"use client";

import React, { useCallback, useState, useEffect } from "react";
import {
    TreeNode,
    FMEAData,
    FaultData,
    ParentTreeNode,
    FaultTreeNode,
} from "@/lib/types";
import Breadcrumb from "@/components/Breadcrumb"; // Import the Breadcrumb component
import { FunctionCard } from "@/components/function-card"; // Add this import

interface FMEAWorksheetProps {
    selectedNode: TreeNode | null;
    data: FMEAData;
    onDataChange: (newData: FMEAData) => void;
    getNodePath: (node: TreeNode | null) => string;
    onFunctionNameChange?: (functionId: string, newName: string) => void; // Add this prop
}

export function FMEAWorksheet({
    selectedNode,
    data,
    onDataChange,
    getNodePath,
    onFunctionNameChange,
}: FMEAWorksheetProps) {
    const [scrolled, setScrolled] = useState(false);

    // Add this useEffect hook to handle scroll events
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 0);
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const getFunctionsAndFaults = (
        node: TreeNode | null
    ): {
        functions: ParentTreeNode[];
        faults: Record<string, FaultTreeNode[]>;
    } => {
        if (!node || node.type === "fault")
            return { functions: [], faults: {} };

        const functions: ParentTreeNode[] = [];
        const faults: Record<string, FaultTreeNode[]> = {};

        if (node.id === "aircraft_system") {
            // For root level, collect only top-level functions
            (node as ParentTreeNode).children.forEach((child) => {
                if (child.type === "function") {
                    functions.push(child as ParentTreeNode);
                    faults[child.id] = (
                        child as ParentTreeNode
                    ).children.filter(
                        (grandchild): grandchild is FaultTreeNode =>
                            grandchild.type === "fault"
                    );
                }
            });
        } else {
            // For other levels, collect direct child functions
            (node as ParentTreeNode).children.forEach((child) => {
                if (child.type === "function") {
                    functions.push(child as ParentTreeNode);
                    faults[child.id] = (
                        child as ParentTreeNode
                    ).children.filter(
                        (grandchild): grandchild is FaultTreeNode =>
                            grandchild.type === "fault"
                    );
                }
            });
        }

        return { functions, faults };
    };

    const { functions, faults } = getFunctionsAndFaults(selectedNode);

    // Add this function to initialize fault data
    const initializeFaultData = (fault: FaultTreeNode): FaultData => ({
        id: fault.id,
        failureMode: fault.name,
        effect: fault.effect || "",
        cause: fault.cause || "",
        severity: fault.severity || 1,
        occurrence: fault.occurrence || 1,
        detection: fault.detection || 1,
        controls: fault.controls || "",
    });

    // Initialize data if it doesn't exist
    React.useEffect(() => {
        if (selectedNode && functions.length > 0) {
            const updatedData = { ...data };
            let hasUpdates = false;

            if (!updatedData[selectedNode.id]) {
                updatedData[selectedNode.id] = { functions: {} };
                hasUpdates = true;
            }

            functions.forEach((func) => {
                if (!updatedData[selectedNode.id].functions[func.id]) {
                    updatedData[selectedNode.id].functions[func.id] = {
                        id: func.id, // Add this line
                        faults: {},
                    };
                    hasUpdates = true;
                }
                faults[func.id].forEach((fault) => {
                    if (
                        !updatedData[selectedNode.id].functions[func.id].faults[
                            fault.id
                        ]
                    ) {
                        updatedData[selectedNode.id].functions[func.id].faults[
                            fault.id
                        ] = initializeFaultData(fault);
                        hasUpdates = true;
                    }
                });
            });

            if (hasUpdates) {
                onDataChange(updatedData);
            }
        }
    }, [selectedNode, functions, faults, data, onDataChange]);

    const handleFaultDataChange = useCallback(
        (
            functionId: string,
            faultId: string,
            updatedFaultData: Partial<FaultData>
        ) => {
            const componentId = selectedNode?.id ?? "";
            const updatedData = { ...data };

            if (!updatedData[componentId]) {
                updatedData[componentId] = { functions: {} };
            }
            if (!updatedData[componentId].functions[functionId]) {
                updatedData[componentId].functions[functionId] = {
                    id: functionId,
                    faults: {},
                };
            }
            updatedData[componentId].functions[functionId].faults[faultId] = {
                ...updatedData[componentId].functions[functionId].faults[
                    faultId
                ],
                ...updatedFaultData,
            };
            onDataChange(updatedData);
        },
        [selectedNode?.id, data, onDataChange]
    );

    // Add this function to get the full path
    const getFullPath = useCallback(() => {
        if (!selectedNode) return "FMEA Worksheet";
        return getNodePath(selectedNode);
    }, [selectedNode, getNodePath]);

    const handleFunctionNameChange = (functionId: string, newName: string) => {
        if (onFunctionNameChange) {
            onFunctionNameChange(functionId, newName);
        }
    };

    return (
        <div className="bg-gray-100 p-6 rounded-lg relative">
            <div
                className={`sticky top-0 z-10 bg-gray-100 py-4 ${
                    scrolled ? "shadow-md" : ""
                }`}
            >
                <Breadcrumb path={getFullPath()} />
            </div>
            <div className="space-y-6 mt-6">
                {functions.map((func) => (
                    <FunctionCard
                        key={func.id}
                        func={func}
                        faults={faults[func.id]}
                        componentId={selectedNode?.id ?? ""}
                        data={data}
                        onFaultDataChange={handleFaultDataChange}
                        onFunctionNameChange={handleFunctionNameChange}
                    />
                ))}
            </div>
        </div>
    );
}
