import React, { useMemo } from "react";
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    ChartOptions,
} from "chart.js";
import { Pie } from "react-chartjs-2";
import { FMEAData } from "@/lib/types";

ChartJS.register(ArcElement, Tooltip, Legend);

interface SeverityDistributionChartProps {
    data: FMEAData;
}

export const SeverityDistributionChart: React.FC<
    SeverityDistributionChartProps
> = ({ data }) => {
    const chartData = useMemo(() => {
        const severityCounts = new Array(10).fill(0);

        Object.values(data).forEach((component) => {
            Object.values(component.functions).forEach((func) => {
                Object.values(func.faults).forEach((fault) => {
                    if (fault.severity >= 1 && fault.severity <= 10) {
                        severityCounts[fault.severity - 1]++;
                    }
                });
            });
        });

        return {
            labels: [
                "Severity 1",
                "Severity 2",
                "Severity 3",
                "Severity 4",
                "Severity 5",
                "Severity 6",
                "Severity 7",
                "Severity 8",
                "Severity 9",
                "Severity 10",
            ],
            datasets: [
                {
                    data: severityCounts,
                    backgroundColor: [
                        "rgba(255, 99, 132, 0.6)",
                        "rgba(54, 162, 235, 0.6)",
                        "rgba(255, 206, 86, 0.6)",
                        "rgba(75, 192, 192, 0.6)",
                        "rgba(153, 102, 255, 0.6)",
                        "rgba(255, 159, 64, 0.6)",
                        "rgba(199, 199, 199, 0.6)",
                        "rgba(83, 102, 255, 0.6)",
                        "rgba(40, 159, 64, 0.6)",
                        "rgba(210, 30, 30, 0.6)",
                    ],
                    borderColor: [
                        "rgba(255, 99, 132, 1)",
                        "rgba(54, 162, 235, 1)",
                        "rgba(255, 206, 86, 1)",
                        "rgba(75, 192, 192, 1)",
                        "rgba(153, 102, 255, 1)",
                        "rgba(255, 159, 64, 1)",
                        "rgba(199, 199, 199, 1)",
                        "rgba(83, 102, 255, 1)",
                        "rgba(40, 159, 64, 1)",
                        "rgba(210, 30, 30, 1)",
                    ],
                    borderWidth: 1,
                },
            ],
        };
    }, [data]);

    const options: ChartOptions<"pie"> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: "right" as const,
            },
            title: {
                display: true,
                text: "Severity Distribution",
            },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        const label = context.label || "";
                        const value = context.raw as number;
                        const total = (
                            context.chart.data.datasets[0].data as number[]
                        ).reduce((a, b) => a + b, 0);
                        const percentage = ((value / total) * 100).toFixed(1);
                        return `${label}: ${value} (${percentage}%)`;
                    },
                },
            },
        },
    };

    return (
        <div style={{ height: "400px" }}>
            <Pie data={chartData} options={options} />
        </div>
    );
};
