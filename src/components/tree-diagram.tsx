"use client";

import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import { TreeNode } from "@/lib/types";

interface TreeDiagramProps {
    data: TreeNode;
    width?: number;
    height?: number;
}

type HierarchyPointNode = d3.HierarchyPointNode<TreeNode>;
type HierarchyPointLink = d3.HierarchyPointLink<TreeNode>;

export function TreeDiagram({
    data,
    width = 1200,
    height = 800,
}: TreeDiagramProps) {
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (!svgRef.current) return;

        // Clear any existing content
        d3.select(svgRef.current).selectAll("*").remove();

        // Create the tree layout with adjusted size
        const treeLayout = d3
            .tree<TreeNode>()
            .size([height - 100, width - 200])
            .separation((a, b) => (a.parent === b.parent ? 4 : 5)); // Increased separation further

        // Create the hierarchy from the data
        const root = d3.hierarchy(data);

        // Generate the tree layout
        const treeData = treeLayout(root);

        // Create the SVG container with margins
        const margin = { top: 60, right: 150, bottom: 60, left: 150 }; // Increased margins
        const svg = d3
            .select(svgRef.current)
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`);

        // Add legend
        const legendData = [
            { type: "system", label: "System" },
            { type: "subsystem", label: "Subsystem" },
            { type: "component", label: "Component" },
            { type: "function", label: "Function" },
            { type: "fault", label: "Fault" },
        ];

        const legend = svg
            .append("g")
            .attr("class", "legend")
            .attr("transform", `translate(10, -45)`); // Position at top-left

        const legendItems = legend
            .selectAll(".legend-item")
            .data(legendData)
            .join("g")
            .attr("class", "legend-item")
            .attr("transform", (d, i) => `translate(${i * 120}, 0)`);

        // Add circles for the legend
        legendItems
            .append("circle")
            .attr("r", 5)
            .attr("fill", (d) => {
                switch (d.type) {
                    case "system":
                        return "#22c55e";
                    case "subsystem":
                        return "#f59e0b";
                    case "component":
                        return "#3b82f6";
                    case "function":
                        return "#8b5cf6";
                    case "fault":
                        return "#ef4444";
                    default:
                        return "#94a3b8";
                }
            });

        // Add lines for the legend
        legendItems
            .append("line")
            .attr("x1", 8)
            .attr("y1", 0)
            .attr("x2", 28)
            .attr("y2", 0)
            .attr("stroke", (d) => {
                switch (d.type) {
                    case "system":
                        return "#22c55e";
                    case "subsystem":
                        return "#f59e0b";
                    case "component":
                        return "#3b82f6";
                    case "function":
                        return "#8b5cf6";
                    case "fault":
                        return "#ef4444";
                    default:
                        return "#94a3b8";
                }
            })
            .attr("stroke-width", 1.5);

        // Add text labels
        legendItems
            .append("text")
            .attr("x", 32)
            .attr("y", 0)
            .attr("dy", "0.31em")
            .text((d) => d.label)
            .attr("class", "text-sm fill-gray-700");

        // Create links with colors based on child node type
        svg.selectAll(".link")
            .data(treeData.links())
            .join("path")
            .attr("class", "link")
            .attr("fill", "none")
            .attr("stroke", (d) => {
                switch (d.target.data.type) {
                    case "system":
                        return "#22c55e"; // green
                    case "subsystem":
                        return "#f59e0b"; // amber
                    case "component":
                        return "#3b82f6"; // blue
                    case "function":
                        return "#8b5cf6"; // purple
                    case "fault":
                        return "#ef4444"; // red
                    default:
                        return "#94a3b8"; // gray
                }
            })
            .attr("stroke-width", 1.5) // Slightly increased width for better visibility
            .attr(
                "d",
                d3
                    .linkHorizontal<HierarchyPointLink, HierarchyPointNode>()
                    .x((d) => d.y)
                    .y((d) => d.x)
            );

        // Create nodes
        const nodes = svg
            .selectAll(".node")
            .data(treeData.descendants())
            .join("g")
            .attr("class", "node")
            .attr("transform", (d) => `translate(${d.y},${d.x})`);

        // Add circles for nodes
        nodes
            .append("circle")
            .attr("r", 5)
            .attr("fill", (d) => {
                switch (d.data.type) {
                    case "system":
                        return "#22c55e"; // green
                    case "subsystem":
                        return "#f59e0b"; // amber
                    case "component":
                        return "#3b82f6"; // blue
                    case "function":
                        return "#8b5cf6"; // purple
                    case "fault":
                        return "#ef4444"; // red
                    default:
                        return "#94a3b8"; // gray
                }
            });

        // Add labels with more spacing
        nodes
            .append("text")
            .attr("dy", "0.31em")
            .attr("x", (d) => (d.children ? -20 : 20)) // Increased spacing from nodes
            .attr("text-anchor", (d) => (d.children ? "end" : "start"))
            .text((d) => d.data.name)
            .attr("class", "text-sm fill-gray-700 font-medium") // Added font-medium
            .clone(true)
            .lower()
            .attr("stroke", "white")
            .attr("stroke-width", 4); // Increased stroke width for better text background
    }, [data, width, height]);

    return (
        <div className="bg-white p-4 rounded-lg shadow-sm overflow-auto">
            <svg ref={svgRef} className="w-full h-full" />
        </div>
    );
}
