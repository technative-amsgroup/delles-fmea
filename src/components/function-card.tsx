// function-card.tsx
import React, { useCallback, useMemo } from "react";
import { FunctionSquareIcon, AlertTriangleIcon } from "lucide-react";
import {
    ParentTreeNode,
    FaultTreeNode,
    FMEAData,
    FaultData,
} from "@/lib/types";
import { FaultCardComponent } from "@/components/fault-card";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const MemoizedFaultCardComponent = React.memo(FaultCardComponent);

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
    const getRPNColor = useCallback((rpn: number) => {
        if (rpn >= 200) return "bg-red-500 text-white";
        if (rpn >= 120) return "bg-orange-500 text-white";
        if (rpn >= 80) return "bg-yellow-500 text-white";
        return "bg-green-500 text-white";
    }, []);

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

    // Memoize the onDataChange handlers for each fault to ensure they are stable
    const faultDataChangeHandlers = useMemo(() => {
        const handlers: Record<
            string,
            (updatedFaultData: Partial<FaultData>) => void
        > = {};
        faults.forEach((fault) => {
            handlers[fault.id] = (updatedFaultData) =>
                handleFaultDataChange(func.id, fault.id, updatedFaultData);
        });
        return handlers;
    }, [faults, func.id, handleFaultDataChange]);

    const memoizedFaults = useMemo(() => {
        return faults.map((fault) => {
            const faultData =
                data[componentId]?.functions[func.id]?.faults[fault.id] || {};
            const rpn =
                (Number(faultData.severity) || 1) *
                (Number(faultData.occurrence) || 1) *
                (Number(faultData.detection) || 1);

            return (
                <AccordionItem value={fault.id} key={fault.id}>
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center justify-between w-full">
                            <div className="flex items-center space-x-2">
                                <AlertTriangleIcon className="h-5 w-5 text-yellow-500" />
                                <span>
                                    Failure Mode:{" "}
                                    {faultData.failureMode || fault.name}
                                </span>
                            </div>
                            <Badge className={cn(getRPNColor(rpn))}>
                                RPN: {rpn}
                            </Badge>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent>
                        <MemoizedFaultCardComponent
                            id={fault.id}
                            component={componentId}
                            failureMode={faultData.failureMode || fault.name}
                            effect={faultData.effect || ""}
                            cause={faultData.cause || ""}
                            severity={Number(faultData.severity) || 1}
                            occurrence={Number(faultData.occurrence) || 1}
                            detection={Number(faultData.detection) || 1}
                            controls={faultData.controls || ""}
                            onDataChange={faultDataChangeHandlers[fault.id]}
                        />
                    </AccordionContent>
                </AccordionItem>
            );
        });
    }, [
        faults,
        data,
        componentId,
        func.id,
        getRPNColor,
        faultDataChangeHandlers,
    ]);

    return (
        <Card className="mb-6">
            <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-xl font-semibold">
                    <FunctionSquareIcon className="h-6 w-6 text-primary" />
                    <span>Function: {func.name}</span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Accordion type="single" collapsible className="w-full">
                    {memoizedFaults}
                </Accordion>
            </CardContent>
        </Card>
    );
});
