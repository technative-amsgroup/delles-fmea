import React, { useMemo } from "react";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { FMEAData } from "@/lib/types";

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

interface RiskPriorityChartProps {
    data: FMEAData;
}

export const RiskPriorityChart: React.FC<RiskPriorityChartProps> = ({
    data,
}) => {
    const chartData = useMemo(() => {
        const riskData: { label: string; rpn: number }[] = [];

        Object.entries(data).forEach(([componentId, component]) => {
            Object.entries(component.functions).forEach(
                ([functionId, func]) => {
                    Object.values(func.faults).forEach((fault) => {
                        const rpn =
                            fault.severity * fault.occurrence * fault.detection;
                        riskData.push({
                            label: `${componentId} > ${functionId} > ${fault.failureMode}`,
                            rpn,
                        });
                    });
                }
            );
        });

        // Sort by RPN in descending order and take top 10
        const top10Risks = riskData.sort((a, b) => b.rpn - a.rpn).slice(0, 10);

        return {
            labels: top10Risks.map((risk) => risk.label),
            datasets: [
                {
                    label: "Risk Priority Number (RPN)",
                    data: top10Risks.map((risk) => risk.rpn),
                    backgroundColor: "rgba(75, 192, 192, 0.6)",
                    borderColor: "rgba(75, 192, 192, 1)",
                    borderWidth: 1,
                },
            ],
        };
    }, [data]);

    const options = {
        indexAxis: "y" as const,
        responsive: true,
        plugins: {
            legend: {
                position: "top" as const,
            },
            title: {
                display: true,
                text: "Top 10 Risks by RPN",
            },
        },
        scales: {
            x: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: "Risk Priority Number (RPN)",
                },
            },
            y: {
                title: {
                    display: true,
                    text: "Failure Mode",
                },
            },
        },
    };

    return <Bar options={options} data={chartData} />;
};
