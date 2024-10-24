// src/components/fmea-worksheet.tsx
"use client";

import React, { useCallback, useState, useEffect, ChangeEvent } from "react";
import {
    TreeNode,
    FMEAData,
    FaultData,
    ParentTreeNode,
    FaultTreeNode,
} from "@/lib/types";
import Breadcrumb from "@/components/Breadcrumb"; // Import the Breadcrumb component
import { FunctionCard } from "@/components/function-card"; // Add this import
import { Button } from "@/components/ui/button"; // Add if not already imported
import { PlusCircle, Upload } from "lucide-react"; // Add if not already imported
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface FMEAWorksheetProps {
    selectedNode: TreeNode | null;
    data: FMEAData;
    onDataChange: (newData: FMEAData) => void;
    getNodePath: (node: TreeNode | null) => string;
    findNodeByPath: (path: string) => TreeNode | null; // Add this new prop
    onNodeSelect: (node: TreeNode | null) => void; // Add this new prop
    onFunctionNameChange?: (functionId: string, newName: string) => void; // Add this prop
    onAddFault: (
        componentId: string,
        functionId: string,
        newFault: { name: string; effect: string }
    ) => void;
    onAddFunction: (componentId: string, newFunction: { name: string }) => void; // Add this prop
    onDeleteFault: (
        componentId: string,
        functionId: string,
        faultId: string
    ) => void; // Add this prop
    onDeleteFunction: (componentId: string, functionId: string) => void;
    onExportFunction: (
        componentId: string,
        functionId: string,
        fileName: string
    ) => void; // Add this line
    onImportFunctions: (componentId: string, functionFiles: FileList) => void; // Add this line
    onExportFault: (
        componentId: string,
        functionId: string,
        faultId: string,
        fileName: string
    ) => void; // Add this line
    onImportFaults: (
        componentId: string,
        functionId: string,
        faultFiles: FileList
    ) => void; // Add this line
}

