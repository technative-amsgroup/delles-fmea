"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FaultData } from "@/lib/types";
import {
    AlertTriangle,
    Info,
    Activity,
    BarChart2,
    Eye,
    ChevronDown,
    ChevronUp,
} from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface FaultCardProps {
    id: string;
    component: string;
    failureMode: string;
    effect: string;
    cause: string;
    severity: number;
    occurrence: number;
    detection: number;
    controls: string;
    onDataChange: (updatedFaultData: Partial<FaultData>) => void;
}

export function FaultCardComponent({
    failureMode,
    effect,
    cause,
    severity,
    occurrence,
    detection,
    controls,
}: FaultCardProps) {
    const [isControlsExpanded, setIsControlsExpanded] = React.useState(false);
    const rpn = React.useMemo(
        () => severity * occurrence * detection,
        [severity, occurrence, detection]
    );

    return (
        <TooltipProvider>
            <Card className="w-full overflow-hidden transition-all hover:shadow-lg">
                <CardHeader className="bg-gradient-to-r from-yellow-100 to-orange-100 pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg font-bold text-gray-800">
                        <AlertTriangle className="h-5 w-5 text-yellow-600" />
                        {failureMode}
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-6 p-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <InfoBox title="Effect" content={effect} icon={Info} />
                        <InfoBox
                            title="Cause"
                            content={cause}
                            icon={AlertTriangle}
                        />
                    </div>
                    <RiskIndicators
                        severity={severity}
                        occurrence={occurrence}
                        detection={detection}
                    />
                    <RPNDisplay rpn={rpn} />
                    <ControlsBox
                        controls={controls}
                        isExpanded={isControlsExpanded}
                        onToggle={() =>
                            setIsControlsExpanded(!isControlsExpanded)
                        }
                    />
                </CardContent>
            </Card>
        </TooltipProvider>
    );
}

function InfoBox({
    title,
    content,
    icon: Icon,
}: {
    title: string;
    content: string;
    icon: React.ElementType;
}) {
    return (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 shadow-sm">
            <h4 className="mb-2 flex items-center gap-2 text-sm font-bold text-gray-700">
                <Icon className="h-4 w-4 text-gray-600" />
                {title}
            </h4>
            <p className="text-sm text-gray-600">{content || "N/A"}</p>
        </div>
    );
}

function RiskIndicators({
    severity,
    occurrence,
    detection,
}: {
    severity: number;
    occurrence: number;
    detection: number;
}) {
    return (
        <div className="flex justify-between items-center rounded-lg border border-gray-200 bg-gray-50 p-3">
            <RiskIndicator
                title="Severity"
                value={severity}
                icon={AlertTriangle}
            />
            <div className="h-8 w-px bg-gray-300" />
            <RiskIndicator
                title="Occurrence"
                value={occurrence}
                icon={BarChart2}
            />
            <div className="h-8 w-px bg-gray-300" />
            <RiskIndicator title="Detection" value={detection} icon={Eye} />
        </div>
    );
}

function RiskIndicator({
    title,
    value,
    icon: Icon,
}: {
    title: string;
    value: number;
    icon: React.ElementType;
}) {
    const getColorClass = (value: number) => {
        if (value >= 8) return "text-white bg-red-500";
        if (value >= 5) return "text-white bg-orange-500";
        if (value >= 3) return "text-white bg-yellow-500";
        return "text-white bg-green-500";
    };

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="flex flex-col items-center flex-1 cursor-help">
                        <Icon className="h-4 w-4 text-gray-500 mb-1" />
                        <div className="text-xs font-medium text-gray-500 mb-1">
                            {title}
                        </div>
                        <div
                            className={`text-lg font-bold w-10 h-10 rounded-full flex items-center justify-center ${getColorClass(
                                value
                            )}`}
                        >
                            {value}
                        </div>
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{`${title} Scale: 1-10`}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

function RPNDisplay({ rpn }: { rpn: number }) {
    const getRPNColor = (value: number) => {
        if (value >= 200) return "bg-red-500";
        if (value >= 120) return "bg-orange-500";
        if (value >= 80) return "bg-yellow-500";
        return "bg-green-500";
    };

    const sections = [
        { threshold: 80, color: "bg-green-500" },
        { threshold: 120, color: "bg-yellow-500" },
        { threshold: 200, color: "bg-orange-500" },
        { threshold: 1000, color: "bg-red-500" },
    ];

    return (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
            <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-bold text-gray-700">
                    Risk Priority Number (RPN)
                </span>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Badge
                            className={`${getRPNColor(
                                rpn
                            )} text-white text-sm font-medium px-2 py-1 rounded-full cursor-help`}
                        >
                            {rpn}
                        </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>RPN = Severity x Occurrence x Detection</p>
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
                            className={`absolute h-full ${section.color}`}
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
                            className="absolute h-full w-px bg-white"
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
}: {
    controls: string;
    isExpanded: boolean;
    onToggle: () => void;
}) {
    const [preventiveActions, detectionActions] = React.useMemo(() => {
        const actions = controls
            .split("\n")
            .filter((action) => action.trim() !== "");
        const midpoint = Math.ceil(actions.length / 2);
        return [actions.slice(0, midpoint), actions.slice(midpoint)];
    }, [controls]);

    return (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
            <h4
                className="mb-3 flex items-center justify-between text-sm font-bold text-gray-700 cursor-pointer"
                onClick={onToggle}
            >
                <span className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-gray-600" />
                    Controls
                </span>
                {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                ) : (
                    <ChevronDown className="h-4 w-4" />
                )}
            </h4>
            {isExpanded && (
                <div className="grid gap-3 sm:grid-cols-2">
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
    );
}

function ActionList({ title, actions }: { title: string; actions: string[] }) {
    return (
        <div>
            <h5 className="mb-2 text-xs font-semibold text-gray-600">
                {title}
            </h5>
            {actions.length > 0 ? (
                <ul className="list-inside list-disc space-y-1">
                    {actions.map((action, index) => (
                        <li
                            key={index}
                            className="text-sm text-gray-600 flex items-center justify-between"
                        >
                            <span>{action}</span>
                            <Badge variant="outline" className="text-xs">
                                Partially Effective
                            </Badge>
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
