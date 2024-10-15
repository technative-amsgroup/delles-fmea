// function-card.tsx
import React, { useCallback, useMemo, useState } from "react";
import {
    FunctionSquareIcon,
    ChevronRightIcon,
    ChevronDownIcon,
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
}

export const FunctionCard = React.memo(function FunctionCard({
    func,
    faults,
    componentId,
    data,
    onFaultDataChange,
}: FunctionCardProps) {
    const [openFaultId, setOpenFaultId] = useState<string | null>(null);

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

    return (
        <Card className="mb-6 overflow-hidden">
            <CardHeader className="bg-gray-50">
                <CardTitle className="flex items-center justify-between text-xl font-semibold">
                    <div className="flex items-center space-x-2">
                        <FunctionSquareIcon className="h-6 w-6 text-primary" />
                        <span>{func.name}</span>
                    </div>
                    <Badge className={cn("text-white", overallRisk.color)}>
                        {overallRisk.level} Risk
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <ul className="divide-y divide-gray-200">
                    {sortedFaults.map((fault) => (
                        <li key={fault.id}>
                            <div
                                className="p-4 hover:bg-gray-50 cursor-pointer"
                                onClick={() => toggleFault(fault.id)}
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-900">
                                            {fault.faultData.failureMode ||
                                                fault.name}
                                        </h3>
                                        <p className="mt-1 text-sm text-gray-500 truncate">
                                            {fault.faultData.effect ||
                                                "No effect specified"}
                                        </p>
                                    </div>
                                    <div className="flex items-center">
                                        <Badge
                                            className={cn(
                                                getRPNColor(fault.rpn),
                                                "mr-2"
                                            )}
                                        >
                                            RPN: {fault.rpn}
                                        </Badge>
                                        {openFaultId === fault.id ? (
                                            <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                                        ) : (
                                            <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                                        )}
                                    </div>
                                </div>
                            </div>
                            {openFaultId === fault.id && (
                                <FaultCardComponent
                                    id={fault.id}
                                    component={func.name}
                                    failureMode={
                                        fault.faultData.failureMode ||
                                        fault.name
                                    }
                                    effect={
                                        fault.faultData.effect ||
                                        "No effect specified"
                                    }
                                    cause={
                                        fault.faultData.cause ||
                                        "No cause specified"
                                    }
                                    severity={
                                        Number(fault.faultData.severity) || 1
                                    }
                                    occurrence={
                                        Number(fault.faultData.occurrence) || 1
                                    }
                                    detection={
                                        Number(fault.faultData.detection) || 1
                                    }
                                    controls={
                                        fault.faultData.controls ||
                                        "No controls specified"
                                    }
                                    onDataChange={(updatedFaultData) =>
                                        handleFaultDataChange(
                                            func.id,
                                            fault.id,
                                            updatedFaultData
                                        )
                                    }
                                />
                            )}
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    );
});

// Helper function to determine RPN color
function getRPNColor(rpn: number) {
    if (rpn >= 200) return "bg-red-500";
    if (rpn >= 120) return "bg-orange-500";
    if (rpn >= 80) return "bg-yellow-500";
    return "bg-green-500";
}
