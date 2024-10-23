"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FaultData, FaultTreeNode } from "@/lib/types";
import {
    AlertTriangle,
    Info,
    Activity,
    BarChart2,
    Eye,
    ChevronDown,
    ChevronUp,
    Trash2,
} from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface FaultCardProps {
    fault: FaultTreeNode;
    functionId: string;
    componentId: string;
    faultData: Partial<FaultData>;
    onFaultDataChange: (
        functionId: string,
        faultId: string,
        updatedFaultData: Partial<FaultData>
    ) => void;
    onDeleteFault?: (faultId: string) => void;
}

export function FaultCardComponent({
    fault,
    functionId,
    faultData,
    onFaultDataChange,
    onDeleteFault,
}: FaultCardProps) {
    const [isControlsExpanded, setIsControlsExpanded] = React.useState(false);
    const [isEditing, setIsEditing] = React.useState(false);
    const [editedData, setEditedData] = React.useState({
        failureMode: faultData.failureMode || fault.name,
        effect: faultData.effect || "",
        cause: faultData.cause || "",
        severity: faultData.severity || 1,
        occurrence: faultData.occurrence || 1,
        detection: faultData.detection || 1,
        controls: faultData.controls || "",
    });
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);

    // Add this useEffect to sync editedData with faultData props
    React.useEffect(() => {
        setEditedData({
            failureMode: faultData.failureMode || fault.name,
            effect: faultData.effect || "",
            cause: faultData.cause || "",
            severity: faultData.severity || 1,
            occurrence: faultData.occurrence || 1,
            detection: faultData.detection || 1,
            controls: faultData.controls || "",
        });
    }, [faultData, fault.name]);

    const rpn = React.useMemo(
        () =>
            editedData.severity * editedData.occurrence * editedData.detection,
        [editedData.severity, editedData.occurrence, editedData.detection]
    );

    const handleRiskIndicatorEdit = (field: string, value: number) => {
        setEditedData({
            ...editedData,
            [field]: value,
        });
    };

    const handleSave = () => {
        onFaultDataChange(functionId, fault.id, editedData);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditedData({
            failureMode: faultData.failureMode || fault.name,
            effect: faultData.effect || "",
            cause: faultData.cause || "",
            severity: faultData.severity || 1,
            occurrence: faultData.occurrence || 1,
            detection: faultData.detection || 1,
            controls: faultData.controls || "",
        });
        setIsEditing(false);
    };

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        onDeleteFault?.(fault.id);
        setIsDeleteDialogOpen(false);
    };

    return (
        <TooltipProvider>
            <Card className="w-full overflow-hidden transition-all hover:shadow-lg">
                <CardHeader className="bg-gradient-to-r from-yellow-100 to-orange-100 pb-2">
                    <div className="flex justify-between items-center">
                        <CardTitle className="flex items-center gap-2 text-lg font-bold text-gray-800">
                            <AlertTriangle className="h-5 w-5 text-yellow-600" />
                            {isEditing ? (
                                <Input
                                    value={editedData.failureMode}
                                    onChange={(e) =>
                                        setEditedData({
                                            ...editedData,
                                            failureMode: e.target.value,
                                        })
                                    }
                                    className="max-w-md"
                                />
                            ) : (
                                editedData.failureMode
                            )}
                        </CardTitle>
                        <div className="flex gap-2">
                            {isEditing ? (
                                <>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleCancel}
                                    >
                                        Cancel
                                    </Button>
                                    <Button size="sm" onClick={handleSave}>
                                        Save
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                        onClick={handleDeleteClick}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setIsEditing(true)}
                                    >
                                        Edit
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="grid gap-6 p-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <InfoBox
                            title="Effect"
                            content={editedData.effect}
                            icon={Info}
                            isEditing={isEditing}
                            onEdit={(value) =>
                                setEditedData({
                                    ...editedData,
                                    effect: value,
                                })
                            }
                        />
                        <InfoBox
                            title="Cause"
                            content={editedData.cause}
                            icon={AlertTriangle}
                            isEditing={isEditing}
                            onEdit={(value) =>
                                setEditedData({
                                    ...editedData,
                                    cause: value,
                                })
                            }
                        />
                    </div>
                    <RiskIndicators
                        severity={editedData.severity}
                        occurrence={editedData.occurrence}
                        detection={editedData.detection}
                        isEditing={isEditing}
                        onEdit={handleRiskIndicatorEdit}
                    />
                    <RPNDisplay rpn={rpn} />
                    <ControlsBox
                        controls={editedData.controls}
                        isExpanded={isControlsExpanded}
                        onToggle={() =>
                            setIsControlsExpanded(!isControlsExpanded)
                        }
                        isEditing={isEditing}
                        onEdit={(value) =>
                            setEditedData({ ...editedData, controls: value })
                        }
                    />
                </CardContent>
            </Card>

            {/* Add Delete Confirmation Dialog */}
            <Dialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
            >
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Delete Fault</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete the fault &ldquo;
                            <strong>{editedData.failureMode}</strong>&rdquo;?
                            This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => setIsDeleteDialogOpen(false)}
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
        </TooltipProvider>
    );
}