export function FMEAWorksheet({
    selectedNode,
    data,
    onDataChange,
    getNodePath,
    findNodeByPath, // Add this
    onNodeSelect, // Add this
    onFunctionNameChange,
    onAddFault,
    onAddFunction, // Add this prop
    onDeleteFault,
    onDeleteFunction,
    onExportFunction, // Add this line
    onImportFunctions, // Add this line
    onExportFault, // Add this prop
    onImportFaults, // Add this prop
}: FMEAWorksheetProps) {
    const [scrolled, setScrolled] = useState(false);
    const [isAddingFunction, setIsAddingFunction] = useState(false);

    // Add this useEffect hook to handle scroll events
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 0);
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Watch for changes in the data to trigger UI updates
    useEffect(() => {
        if (selectedNode) {
            onNodeSelect(selectedNode);
        }
    }, [data, selectedNode, onNodeSelect]);

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

        // Calculate RPN for sorting
        const calculateFunctionRPN = (func: ParentTreeNode): number => {
            const functionFaults = faults[func.id] || [];
            if (functionFaults.length === 0) return 0;

            // Get the highest RPN among all faults
            return Math.max(
                ...functionFaults.map((fault) => {
                    const faultData =
                        data[node?.id || ""]?.functions[func.id]?.faults[
                            fault.id
                        ];
                    return (
                        (faultData?.severity || 1) *
                        (faultData?.occurrence || 1) *
                        (faultData?.detection || 1)
                    );
                })
            );
        };

        // Sort functions by RPN
        functions.sort(
            (a, b) => calculateFunctionRPN(b) - calculateFunctionRPN(a)
        );

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
        controls: {
            preventive: fault.controls?.preventive || "",
            detection: fault.controls?.detection || "",
        },
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
            // First, preserve the existing fault data
            const componentId = selectedNode?.id ?? "";
            const existingFunctionData =
                data[componentId]?.functions[functionId];

            // Call the name change handler
            onFunctionNameChange(functionId, newName);

            // Update the FMEA data to preserve fault data
            if (existingFunctionData) {
                const updatedData = { ...data };
                if (!updatedData[componentId]) {
                    updatedData[componentId] = { functions: {} };
                }
                updatedData[componentId].functions[functionId] = {
                    ...existingFunctionData,
                    id: functionId,
                };
                onDataChange(updatedData);
            }
        }
    };

    const handleBreadcrumbClick = (path: string) => {
        const node = findNodeByPath(path);
        if (node) {
            onNodeSelect(node);
        }
    };

    // Add this function to handle file input change
    const handleImportFunctions = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const files = event.target.files;
        if (files && selectedNode) {
            onImportFunctions(selectedNode.id, files);

            // Assume onImportFunctions updates the data structure
            // Directly update the state to trigger a re-render
            const updatedData = { ...data };
            onDataChange(updatedData);

            // Re-select the node to ensure UI updates
            onNodeSelect(selectedNode);
        }
    };

    return (
        <div className="bg-gray-100 p-6 rounded-lg relative">
            <div
                className={cn(
                    "sticky top-0 z-10",
                    "flex flex-col gap-4",
                    "border-b border-gray-200/80",
                    "pb-4 pt-2", // Added pt-2 for some top padding
                    "before:absolute before:inset-0 before:bg-gray-100", // Added pseudo-element for full background coverage
                    "before:-top-6", // Extend the background upward
                    "before:-left-6 before:-right-6", // Extend the background to full width
                    "before:-z-10", // Place the background behind the content
                    scrolled ? "shadow-sm" : ""
                )}
            >
                <Breadcrumb
                    path={getFullPath()}
                    onSegmentClick={handleBreadcrumbClick}
                />

                {selectedNode &&
                    (selectedNode.type === "system" ||
                        selectedNode.type === "subsystem" ||
                        selectedNode.type === "component") && (
                        <div>
                            <h3 className="text-sm font-semibold text-gray-700 mb-3">
                                Functions
                            </h3>
                            <div className="flex space-x-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsAddingFunction(true)}
                                    className="w-44 h-8 bg-white/80 hover:bg-white border border-gray-200 hover:border-primary/30 text-gray-600 hover:text-primary/80 transition-all duration-200 group shadow-sm hover:shadow"
                                >
                                    <PlusCircle className="h-4 w-4 mr-1.5 text-gray-400 group-hover:text-primary/70" />
                                    Add New Function
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        document
                                            .getElementById(
                                                "import-functions-input"
                                            )
                                            ?.click()
                                    }
                                    className="w-44 h-8 bg-white/80 hover:bg-white border border-gray-200 hover:border-primary/30 text-gray-600 hover:text-primary/80 transition-all duration-200 group shadow-sm hover:shadow"
                                >
                                    <Upload className="h-4 w-4 mr-1.5 text-gray-400 group-hover:text-primary/70" />
                                    Import Functions
                                </Button>
                                <input
                                    id="import-functions-input"
                                    type="file"
                                    accept=".func"
                                    multiple
                                    onChange={handleImportFunctions}
                                    className="hidden"
                                />
                            </div>
                        </div>
                    )}
            </div>

            {!selectedNode ? (
                <div className="bg-white p-6 rounded-lg shadow-sm text-center">
                    <p className="text-gray-600">
                        No component selected. Please select a component from
                        the tree view.
                    </p>
                </div>
            ) : (
                <>
                    {isAddingFunction && (
                        <div className="mb-6">
                            <NewFunctionForm
                                onSubmit={(newFunction) => {
                                    onAddFunction(
                                        selectedNode?.id ?? "",
                                        newFunction
                                    );
                                    setIsAddingFunction(false);
                                }}
                                onCancel={() => setIsAddingFunction(false)}
                            />
                        </div>
                    )}

                    <div className="space-y-6 mt-6">
                        {functions.length > 0 ? (
                            functions.map((func) => (
                                <FunctionCard
                                    key={func.id}
                                    func={func}
                                    faults={faults[func.id]}
                                    componentId={selectedNode?.id ?? ""}
                                    data={data}
                                    onFaultDataChange={handleFaultDataChange}
                                    onFunctionNameChange={
                                        handleFunctionNameChange
                                    }
                                    onAddFault={(functionId, newFault) =>
                                        onAddFault(
                                            selectedNode?.id ?? "",
                                            functionId,
                                            newFault
                                        )
                                    }
                                    onDeleteFault={(functionId, faultId) =>
                                        onDeleteFault(
                                            selectedNode?.id ?? "",
                                            functionId,
                                            faultId
                                        )
                                    }
                                    onDeleteFunction={(functionId) =>
                                        onDeleteFunction(
                                            selectedNode?.id ?? "",
                                            functionId
                                        )
                                    }
                                    onExportFunction={(functionId, fileName) =>
                                        onExportFunction(
                                            selectedNode?.id ?? "",
                                            functionId,
                                            fileName
                                        )
                                    }
                                    onExportFault={(
                                        functionId,
                                        faultId,
                                        fileName
                                    ) =>
                                        onExportFault(
                                            selectedNode?.id ?? "",
                                            functionId,
                                            faultId,
                                            fileName
                                        )
                                    }
                                    onImportFaults={(functionId, faultFiles) =>
                                        onImportFaults(
                                            selectedNode?.id ?? "",
                                            functionId,
                                            faultFiles
                                        )
                                    }
                                />
                            ))
                        ) : (
                            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
                                <p className="text-gray-600">
                                    No functions available for this component.
                                </p>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

// Add this new component
function NewFunctionForm({
    onSubmit,
    onCancel,
}: {
    onSubmit: (newFunction: { name: string }) => void;
    onCancel: () => void;
}) {
    const [functionName, setFunctionName] = useState("");
    const [validationError, setValidationError] = useState<string | null>(null);

    const handleSubmit = () => {
        if (!functionName.trim()) {
            setValidationError("Function name is required");
            return;
        }
        onSubmit({ name: functionName.trim() });
    };

    return (
        <div className="space-y-3 bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <div className="flex gap-3">
                <div className="flex-1">
                    <Input
                        placeholder="Function name *"
                        value={functionName}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => {
                            setFunctionName(e.target.value);
                            if (e.target.value.trim()) {
                                setValidationError(null);
                            }
                        }}
                        className={cn(
                            "h-9 text-sm border-gray-200 focus:border-primary/30 focus:ring-primary/20",
                            validationError &&
                                "border-red-500 focus:border-red-500 focus:ring-red-200"
                        )}
                    />
                    {validationError && (
                        <p className="text-xs text-red-500 mt-1">
                            {validationError}
                        </p>
                    )}
                </div>
            </div>
            <div className="flex justify-end gap-2">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onCancel}
                    className="h-8 px-3 text-sm hover:bg-gray-100"
                >
                    Cancel
                </Button>
                <Button
                    size="sm"
                    onClick={handleSubmit}
                    disabled={!functionName.trim()}
                    className={cn(
                        "h-8 px-3 text-sm bg-primary/90 hover:bg-primary shadow-sm",
                        !functionName.trim() && "opacity-50 cursor-not-allowed"
                    )}
                >
                    Add Function
                </Button>
            </div>
        </div>
    );
}
