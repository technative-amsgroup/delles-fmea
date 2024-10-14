'use client'

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FaultData } from "@/lib/types";
import { AlertTriangle, Info, Activity, BarChart2, Eye } from "lucide-react";

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
  const rpn = React.useMemo(
    () => severity * occurrence * detection,
    [severity, occurrence, detection]
  );

  return (
    <Card className="w-full overflow-hidden transition-all hover:shadow-lg">
      <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50 pb-2">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-800">
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
          {failureMode}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <InfoBox title="Effect" content={effect} icon={Info} />
          <InfoBox title="Cause" content={cause} icon={AlertTriangle} />
        </div>
        <RiskIndicators
          severity={severity}
          occurrence={occurrence}
          detection={detection}
        />
        <RPNDisplay rpn={rpn} />
        <InfoBox title="Controls" content={controls} icon={Activity} />
      </CardContent>
    </Card>
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
    <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm transition-all hover:border-gray-200">
      <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
        <Icon className="h-4 w-4 text-gray-500" />
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
    <div className="grid grid-cols-3 gap-4">
      <RiskIndicator title="Severity" value={severity} icon={AlertTriangle} />
      <RiskIndicator title="Occurrence" value={occurrence} icon={BarChart2} />
      <RiskIndicator title="Detection" value={detection} icon={Eye} />
    </div>
  );
}

function RiskIndicator({ title, value, icon: Icon }: { title: string; value: number; icon: React.ElementType }) {
  const getColorClass = (value: number) => {
    if (value >= 8) return "bg-red-500";
    if (value >= 5) return "bg-orange-500";
    if (value >= 3) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <div className="flex flex-col items-center rounded-lg border border-gray-100 bg-white p-4 shadow-sm transition-all hover:border-gray-200">
      <Icon className="mb-2 h-6 w-6 text-gray-500" />
      <div className="text-xs font-medium text-gray-600 mb-2">{title}</div>
      <div
        className={`w-12 h-12 ${getColorClass(
          value
        )} text-white rounded-full flex items-center justify-center`}
      >
        <span className="text-lg font-bold">{value}</span>
      </div>
    </div>
  );
}

function RPNDisplay({ rpn }: { rpn: number }) {
  const getRPNColor = (rpn: number) => {
    if (rpn >= 200) return "bg-red-500";
    if (rpn >= 120) return "bg-orange-500";
    if (rpn >= 80) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <div className="flex flex-col items-start rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
      <span className="text-sm font-medium text-gray-600 mb-2">
        Risk Priority Number (RPN)
      </span>
      <div className="flex items-center gap-4 w-full">
        <div className="h-3 flex-grow overflow-hidden rounded-full bg-gray-200">
          <div
            className={`h-full rounded-full ${getRPNColor(rpn)}`}
            style={{
              width: `${Math.min((rpn / 1000) * 100, 100)}%`,
            }}
          />
        </div>
        <Badge
          className={`${getRPNColor(
            rpn
          )} text-white text-sm font-medium px-2 py-1 rounded-full`}
        >
          {rpn}
        </Badge>
      </div>
    </div>
  );
}