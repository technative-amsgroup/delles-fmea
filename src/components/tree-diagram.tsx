"use client";

import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { TreeNode, ParentTreeNode } from "@/lib/types";
import { exportAsSVG, exportAsPNG } from "@/lib/export-utils";

interface TreeDiagramProps {
    data: TreeNode;
    width?: number;
    height?: number;
}

type HierarchyPointNode = d3.HierarchyPointNode<TreeNode>;
type HierarchyPointLink = d3.HierarchyPointLink<TreeNode>;

type ViewMode = "tree" | "element";

// Add this interface to track collapsed state without modifying the original data
interface CollapsibleState {
    [nodeId: string]: boolean;
}

export function TreeDiagram({
    data,
    width = 1200,
    height = 800,
}: TreeDiagramProps) {
    const [viewMode, setViewMode] = useState<ViewMode>("tree");
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
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

    // Add this function after your state declarations
    const filterDataForElementView = React.useCallback(
        (node: TreeNode): TreeNode => {
            if (!selectedNodeId) return node;

            // Function to find path to selected node and its descendants
            const findNodePathAndDescendants = (
                current: TreeNode,
                path: Set<string> = new Set(),
                isInSelectedSubtree: boolean = false
            ): boolean => {
                // If we're already in the selected node's subtree, add all descendants
                if (isInSelectedSubtree) {
                    path.add(current.id);
                    current.children?.forEach((child) =>
                        findNodePathAndDescendants(child, path, true)
                    );
                    return true;
                }

                // If this is the selected node, mark that we're entering its subtree
                if (current.id === selectedNodeId) {
                    path.add(current.id);
                    current.children?.forEach((child) =>
                        findNodePathAndDescendants(child, path, true)
                    );
                    return true;
                }

                // Continue searching for the selected node
                if (current.type !== "fault" && current.children) {
                    for (const child of current.children) {
                        if (findNodePathAndDescendants(child, path, false)) {
                            path.add(current.id);
                            return true;
                        }
                    }
                }
                return false;
            };

            const relevantNodes = new Set<string>();
            findNodePathAndDescendants(node, relevantNodes);

            // Function to filter the tree
            const filterNode = (current: TreeNode): TreeNode | null => {
                if (!relevantNodes.has(current.id)) {
                    return null; // Remove nodes not in the path
                }

                if (current.type === "fault") {
                    return current;
                }

                // For the selected node, keep the entire subtree without filtering
                if (current.id === selectedNodeId) {
                    return current; // Return the entire subtree without processing
                }

                // For ancestors of the selected node, only keep the path
                const parentNode = current as ParentTreeNode;
                const filteredChildren = parentNode.children
                    .map((child) => filterNode(child))
                    .filter((child): child is TreeNode => child !== null);

                return {
                    ...parentNode,
                    children: filteredChildren,
                } as ParentTreeNode;
            };

            return filterNode(node) || node;
        },
        [selectedNodeId]
    );

    const handleNodeClick = React.useCallback(
        (node: TreeNode, isLabelClick = false) => {
            if (node.type === "fault") return;

            if (isLabelClick) {
                setSelectedNodeId(node.id);

                if (node.id === data.id) {
                    // First, reset all collapsed states
                    setCollapsedNodes({});

                    // Then collapse everything except direct children of root
                    const collapseAfterLevel1 = (
                        currentNode: TreeNode,
                        level: number
                    ) => {
                        if (level > 1 && currentNode.type !== "fault") {
                            setCollapsedNodes((prev) => ({
                                ...prev,
                                [currentNode.id]: true,
                            }));
                            currentNode.children?.forEach((child) =>
                                collapseAfterLevel1(child, level + 1)
                            );
                        }
                    };

                    // Start from level 1 (root's children)
                    data.children?.forEach((child) =>
                        collapseAfterLevel1(child, 2)
                    );
                } else {
                    // Find the complete node in the original data tree
                    const findNodeInTree = (
                        searchNode: TreeNode,
                        targetId: string
                    ): TreeNode | null => {
                        if (searchNode.id === targetId) return searchNode;
                        if (
                            searchNode.type !== "fault" &&
                            searchNode.children
                        ) {
                            for (const child of searchNode.children) {
                                const found = findNodeInTree(child, targetId);
                                if (found) return found;
                            }
                        }
                        return null;
                    };

                    // Get the complete node from the original data
                    const originalNode = findNodeInTree(data, node.id);
                    if (!originalNode) return;

                    // Collect IDs from the complete subtree
                    const subtreeNodeIds = new Set<string>();
                    const collectSubtreeNodeIds = (currentNode: TreeNode) => {
                        if (currentNode.type !== "fault") {
                            subtreeNodeIds.add(currentNode.id);
                            currentNode.children?.forEach(
                                collectSubtreeNodeIds
                            );
                        }
                    };

                    collectSubtreeNodeIds(originalNode);

                    setCollapsedNodes((prev) => {
                        const newState = { ...prev };
                        subtreeNodeIds.forEach((id) => {
                            delete newState[id];
                        });
                        return newState;
                    });
                }
            } else if (viewMode !== "element") {
                // Toggle collapse state only in tree view
                setCollapsedNodes((prev) => ({
                    ...prev,
                    [node.id]: !prev[node.id],
                }));
            } else {
                // Element view - expand entire subtree recursively
                const expandSubtree = (currentNode: TreeNode) => {
                    setCollapsedNodes((prev) => {
                        const newState = { ...prev };
                        delete newState[currentNode.id]; // Expand current node
                        return newState;
                    });

                    // Recursively expand children
                    currentNode.children?.forEach(expandSubtree);
                };

                expandSubtree(node);
            }
        },
        [viewMode, data]
    );

    useEffect(() => {
        if (!svgRef.current) return;

        // First filter the data based on view mode
        let processedData = data;
        if (viewMode === "element" && selectedNodeId) {
            processedData = filterDataForElementView(data);
        }

        // Then process collapsed states
        processedData = processData(processedData);

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
            .size([height - 200, width - 200]); // Changed from width - 300 to width - 600 to double horizontal spacing

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
            .attr("x", (d: HierarchyPointNode) => (d.children ? -25 : 25))
            .attr("text-anchor", (d: HierarchyPointNode) =>
                d.children ? "end" : "start"
            )
            .text((d: HierarchyPointNode) => d.data.name)
            .attr("class", "text-sm fill-gray-700 font-medium")
            .style("cursor", "pointer")
            .on("click", (event, d: HierarchyPointNode) => {
                handleNodeClick(d.data, true);
            })
            .clone(true)
            .lower()
            .attr("stroke", "white")
            .attr("stroke-width", 4);
    }, [
        data,
        width,
        height,
        collapsedNodes,
        processData,
        viewMode,
        selectedNodeId,
        filterDataForElementView,
        handleNodeClick,
    ]);

    useEffect(() => {
        if (viewMode === "element") {
            // Collapse all nodes beyond level 1 (root's direct children)
            const initializeCollapsedState = (
                node: TreeNode,
                level: number
            ) => {
                if (level > 1 && node.children?.length) {
                    setCollapsedNodes((prev) => ({ ...prev, [node.id]: true }));
                }
                node.children?.forEach((child) =>
                    initializeCollapsedState(child, level + 1)
                );
            };
            initializeCollapsedState(data, 1);
        }
    }, [viewMode, data]);

    return (
        <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex justify-between mb-4">
                <div className="flex gap-2">
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
                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            setViewMode("tree");
                            setSelectedNodeId(null);
                            setCollapsedNodes({});
                        }}
                        className={`px-3 py-1 text-sm rounded transition-colors ${
                            viewMode === "tree"
                                ? "bg-blue-500 text-white"
                                : "bg-gray-200 text-gray-700"
                        }`}
                    >
                        Tree View
                    </button>
                    <button
                        onClick={() => setViewMode("element")}
                        className={`px-3 py-1 text-sm rounded transition-colors ${
                            viewMode === "element"
                                ? "bg-blue-500 text-white"
                                : "bg-gray-200 text-gray-700"
                        }`}
                    >
                        Element View
                    </button>
                </div>
            </div>
            <div className="overflow-auto">
                <svg ref={svgRef} className="w-full h-full" />
            </div>
        </div>
    );
}
