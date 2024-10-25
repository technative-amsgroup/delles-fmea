"use client";

import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { TreeNode } from "@/lib/types";
import { exportAsSVG, exportAsPNG } from "@/lib/export-utils";

interface TreeDiagramProps {
    data: TreeNode;
    width?: number;
    height?: number;
}

type HierarchyPointNode = d3.HierarchyPointNode<TreeNode>;
type HierarchyPointLink = d3.HierarchyPointLink<TreeNode>;

// Add this interface to track collapsed state without modifying the original data
interface CollapsibleState {
    [nodeId: string]: boolean;
}

export function TreeDiagram({
    data,
    width = 1200,
    height = 800,
}: TreeDiagramProps) {
    // Add state to track collapsed nodes
    const [collapsedNodes, setCollapsedNodes] = useState<CollapsibleState>({});
    const svgRef = useRef<SVGSVGElement>(null);

    const handleExportSVG = () => {
        if (!svgRef.current) return;
        exportAsSVG(svgRef.current);
    };

    const handleExportPNG = () => {
        if (!svgRef.current) return;
        exportAsPNG(svgRef.current);
    };

    // Add helper function to process data based on collapsed state
    const processData = React.useCallback(
        (node: TreeNode): TreeNode => {
            if (node.type === "fault") return node;

            const processedNode = { ...node };
            if (collapsedNodes[node.id]) {
                processedNode.children = [];
            } else {
                processedNode.children = node.children.map((child) =>
                    processData(child)
                );
            }
            return processedNode;
        },
        [collapsedNodes]
    );

    const handleNodeClick = (node: TreeNode) => {
        if (node.type === "fault") return; // Don't allow clicking fault nodes

        setCollapsedNodes((prev) => ({
            ...prev,
            [node.id]: !prev[node.id],
        }));
    };

    useEffect(() => {
        if (!svgRef.current) return;

        // Process data with collapsed states
        const processedData = processData(data);

        // Clear any existing content
        d3.select(svgRef.current).selectAll("*").remove();

        // Add a white background rectangle
        const svg = d3
            .select(svgRef.current)
            .attr("width", width)
            .attr("height", height);

        svg.append("rect")
            .attr("width", "100%")
            .attr("height", "100%")
            .attr("fill", "white");

        // Initialize the tree layout
        const treeLayout = d3
            .tree<TreeNode>()
            .size([height - 120, width - 300]); // Adjust for margins

        // Create the hierarchy from data
        const root = d3.hierarchy(processedData) as d3.HierarchyNode<TreeNode>;
        const treeData = treeLayout(root);

        // Create the SVG container with margins
        const margin = { top: 60, right: 150, bottom: 60, left: 150 };
        const svgContainer = d3
            .select(svgRef.current)
            .attr("width", width)
            .attr("height", height);

        // Add zoom behavior
        const zoom = d3
            .zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.5, 2]) // Set min/max zoom scale
            .on("zoom", (event) => {
                mainGroup.attr("transform", event.transform);
            });

        // Apply zoom to svg
        svgContainer.call(zoom);

        // Create main group for all content
        const mainGroup = svgContainer
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

        const legend = mainGroup
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
                        return "black"; // Changed to black
                    case "subsystem":
                        return "#f59e0b";
                    case "component":
                        return "#3b82f6";
                    case "function":
                        return "#22c55e"; // Changed to green
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
                        return "black"; // Changed to black
                    case "subsystem":
                        return "#f59e0b";
                    case "component":
                        return "#3b82f6";
                    case "function":
                        return "#22c55e"; // Changed to green
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
        mainGroup
            .selectAll(".link")
            .data(treeData.links())
            .join("path")
            .attr("class", "link")
            .attr("fill", "none")
            .attr("stroke", (d: HierarchyPointLink) => {
                switch (d.target.data.type) {
                    case "system":
                        return "black"; // Changed to black
                    case "subsystem":
                        return "#f59e0b"; // amber
                    case "component":
                        return "#3b82f6"; // blue
                    case "function":
                        return "#22c55e"; // Changed to green
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
        const nodes = mainGroup
            .selectAll(".node")
            .data(treeData.descendants())
            .join("g")
            .attr("class", "node")
            .attr(
                "transform",
                (d: HierarchyPointNode) => `translate(${d.y},${d.x})`
            );

        // Modify the circles to be bigger
        nodes
            .append("circle")
            .attr("r", 8) // Changed from 5 to 8
            .attr("fill", (d: HierarchyPointNode) => {
                switch (d.data.type) {
                    case "system":
                        return "black"; // Changed to black
                    case "subsystem":
                        return "#f59e0b";
                    case "component":
                        return "#3b82f6";
                    case "function":
                        return "#22c55e"; // Changed to green
                    case "fault":
                        return "#ef4444";
                    default:
                        return "#94a3b8";
                }
            })
            .style("cursor", (d) =>
                d.data.type !== "fault" ? "pointer" : "default"
            )
            .on("click", (event, d: HierarchyPointNode) => {
                if (d.data.type !== "fault") {
                    handleNodeClick(d.data);
                }
            });

        // Adjust the +/- symbols to be more visible
        nodes
            .append("text")
            .attr("dy", "0.31em")
            .attr("text-anchor", "middle")
            .attr("class", "text-[10px] fill-white select-none")
            .style("pointer-events", "none")
            .text((d: HierarchyPointNode) => {
                if (d.data.type === "fault") return "";

                // Find the original node in the data tree
                const findOriginalNode = (
                    node: TreeNode,
                    targetId: string
                ): TreeNode | null => {
                    if (node.id === targetId) return node;
                    // Check if node is not a fault node and has children
                    if (node.type !== "fault" && node.children) {
                        for (const child of node.children) {
                            const found = findOriginalNode(child, targetId);
                            if (found) return found;
                        }
                    }
                    return null;
                };

                const originalNode = findOriginalNode(data, d.data.id);
                // Check if node is not a fault node and has children
                if (
                    !originalNode ||
                    originalNode.type === "fault" ||
                    !originalNode.children?.length
                ) {
                    return "";
                }

                // Show + when collapsed, - when expanded
                return collapsedNodes[d.data.id] ? "+" : "−";
            });

        // Adjust the label positions to account for bigger circles
        nodes
            .append("text")
            .attr("dy", "0.31em")
            .attr("x", (d: HierarchyPointNode) => (d.children ? -25 : 25)) // Increased spacing from -20/20 to -25/25
            .attr("text-anchor", (d: HierarchyPointNode) =>
                d.children ? "end" : "start"
            )
            .text((d: HierarchyPointNode) => d.data.name)
            .attr("class", "text-sm fill-gray-700 font-medium") // Added font-medium
            .clone(true)
            .lower()
            .attr("stroke", "white")
            .attr("stroke-width", 4); // Increased stroke width for better text background
    }, [data, width, height, collapsedNodes, processData]); // Added processData to dependencies

    return (
        <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex gap-2 mb-4">
                <button
                    onClick={handleExportSVG}
                    className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                    Export SVG
                </button>
                <button
                    onClick={handleExportPNG}
                    className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                    Export PNG
                </button>
            </div>
            <div className="overflow-auto">
                <svg ref={svgRef} className="w-full h-full" />
            </div>
        </div>
    );
}
