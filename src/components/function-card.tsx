// function-card.tsx
import React, { useCallback, useMemo, useState, useEffect } from "react";
import {
    FunctionSquareIcon,
    ChevronRightIcon,
    ChevronDownIcon,
    Pencil,
    PlusCircle,
    Trash2,
    ChevronDown,
    ChevronRight,
} from "lucide-react";
import {
    ParentTreeNode,
    FaultTreeNode,
    FMEAData,
    FaultData,
} from "@/lib/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { FaultCardComponent } from "@/components/fault-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface FunctionCardProps {
    func: ParentTreeNode;
    faults: FaultTreeNode[];
    componentId: string;
    data: FMEAData;
    onFaultDataChange: (
        functionId: string,
        faultId: string,
        updatedFaultData: Partial<FaultData>
    ) => void;
    onFunctionNameChange: (functionId: string, newName: string) => void;
    onAddFault: (
        functionId: string,
        newFault: { name: string; effect: string }
    ) => void;
    onDeleteFault: (functionId: string, faultId: string) => void; // Add this prop
    onDeleteFunction: (functionId: string) => void; // Make this required
}

export const FunctionCard = React.memo(function FunctionCard({
    func,
    faults,
    componentId,
    data,
    onFaultDataChange,
    onFunctionNameChange,
    onAddFault,
    onDeleteFault,
    onDeleteFunction, // Add this prop
}: FunctionCardProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editedData, setEditedData] = useState({
        name: func.name,
    });
    const [openFaultId, setOpenFaultId] = useState<string | null>(null); // Add this back
    const [isAddingFault, setIsAddingFault] = useState(false);
    const [newFault, setNewFault] = useState({ name: "", effect: "" });
    const [validationErrors, setValidationErrors] = useState<{
        name?: string;
    }>({});
    const [deletingFault, setDeletingFault] = useState<{
        id: string;
        name: string;
    } | null>(null);
    const [isDeletingFunction, setIsDeletingFunction] = useState(false); // Add this state
    const [isExpanded, setIsExpanded] = useState(false); // Changed from true to false

    useEffect(() => {
        setIsAddingFault(false);
        setNewFault({ name: "", effect: "" });
    }, [faults.length]); // Reset state when faults change

    const handleFaultDataChange = useCallback(
        (
            functionId: string,
            faultId: string,
            updatedFaultData: Partial<FaultData>
        ) => {
            onFaultDataChange(functionId, faultId, updatedFaultData);
        },
        [onFaultDataChange]
    );

    const sortedFaults = useMemo(() => {
        return faults
            .map((fault) => {
                const faultData =
                    data[componentId]?.functions[func.id]?.faults[fault.id] ||
                    {};
                const rpn =
                    (Number(faultData.severity) || 1) *
                    (Number(faultData.occurrence) || 1) *
                    (Number(faultData.detection) || 1);
                return { ...fault, rpn, faultData };
            })
            .sort((a, b) => b.rpn - a.rpn);
    }, [faults, data, componentId, func.id]);

    const overallRisk = useMemo(() => {
        const highestRPN = sortedFaults.length > 0 ? sortedFaults[0].rpn : 0;
        if (highestRPN >= 200) return { level: "High", color: "bg-red-500" };
        if (highestRPN >= 120)
            return { level: "Medium", color: "bg-orange-500" };
        if (highestRPN >= 80) return { level: "Low", color: "bg-yellow-500" };
        return { level: "Very Low", color: "bg-green-500" };
    }, [sortedFaults]);

    const toggleFault = (faultId: string) => {
        setOpenFaultId(openFaultId === faultId ? null : faultId);
    };

    const handleSave = () => {
        onFunctionNameChange(func.id, editedData.name);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditedData({ name: func.name });
        setIsEditing(false);
    };

    const handleAddNewFault = () => {
        // Reset validation errors
        setValidationErrors({});

        // Validate
        if (!newFault.name.trim()) {
            setValidationErrors({ name: "Name is required" });
            return;
        }

        onAddFault(func.id, {
            name: newFault.name.trim(),
            effect: newFault.effect.trim(),
        });

        setNewFault({ name: "", effect: "" });
        setIsAddingFault(false);
    };

    const handleDeleteClick = (
        e: React.MouseEvent,
        faultId: string,
        faultName: string
    ) => {
        e.stopPropagation();
        setDeletingFault({ id: faultId, name: faultName });
    };

    const handleDeleteConfirm = () => {
        if (deletingFault) {
            onDeleteFault(func.id, deletingFault.id);
            setDeletingFault(null);
        }
    };

    return (
        <>
            <Card className="mb-6 overflow-hidden shadow-md transition-all duration-200 hover:shadow-lg">
                <CardHeader
                    className={cn(
                        "bg-gradient-to-r from-blue-50 to-indigo-50",
                        "cursor-pointer transition-all duration-200 hover:from-blue-100 hover:to-indigo-100",
                        !isExpanded && "pb-4"
                    )}
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <div className="flex justify-between items-center">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <FunctionSquareIcon className="h-5 w-5 text-primary/90 transition-transform duration-200 hover:scale-105" />
                            {isEditing ? (
                                <Input
                                    value={editedData.name}
                                    onChange={(e) =>
                                        setEditedData({ name: e.target.value })
                                    }
                                    className="max-w-md border-2 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                                    autoFocus
                                    onClick={(e) => e.stopPropagation()} // Prevent collapse when editing
                                />
                            ) : (
                                <span className="text-gray-800 font-medium">
                                    {editedData.name}
                                </span>
                            )}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                            {isEditing ? (
                                <>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleCancel();
                                        }}
                                        className="transition-all duration-200 hover:bg-gray-100"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleSave();
                                        }}
                                        className="shadow-sm transition-all duration-200 hover:shadow-md"
                                    >
                                        Save
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Badge
                                        className={cn(
                                            "text-white shadow-sm transition-all duration-200 px-3 py-1.5 text-sm",
                                            getRiskBadgeColor(overallRisk.level)
                                        )}
                                    >
                                        {overallRisk.level} Risk
                                    </Badge>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsDeletingFunction(true);
                                        }}
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors duration-200"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsEditing(true);
                                        }}
                                        className="transition-all duration-200 hover:bg-gray-100"
                                    >
                                        <Pencil className="h-4 w-4 text-gray-500" />
                                    </Button>
                                    {isExpanded ? (
                                        <ChevronDown className="h-5 w-5 text-gray-400" />
                                    ) : (
                                        <ChevronRight className="h-5 w-5 text-gray-400" />
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </CardHeader>

                {isExpanded && (
                    <CardContent className="p-0">
                        <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                            <h3 className="text-sm font-semibold text-gray-700 mb-3">
                                Faults / Failure Modes
                            </h3>
                            {isAddingFault ? (
                                <div className="space-y-3 bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                                    <div className="flex gap-3">
                                        <div className="flex-1">
                                            <Input
                                                placeholder="Fault name *"
                                                value={newFault.name}
                                                onChange={(e) => {
                                                    setNewFault((prev) => ({
                                                        ...prev,
                                                        name: e.target.value,
                                                    }));
                                                    // Clear validation error when user types
                                                    if (e.target.value.trim()) {
                                                        setValidationErrors({});
                                                    }
                                                }}
                                                className={cn(
                                                    "h-9 text-sm border-gray-200 focus:border-primary/30 focus:ring-primary/20",
                                                    validationErrors.name &&
                                                        "border-red-500 focus:border-red-500 focus:ring-red-200"
                                                )}
                                            />
                                            {validationErrors.name && (
                                                <p className="text-xs text-red-500 mt-1">
                                                    {validationErrors.name}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <Input
                                                placeholder="Effect (optional)"
                                                value={newFault.effect}
                                                onChange={(e) =>
                                                    setNewFault((prev) => ({
                                                        ...prev,
                                                        effect: e.target.value,
                                                    }))
                                                }
                                                className="h-9 text-sm border-gray-200 focus:border-primary/30 focus:ring-primary/20"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                setNewFault({
                                                    name: "",
                                                    effect: "",
                                                });
                                                setIsAddingFault(false);
                                                setValidationErrors({});
                                            }}
                                            className="h-8 px-3 text-sm hover:bg-gray-100"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={handleAddNewFault}
                                            disabled={!newFault.name.trim()}
                                            className={cn(
                                                "h-8 px-3 text-sm bg-primary/90 hover:bg-primary shadow-sm",
                                                !newFault.name.trim() &&
                                                    "opacity-50 cursor-not-allowed"
                                            )}
                                        >
                                            Add New Fault
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsAddingFault(true)}
                                    className="w-40 h-8 bg-white/80 hover:bg-white border border-gray-200 hover:border-primary/30 text-gray-600 hover:text-primary/80 transition-all duration-200 group shadow-sm hover:shadow"
                                >
                                    <PlusCircle className="h-4 w-4 mr-1.5 text-gray-400 group-hover:text-primary/70" />
                                    Add New Fault
                                </Button>
                            )}
                        </div>
                        <div className="p-4 bg-gray-50">
                            <ul className="space-y-2">
                                {sortedFaults.map((fault) => (
                                    <li
                                        key={fault.id}
                                        className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                                    >
                                        <div
                                            className="p-4 cursor-pointer transition-all duration-200"
                                            onClick={() =>
                                                toggleFault(fault.id)
                                            }
                                        >
                                            <div className="flex items-center justify-between group">
                                                <div className="space-y-1.5 flex-1 mr-4">
                                                    <h3 className="text-sm font-medium text-gray-900 group-hover:text-gray-700 transition-colors duration-200">
                                                        {fault.faultData
                                                            .failureMode ||
                                                            fault.name}
                                                    </h3>
                                                    <p className="text-xs text-gray-600">
                                                        <span className="font-medium">
                                                            Effect:{" "}
                                                        </span>
                                                        <span className="text-gray-500">
                                                            {fault.faultData
                                                                .effect ||
                                                                "No effect specified"}
                                                        </span>
                                                    </p>
                                                </div>
                                                <div className="flex items-center shrink-0 space-x-2">
                                                    <Badge
                                                        className={cn(
                                                            getRPNBadgeColor(
                                                                fault.rpn
                                                            ),
                                                            "mr-3 px-3 py-1.5 text-sm font-medium tracking-wider shadow-sm w-24 text-center",
                                                            "transition-all duration-200"
                                                        )}
                                                    >
                                                        RPN: {fault.rpn}
                                                    </Badge>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={(e) =>
                                                            handleDeleteClick(
                                                                e,
                                                                fault.id,
                                                                fault.faultData
                                                                    .failureMode ||
                                                                    fault.name
                                                            )
                                                        }
                                                        className="text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors duration-200"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                    <div className="transition-transform duration-200 text-gray-400 group-hover:text-gray-600">
                                                        {openFaultId ===
                                                        fault.id ? (
                                                            <ChevronDownIcon className="h-5 w-5" />
                                                        ) : (
                                                            <ChevronRightIcon className="h-5 w-5" />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div
                                            className={cn(
                                                "transition-all duration-300 ease-in-out",
                                                openFaultId === fault.id
                                                    ? "max-h-[1000px] opacity-100"
                                                    : "max-h-0 opacity-0 overflow-hidden"
                                            )}
                                        >
                                            {openFaultId === fault.id && (
                                                <FaultCardComponent
                                                    fault={fault}
                                                    functionId={func.id}
                                                    componentId={componentId}
                                                    faultData={fault.faultData}
                                                    onFaultDataChange={
                                                        handleFaultDataChange
                                                    }
                                                    onDeleteFault={(faultId) =>
                                                        onDeleteFault(
                                                            func.id,
                                                            faultId
                                                        )
                                                    }
                                                />
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </CardContent>
                )}
            </Card>

            <Dialog
                open={deletingFault !== null}
                onOpenChange={() => setDeletingFault(null)}
            >
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Delete Fault</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete the fault &ldquo;
                            <strong>{deletingFault?.name}</strong>&rdquo;? This
                            action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => setDeletingFault(null)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteConfirm}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Delete Function Dialog */}
            <Dialog
                open={isDeletingFunction}
                onOpenChange={setIsDeletingFunction}
            >
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Delete Function</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete the function{" "}
                            <strong>
                                &ldquo;
                                {func.name}&rdquo;
                            </strong>
                            ? This action cannot be undone and will delete{" "}
                            <strong>all associated faults.</strong>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => setIsDeletingFunction(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => {
                                onDeleteFunction(func.id);
                                setIsDeletingFunction(false);
                            }}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
});

// Updated color functions with consistent sizing
function getRiskBadgeColor(level: string) {
    switch (level) {
        case "High":
            return "bg-red-400/90 hover:bg-red-400";
        case "Medium":
            return "bg-orange-400/90 hover:bg-orange-400";
        case "Low":
            return "bg-yellow-400/90 hover:bg-yellow-400";
        default:
            return "bg-green-400/90 hover:bg-green-400";
    }
}

function getRPNBadgeColor(rpn: number) {
    if (rpn >= 200) return "bg-red-400/90 text-white hover:bg-red-400";
    if (rpn >= 120) return "bg-orange-400/90 text-white hover:bg-orange-400";
    if (rpn >= 80) return "bg-yellow-400/90 text-white hover:bg-yellow-400";
    return "bg-green-400/90 text-white hover:bg-green-400";
}
