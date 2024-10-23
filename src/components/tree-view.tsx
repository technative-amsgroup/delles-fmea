"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import debounce from "lodash/debounce";
import {
    ChevronRightIcon,
    ChevronDownIcon,
    Box,
    Boxes,
    Puzzle,
    Pencil,
    SearchIcon,
    Trash2,
    PlusCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { TreeNode, FaultData } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Export TreeNode and FaultData
export type { TreeNode, FaultData };

interface TreeViewProps {
    onNodeSelect: (node: TreeNode) => void;
    treeData: TreeNode;
    onNodeNameChange?: (nodeId: string, newName: string) => void;
    onDeleteNode?: (nodeId: string) => void;
    selectedNodeId?: string; // Add this new prop
    onAddChild?: (
        parentId: string,
        newNode: { name: string; type: "system" | "subsystem" | "component" }
    ) => void; // Add this prop
    expandedNodes: Set<string>;
    onToggleExpand: (nodeId: string) => void;
}

const TreeView: React.FC<TreeViewProps> = ({
    onNodeSelect,
    treeData,
    onNodeNameChange,
    onDeleteNode,
    selectedNodeId,
    onAddChild,
    expandedNodes = new Set<string>(),
    onToggleExpand,
}) => {
    const [highlightedNodes, setHighlightedNodes] = useState<Set<string>>(
        new Set()
    );
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
    const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
    const [editedName, setEditedName] = useState("");
    const [deletingNode, setDeletingNode] = useState<{
        id: string;
        name: string;
        type: string;
    } | null>(null);

    // Clear search - define this first
    const clearSearch = useCallback(() => {
        setSearchTerm("");
        setDebouncedSearchTerm("");
        setHighlightedNodes(new Set());
    }, []);

    // Then use it in handleNodeClick
    const handleNodeClick = useCallback(
        (node: TreeNode, hasChildren: boolean) => {
            // Toggle expansion if the node has children
            if (hasChildren) {
                onToggleExpand(node.id);
            }

            // Update highlight
            setHighlightedNodes(new Set([node.id]));

            // Notify parent of selection
            onNodeSelect(node);

            // Clear search when a node is selected
            clearSearch();
        },
        [onToggleExpand, onNodeSelect, clearSearch]
    );

    // Debounced search
    const debouncedSearch = useMemo(
        () =>
            debounce((term: string) => {
                setDebouncedSearchTerm(term);
            }, 300),
        []
    );

    useEffect(() => {
        debouncedSearch(searchTerm);
        return () => {
            debouncedSearch.cancel();
        };
    }, [searchTerm, debouncedSearch]);

    // Collect nodes to expand during search
    const searchNodes = useCallback(
        (
            node: TreeNode,
            term: string
        ): { foundNodes: Set<string>; nodesToExpand: Set<string> } => {
            const result = {
                foundNodes: new Set<string>(),
                nodesToExpand: new Set<string>(),
            };

            if (node.name.toLowerCase().includes(term.toLowerCase())) {
                result.foundNodes.add(node.id);
            }

            if ("children" in node && node.children) {
                for (const child of node.children) {
                    const childResult = searchNodes(child, term);
                    if (childResult.foundNodes.size > 0) {
                        result.nodesToExpand.add(node.id);
                        childResult.foundNodes.forEach((id) =>
                            result.foundNodes.add(id)
                        );
                        childResult.nodesToExpand.forEach((id) =>
                            result.nodesToExpand.add(id)
                        );
                    }
                }
            }

            return result;
        },
        []
    );

    // Handle search results
    useEffect(() => {
        if (debouncedSearchTerm.trim() === "") {
            setHighlightedNodes(new Set());
            return;
        }

        const { foundNodes, nodesToExpand } = searchNodes(
            treeData,
            debouncedSearchTerm
        );

        // First, update highlighted nodes
        setHighlightedNodes(foundNodes);

        // Then, expand necessary nodes
        nodesToExpand.forEach((nodeId) => {
            if (!expandedNodes.has(nodeId)) {
                onToggleExpand(nodeId);
            }
        });

        // Finally, select the first found node
        if (foundNodes.size > 0) {
            const firstFoundNodeId = Array.from(foundNodes)[0];
            const findNode = (node: TreeNode): TreeNode | null => {
                if (node.id === firstFoundNodeId) return node;
                if ("children" in node && node.children) {
                    for (const child of node.children) {
                        const found = findNode(child);
                        if (found) return found;
                    }
                }
                return null;
            };

            const firstNode = findNode(treeData);
            if (firstNode) {
                onNodeSelect(firstNode);
            }
        }
    }, [
        debouncedSearchTerm,
        treeData,
        searchNodes,
        onToggleExpand,
        onNodeSelect,
        expandedNodes,
    ]);

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

    const handleDeleteClick = (e: React.MouseEvent, node: TreeNode) => {
        e.stopPropagation();
        setDeletingNode({
            id: node.id,
            name: node.name,
            type: node.type,
        });
    };

    const handleDeleteConfirm = () => {
        if (deletingNode && onDeleteNode) {
            onDeleteNode(deletingNode.id);
            setDeletingNode(null);
        }
    };

    const renderNode = (node: TreeNode | (TreeNode & FaultData)) => {
        // Add this check to determine if node can have children
        const canHaveChildren =
            node.type === "system" || node.type === "subsystem";
        const hasChildren = !!(
            "children" in node &&
            node.children &&
            node.children.length > 0
        );
        const isExpanded = expandedNodes.has(node.id);
        const isHighlighted = highlightedNodes.has(node.id);
        const isSelected = node.id === selectedNodeId;

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
                        <Box className="h-4 w-4 text-green-600 opacity-90" />
                    );
                case "subsystem":
                    return (
                        <Boxes className="h-4 w-4 text-amber-600 opacity-90" />
                    );
                case "component":
                    return (
                        <Puzzle className="h-4 w-4 text-blue-600 opacity-90" />
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
                        (isHighlighted || isSelected) &&
                            "bg-blue-100 ring-1 ring-blue-200",
                        !isHighlighted && !isSelected && "hover:bg-gray-100"
                    )}
                    onClick={(e) => {
                        e.stopPropagation();
                        handleNodeClick(node, hasChildren);
                    }}
                >
                    {/* Update this section to only show arrows for nodes that can have children */}
                    {canHaveChildren ? (
                        <span
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleExpand(node.id);
                            }}
                        >
                            {isExpanded ? (
                                <ChevronDownIcon className="h-4 w-4" />
                            ) : (
                                <ChevronRightIcon className="h-4 w-4" />
                            )}
                        </span>
                    ) : (
                        <span className="w-4" />
                    )}
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
                            <div className="flex items-center space-x-1">
                                {/* Replace the existing add button with this dropdown */}
                                {onAddChild && node.type !== "component" && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className={cn(
                                                    "p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors duration-200",
                                                    isHighlighted || isSelected
                                                        ? "opacity-100"
                                                        : "opacity-0 group-hover:opacity-100"
                                                )}
                                            >
                                                <PlusCircle className="h-3.5 w-3.5" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent
                                            align="start"
                                            className="w-40"
                                        >
                                            {node.type === "system" && (
                                                <>
                                                    <DropdownMenuItem
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onAddChild(
                                                                node.id,
                                                                {
                                                                    name: "New subsystem",
                                                                    type: "subsystem",
                                                                }
                                                            );
                                                        }}
                                                    >
                                                        Add new subsystem
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onAddChild(
                                                                node.id,
                                                                {
                                                                    name: "New component",
                                                                    type: "component",
                                                                }
                                                            );
                                                        }}
                                                    >
                                                        Add new component
                                                    </DropdownMenuItem>
                                                </>
                                            )}
                                            {node.type === "subsystem" && (
                                                <>
                                                    <DropdownMenuItem
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onAddChild(
                                                                node.id,
                                                                {
                                                                    name: "New subsystem",
                                                                    type: "subsystem",
                                                                }
                                                            );
                                                        }}
                                                    >
                                                        Add new subsystem
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onAddChild(
                                                                node.id,
                                                                {
                                                                    name: "New component",
                                                                    type: "component",
                                                                }
                                                            );
                                                        }}
                                                    >
                                                        Add new component
                                                    </DropdownMenuItem>
                                                </>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                                {/* Existing delete and edit buttons */}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => handleDeleteClick(e, node)}
                                    className={cn(
                                        "p-1 text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors duration-200",
                                        isHighlighted || isSelected
                                            ? "opacity-100"
                                            : "opacity-0 group-hover:opacity-100"
                                    )}
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                                <Pencil
                                    className={cn(
                                        "h-3.5 w-3.5 text-gray-400 hover:text-gray-600",
                                        isHighlighted || isSelected
                                            ? "opacity-100"
                                            : "opacity-0 group-hover:opacity-100"
                                    )}
                                    onClick={(e) => handleEditClick(e, node)}
                                />
                            </div>
                        </div>
                    )}
                </div>
                {hasChildren && isExpanded && node.children?.map(renderNode)}
            </div>
        );
    };

    return (
        <>
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

            {/* Add Delete Confirmation Dialog */}
            <Dialog
                open={deletingNode !== null}
                onOpenChange={() => setDeletingNode(null)}
            >
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Delete {deletingNode?.type}</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete the{" "}
                            {deletingNode?.type.toLowerCase()} &ldquo;
                            <strong>{deletingNode?.name}</strong>&rdquo;? This
                            action cannot be undone and will delete{" "}
                            <strong>
                                all associated components, functions, and
                                faults.
                            </strong>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => setDeletingNode(null)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteConfirm}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

export { TreeView };
