import React from "react";
import dynamic from "next/dynamic";
import { FMEAData } from "@/lib/types";

const RiskPriorityChart = dynamic(
    () =>
        import("./analysis/risk-priority-chart").then(
            (mod) => mod.RiskPriorityChart
        ),
    { ssr: false }
);

const SeverityDistributionChart = dynamic(
    () =>
        import("./analysis/severity-distribution-chart").then(
            (mod) => mod.SeverityDistributionChart
        ),
    { ssr: false }
);

interface AnalysisPageProps {
    data: FMEAData;
}

export const AnalysisPage: React.FC<AnalysisPageProps> = ({ data }) => {
    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">FMEA Analysis Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded-lg shadow">
                    <RiskPriorityChart data={data} />
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                    <SeverityDistributionChart data={data} />
                </div>
            </div>
        </div>
    );
};