function InfoBox({
    title,
    content,
    icon: Icon,
    isEditing,
    onEdit,
}: {
    title: string;
    content: string;
    icon: React.ElementType;
    isEditing?: boolean;
    onEdit?: (value: string) => void;
}) {
    return (
        <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-3 transition-all duration-200 hover:bg-gray-50">
            <h4 className="mb-2 flex items-center gap-2 text-sm font-bold text-gray-700">
                <Icon className="h-4 w-4 text-gray-600" />
                {title}
            </h4>
            {isEditing ? (
                <Textarea
                    value={content}
                    onChange={(e) => onEdit?.(e.target.value)}
                    className="min-h-[100px] w-full transition-all duration-200 focus:ring-2 focus:ring-yellow-500/20"
                    placeholder={`Enter ${title.toLowerCase()}...`}
                />
            ) : (
                <p className="text-sm text-gray-600">{content || "N/A"}</p>
            )}
        </div>
    );
}

function RiskIndicators({
    severity,
    occurrence,
    detection,
    isEditing,
    onEdit,
}: {
    severity: number;
    occurrence: number;
    detection: number;
    isEditing?: boolean;
    onEdit?: (field: string, value: number) => void;
}) {
    return (
        <div className="flex justify-between items-center rounded-lg border border-gray-200 bg-gray-50/50 p-3 transition-all duration-200 hover:bg-gray-50">
            <RiskIndicator
                title="Severity"
                value={severity}
                icon={AlertTriangle}
                isEditing={isEditing}
                onEdit={(value) => onEdit?.("severity", value)}
            />
            <div className="h-8 w-px bg-gray-300" />
            <RiskIndicator
                title="Occurrence"
                value={occurrence}
                icon={BarChart2}
                isEditing={isEditing}
                onEdit={(value) => onEdit?.("occurrence", value)}
            />
            <div className="h-8 w-px bg-gray-300" />
            <RiskIndicator
                title="Detection"
                value={detection}
                icon={Eye}
                isEditing={isEditing}
                onEdit={(value) => onEdit?.("detection", value)}
            />
        </div>
    );
}

function RiskIndicator({
    title,
    value,
    icon: Icon,
    isEditing,
    onEdit,
}: {
    title: string;
    value: number;
    icon: React.ElementType;
    isEditing?: boolean;
    onEdit?: (value: number) => void;
}) {
    const getColorClass = (value: number) => {
        if (value >= 8)
            return "text-white bg-red-400/90 shadow-sm hover:bg-red-400";
        if (value >= 5)
            return "text-white bg-orange-400/90 shadow-sm hover:bg-orange-400";
        if (value >= 3)
            return "text-white bg-yellow-400/90 shadow-sm hover:bg-yellow-400";
        return "text-white bg-green-400/90 shadow-sm hover:bg-green-400";
    };

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="flex flex-col items-center flex-1 cursor-help">
                        <Icon className="h-4 w-4 text-gray-500 mb-1 transition-transform duration-200 hover:scale-110" />
                        <div className="text-xs font-medium text-gray-500 mb-1">
                            {title}
                        </div>
                        {isEditing ? (
                            <div className="relative w-10">
                                <Input
                                    type="number"
                                    min="1"
                                    max="10"
                                    value={value}
                                    onChange={(e) => {
                                        const newValue = Math.min(
                                            10,
                                            Math.max(
                                                1,
                                                parseInt(e.target.value, 10) ||
                                                    1
                                            )
                                        );
                                        onEdit?.(newValue);
                                    }}
                                    className={`
                                        w-10 h-10 text-center rounded-full p-0
                                        text-lg font-bold border-2
                                        focus:ring-2 focus:ring-offset-2
                                        transition-all duration-200
                                        ${getColorClass(value)}
                                        [appearance:textfield]
                                        [&::-webkit-outer-spin-button]:appearance-none
                                        [&::-webkit-inner-spin-button]:appearance-none
                                    `}
                                />
                                <div className="absolute -right-6 top-0 h-full flex flex-col justify-center gap-0.5">
                                    <button
                                        onClick={() =>
                                            onEdit?.(Math.min(10, value + 1))
                                        }
                                        className="w-4 h-4 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors"
                                    >
                                        <ChevronUp className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() =>
                                            onEdit?.(Math.max(1, value - 1))
                                        }
                                        className="w-4 h-4 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors"
                                    >
                                        <ChevronDown className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div
                                className={`
                                    text-lg font-bold w-10 h-10 
                                    rounded-full flex items-center justify-center 
                                    transition-all duration-200
                                    ${getColorClass(value)}
                                `}
                            >
                                {value}
                            </div>
                        )}
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <p className="text-sm">{`${title} Scale: 1-10`}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

