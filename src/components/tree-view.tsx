"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import debounce from "lodash/debounce";
import {
    ChevronRightIcon,
    ChevronDownIcon,
    CircuitBoardIcon,
    CpuIcon,
    LayersIcon,
    Pencil,
    SearchIcon,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { TreeNode, ParentTreeNode, FaultData } from "@/lib/types";
import { cn } from "@/lib/utils";
/* import { initialTree } from "@/lib/initial-tree-data"; */

// Export TreeNode and FaultData
export type { TreeNode, FaultData };

interface TreeViewProps {
    onNodeSelect: (node: TreeNode) => void;
    treeData: TreeNode;
    onNodeNameChange?: (nodeId: string, newName: string) => void;
}

const TreeView: React.FC<TreeViewProps> = ({
    onNodeSelect,
    treeData,
    onNodeNameChange,
}) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(
        new Set([treeData.id])
    );
    const [selectedNode, setSelectedNode] = useState<string | null>(null);
    const [highlightedNodes, setHighlightedNodes] = useState<Set<string>>(
        new Set()
    );
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
    const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
    const [editedName, setEditedName] = useState("");

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
        (node: TreeNode, term: string): Set<string> => {
            const foundNodes = new Set<string>();
            if (node.name.toLowerCase().includes(term.toLowerCase())) {
                foundNodes.add(node.id);
            }
            if ("children" in node && node.children) {
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
        (node: TreeNode, id: string): TreeNode | null => {
            if (node.id === id) return node;
            if ("children" in node && node.children) {
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

        const foundNodes = searchNodes(treeData, debouncedSearchTerm);
        setHighlightedNodes(foundNodes);
        if (foundNodes.size > 0) {
            const firstFoundNodeId = Array.from(foundNodes)[0];
            setSelectedNode(firstFoundNodeId);
            const firstFoundNode = findNodeById(treeData, firstFoundNodeId);
            if (firstFoundNode) {
                onNodeSelect(firstFoundNode);
            }
        } else {
            setSelectedNode(null);
        }
    }, [
        debouncedSearchTerm,
        treeData,
        searchNodes,
        findNodeById,
        onNodeSelect,
    ]);

    const clearSearch = useCallback(() => {
        setSearchTerm("");
        setDebouncedSearchTerm("");
        setHighlightedNodes(new Set());
    }, []);

    const handleEditClick = (e: React.MouseEvent, node: TreeNode) => {
        e.stopPropagation();
        setEditingNodeId(node.id);
        setEditedName(node.name);
    };

    const handleEditSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingNodeId && onNodeNameChange && editedName.trim()) {
            onNodeNameChange(editingNodeId, editedName.trim());
            setEditingNodeId(null);
        }
    };

    const handleEditCancel = (e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingNodeId(null);
    };

    const renderNode = (node: TreeNode | (TreeNode & FaultData)) => {
        const hasChildren =
            "children" in node && node.children && node.children.length > 0;
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
                        <CircuitBoardIcon className="h-4 w-4 text-green-600 opacity-90" />
                    );
                case "subsystem":
                    return (
                        <CpuIcon className="h-4 w-4 text-amber-600 opacity-90" />
                    );
                case "component":
                    return (
                        <LayersIcon className="h-4 w-4 text-blue-600 opacity-90" />
                    );
                default:
                    return null;
            }
        };

        return (
            <div key={node.id} className="ml-4 first:ml-0">
                <div
                    className={cn(
                        "flex items-center space-x-2 cursor-pointer p-1.5 rounded-md my-0.5",
                        "transition-colors duration-150 group",
                        isHighlighted && "bg-yellow-100/80",
                        isSelected && "bg-blue-100 ring-1 ring-blue-200",
                        !isHighlighted && !isSelected && "hover:bg-gray-100"
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

                    {editingNodeId === node.id ? (
                        <form
                            onSubmit={handleEditSave}
                            className="flex items-center space-x-2 flex-1"
                        >
                            <Input
                                value={editedName}
                                onChange={(e) => setEditedName(e.target.value)}
                                className="h-7 py-1 px-2 text-sm border-blue-200 focus:ring-blue-200"
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                            />
                            <button
                                type="submit"
                                className="p-1 rounded-full text-green-600 hover:bg-green-50"
                                onClick={(e) => handleEditSave(e)}
                            >
                                ✓
                            </button>
                            <button
                                type="button"
                                className="p-1 rounded-full text-red-600 hover:bg-red-50"
                                onClick={handleEditCancel}
                            >
                                ✕
                            </button>
                        </form>
                    ) : (
                        <div className="flex items-center space-x-2 flex-1">
                            <span className="text-gray-700">{node.name}</span>
                            <Pencil
                                className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-gray-400 hover:text-gray-600"
                                onClick={(e) => handleEditClick(e, node)}
                            />
                        </div>
                    )}
                </div>
                {hasChildren &&
                    isExpanded &&
                    (node as ParentTreeNode).children?.map(renderNode)}
            </div>
        );
    };

    return (
        <div className="space-y-3">
            <div className="relative">
                <Input
                    type="search"
                    placeholder="Search nodes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 bg-white/50 backdrop-blur-sm"
                />
                <SearchIcon className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
            <div className="overflow-auto max-h-[calc(100vh-12rem)] pr-2">
                {renderNode(treeData)}
            </div>
        </div>
    );
};

export { TreeView };
