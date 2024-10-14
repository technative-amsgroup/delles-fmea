"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import debounce from "lodash/debounce";
import {
    ChevronRightIcon,
    ChevronDownIcon,
    CircuitBoardIcon,
    CpuIcon,
    LayersIcon,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { TreeNode, FaultData } from "@/lib/types";
import { cn } from "@/lib/utils";
import { initialTree } from "@/lib/initial-tree-data";

// Export TreeNode and FaultData
export type { TreeNode, FaultData };

interface TreeViewProps {
    onNodeSelect: (node: TreeNode | (TreeNode & FaultData)) => void;
}

export function TreeView({ onNodeSelect }: TreeViewProps) {
    const [tree] = useState(initialTree);
    const [searchTerm, setSearchTerm] = useState("");
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(
        new Set([tree.id])
    );
    const [selectedNode, setSelectedNode] = useState<string | null>(null);
    const [highlightedNodes, setHighlightedNodes] = useState<Set<string>>(
        new Set()
    );
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

    const toggleNode = useCallback((nodeId: string) => {
        setExpandedNodes((prevExpandedNodes) => {
            const newExpandedNodes = new Set(prevExpandedNodes);
            if (newExpandedNodes.has(nodeId)) {
                newExpandedNodes.delete(nodeId);
            } else {
                newExpandedNodes.add(nodeId);
            }
            return newExpandedNodes;
        });
    }, []);

    const debouncedSearch = useMemo(
        () =>
            debounce((term: string) => {
                setDebouncedSearchTerm(term);
            }, 300),
        [setDebouncedSearchTerm]
    );

    useEffect(() => {
        debouncedSearch(searchTerm);
        return () => {
            debouncedSearch.cancel();
        };
    }, [searchTerm, debouncedSearch]);

    const searchNodes = useCallback(
        (
            node: TreeNode | (TreeNode & FaultData),
            term: string
        ): Set<string> => {
            const foundNodes = new Set<string>();
            if (node.name.toLowerCase().includes(term.toLowerCase())) {
                foundNodes.add(node.id);
            }
            if (node.children) {
                for (const child of node.children) {
                    const childFoundNodes = searchNodes(child, term);
                    if (childFoundNodes.size > 0) {
                        setExpandedNodes((prev) => new Set(prev).add(node.id));
                        childFoundNodes.forEach((id) => foundNodes.add(id));
                    }
                }
            }
            return foundNodes;
        },
        [setExpandedNodes]
    );

    const findNodeById = useCallback(
        (
            node: TreeNode | (TreeNode & FaultData),
            id: string
        ): (TreeNode | (TreeNode & FaultData)) | null => {
            if (node.id === id) return node;
            if (node.children) {
                for (const child of node.children) {
                    const found = findNodeById(child, id);
                    if (found) return found;
                }
            }
            return null;
        },
        []
    );

    useEffect(() => {
        if (debouncedSearchTerm.trim() === "") {
            setHighlightedNodes(new Set());
            setSelectedNode(null);
            return;
        }

        const foundNodes = searchNodes(tree, debouncedSearchTerm);
        setHighlightedNodes(foundNodes);
        if (foundNodes.size > 0) {
            const firstFoundNodeId = Array.from(foundNodes)[0];
            setSelectedNode(firstFoundNodeId);
            const firstFoundNode = findNodeById(tree, firstFoundNodeId);
            if (firstFoundNode) {
                onNodeSelect(firstFoundNode);
            }
        } else {
            setSelectedNode(null);
        }
    }, [debouncedSearchTerm, tree, searchNodes, findNodeById, onNodeSelect]);

    const clearSearch = useCallback(() => {
        setSearchTerm("");
        setDebouncedSearchTerm("");
        setHighlightedNodes(new Set());
    }, []);

    const renderNode = (node: TreeNode | (TreeNode & FaultData)) => {
        const hasChildren = node.children && node.children.length > 0;
        const isExpanded = expandedNodes.has(node.id);
        const isHighlighted = highlightedNodes.has(node.id);
        const isSelected = selectedNode === node.id;

        // Only render system, subsystem, and component nodes
        if (
            node.type !== "system" &&
            node.type !== "subsystem" &&
            node.type !== "component"
        ) {
            return null;
        }

        const getIcon = () => {
            switch (node.type) {
                case "system":
                    return (
                        <CircuitBoardIcon className="h-4 w-4 text-green-500" />
                    );
                case "subsystem":
                    return <CpuIcon className="h-4 w-4 text-yellow-500" />;
                case "component":
                    return <LayersIcon className="h-4 w-4 text-blue-500" />;
                default:
                    return null;
            }
        };

        return (
            <div key={node.id} className="ml-4">
                <div
                    className={cn(
                        "flex items-center space-x-2 cursor-pointer p-1 rounded",
                        isHighlighted && "bg-yellow-100",
                        isSelected && "bg-blue-200",
                        !isHighlighted && !isSelected && "hover:bg-gray-200"
                    )}
                    onClick={() => {
                        setSelectedNode(node.id);
                        onNodeSelect(node);
                        if (hasChildren) toggleNode(node.id);
                        clearSearch();
                    }}
                >
                    {hasChildren && (
                        <span
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleNode(node.id);
                            }}
                        >
                            {isExpanded ? (
                                <ChevronDownIcon className="h-4 w-4" />
                            ) : (
                                <ChevronRightIcon className="h-4 w-4" />
                            )}
                        </span>
                    )}
                    {!hasChildren && <span className="w-4" />}
                    {getIcon()}
                    <span>{node.name}</span>
                </div>
                {hasChildren && isExpanded && node.children?.map(renderNode)}
            </div>
        );
    };

    return (
        <div>
            <Input
                type="search"
                placeholder="Search nodes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mb-4"
            />
            <div className="overflow-auto max-h-[calc(100vh-12rem)]">
                {renderNode(tree)}
            </div>
        </div>
    );
}
