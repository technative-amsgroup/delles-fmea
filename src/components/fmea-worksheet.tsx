// src/components/fmea-worksheet.tsx
"use client";

import React, { useCallback, useState, useEffect } from "react";
import { TreeNode, FMEAData, FaultData } from "@/lib/types";
import Breadcrumb from "@/components/Breadcrumb"; // Import the Breadcrumb component
import { FunctionCard } from "@/components/function-card"; // Add this import

interface FMEAWorksheetProps {
    selectedNode: TreeNode | null;
    data: FMEAData;
    onDataChange: (data: FMEAData) => void;
    getNodePath: (node: TreeNode | null) => string; // Add this new prop
}

export function FMEAWorksheet({
    selectedNode,
    data,
    onDataChange,
    getNodePath, // Add this new prop
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
    ): { functions: TreeNode[]; faults: Record<string, TreeNode[]> } => {
        if (!node) return { functions: [], faults: {} };

        const functions: TreeNode[] = [];
        const faults: Record<string, TreeNode[]> = {};

        if (node.id === "aircraft_system") {
            // For root level, collect only top-level functions
            node.children?.forEach((child) => {
                if (child.type === "function") {
                    functions.push(child);
                    faults[child.id] =
                        child.children?.filter(
                            (grandchild) => grandchild.type === "fault"
                        ) || [];
                }
            });
        } else {
            // For other levels, collect direct child functions
            node.children?.forEach((child) => {
                if (child.type === "function") {
                    functions.push(child);
                    faults[child.id] =
                        child.children?.filter(
                            (grandchild) => grandchild.type === "fault"
                        ) || [];
                }
            });
        }

        return { functions, faults };
    };

    const { functions, faults } = getFunctionsAndFaults(selectedNode);

    // Add this function to initialize fault data
    const initializeFaultData = (fault: TreeNode): FaultData => ({
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
            updatedFaultData: Partial<
                FMEAData[string]["functions"][string]["faults"][string]
            >
        ) => {
            const componentId = selectedNode?.id ?? "";
            const updatedData = { ...data };

            if (!updatedData[componentId]) {
                updatedData[componentId] = { functions: {} };
            }
            if (!updatedData[componentId].functions[functionId]) {
                updatedData[componentId].functions[functionId] = { faults: {} };
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

    return (
        <div className="bg-gray-100 p-6 rounded-lg relative">
            <div
                className={`sticky top-0 z-10 bg-gray-100 py-4 ${
                    scrolled ? "shadow-md" : ""
                }`}
            >
                <h2 className="text-2xl font-bold">
                    {selectedNode ? (
                        <Breadcrumb path={getNodePath(selectedNode)} />
                    ) : (
                        "FMEA Worksheet"
                    )}
                </h2>
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
                    />
                ))}
            </div>
        </div>
    );
}