function RPNDisplay({ rpn }: { rpn: number }) {
    const getRPNColor = (value: number) => {
        if (value >= 200) return "bg-red-400/90 hover:bg-red-400";
        if (value >= 120) return "bg-orange-400/90 hover:bg-orange-400";
        if (value >= 80) return "bg-yellow-400/90 hover:bg-yellow-400";
        return "bg-green-400/90 hover:bg-green-400";
    };

    const sections = [
        { threshold: 80, color: "bg-green-400/90" },
        { threshold: 120, color: "bg-yellow-400/90" },
        { threshold: 200, color: "bg-orange-400/90" },
        { threshold: 1000, color: "bg-red-400/90" },
    ];

    return (
        <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-3 transition-all duration-200 hover:bg-gray-50">
            <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-bold text-gray-700">
                    Risk Priority Number (RPN)
                </span>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Badge
                            className={`
                                ${getRPNColor(rpn)} 
                                text-white text-sm font-medium px-2 py-1 
                                rounded-full cursor-help shadow-sm
                                transition-all duration-200
                            `}
                        >
                            {rpn}
                        </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>RPN = Severity × Occurrence × Detection</p>
                    </TooltipContent>
                </Tooltip>
            </div>
            <div className="relative h-4 w-full bg-gray-200 rounded-full overflow-hidden">
                {sections.map((section, index) => {
                    const prevThreshold =
                        index > 0 ? sections[index - 1].threshold : 0;
                    const width =
                        ((Math.min(rpn, section.threshold) - prevThreshold) /
                            1000) *
                        100;
                    return (
                        <div
                            key={section.threshold}
                            className={`absolute h-full ${section.color} transition-all duration-300`}
                            style={{
                                left: `${(prevThreshold / 1000) * 100}%`,
                                width: `${width}%`,
                            }}
                        />
                    );
                })}
                <div className="absolute top-0 left-0 w-full h-full">
                    {[0, ...sections.map((s) => s.threshold)].map((tick) => (
                        <div
                            key={tick}
                            className="absolute h-full w-px bg-white/50"
                            style={{
                                left: `${(tick / 1000) * 100}%`,
                            }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

function ControlsBox({
    controls,
    isExpanded,
    onToggle,
    isEditing,
    onEdit,
}: {
    controls: string;
    isExpanded: boolean;
    onToggle: () => void;
    isEditing?: boolean;
    onEdit?: (value: string) => void;
}) {
    const [preventiveActions, detectionActions] = React.useMemo(() => {
        const actions = controls
            .split("\n")
            .filter((action) => action.trim() !== "");
        const midpoint = Math.ceil(actions.length / 2);
        return [actions.slice(0, midpoint), actions.slice(midpoint)];
    }, [controls]);

    return (
        <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-3 transition-all duration-200 hover:bg-gray-50">
            <h4
                className="mb-3 flex items-center justify-between text-sm font-bold text-gray-700 cursor-pointer hover:text-gray-900 transition-colors"
                onClick={onToggle}
            >
                <span className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-gray-600" />
                    Controls
                </span>
                <div className="transform transition-transform duration-200">
                    {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                    ) : (
                        <ChevronDown className="h-4 w-4" />
                    )}
                </div>
            </h4>
            <div
                className={`
                    transition-all duration-300 ease-in-out
                    ${
                        isExpanded
                            ? "max-h-[500px] opacity-100"
                            : "max-h-0 opacity-0 overflow-hidden"
                    }
                `}
            >
                {isEditing ? (
                    <Textarea
                        value={controls}
                        onChange={(e) => onEdit?.(e.target.value)}
                        className="min-h-[100px] w-full transition-all duration-200 focus:ring-2 focus:ring-yellow-500/20"
                        placeholder="Enter controls (separate preventive and detection actions with new lines)"
                    />
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                        <ActionList
                            title="Preventive Actions"
                            actions={preventiveActions}
                        />
                        <ActionList
                            title="Detection Actions"
                            actions={detectionActions}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

function ActionList({ title, actions }: { title: string; actions: string[] }) {
    return (
        <div className="space-y-2">
            <h5 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                {title}
            </h5>
            {actions.length > 0 ? (
                <ul className="space-y-2">
                    {actions.map((action, index) => (
                        <li
                            key={index}
                            className="flex items-start gap-2 text-sm text-gray-600 group"
                        >
                            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-gray-400 flex-shrink-0 group-hover:bg-yellow-400 transition-colors duration-200" />
                            <span className="group-hover:text-gray-900 transition-colors duration-200">
                                {action}
                            </span>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-sm text-gray-500 italic">
                    No actions specified
                </p>
            )}
        </div>
    );
}
