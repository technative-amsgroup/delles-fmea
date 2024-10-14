"use client";

import React, { useState } from "react";
import { TreeView } from "@/components/tree-view";
import { TreeNode } from "@/lib/types"; // Import TreeNode from types
import { FMEAWorksheet } from "@/components/fmea-worksheet";

import { HeaderToolbar } from "@/components/header-toolbar";
import { FMEARow } from "@/lib/types"; // Import FMEARow from types
import { initialTree } from "@/lib/initial-tree-data"; // Add this import

export function FmeaPage() {
    const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
    const [fmeaData, setFMEAData] = useState<Record<string, FMEARow>>({});

    const handleNodeSelect = (node: TreeNode) => {
        setSelectedNode(node);
    };

    const handleDataChange = (newData: Record<string, FMEARow>) => {
        setFMEAData(newData);
    };

    // Updated function to get the full path of a node
    const getNodePath = (node: TreeNode | null): string => {
        if (!node) return "";

        const findPath = (
            currentNode: TreeNode,
            targetId: string
        ): string[] | null => {
            if (currentNode.id === targetId) {
                return [currentNode.name];
            }

            if (currentNode.children) {
                for (const child of currentNode.children) {
                    const path = findPath(child, targetId);
                    if (path) {
                        return [currentNode.name, ...path];
                    }
                }
            }

            return null;
        };

        const path = findPath(initialTree, node.id);
        return path ? path.join(" > ") : node.name;
    };

    return (
        <div className="flex flex-col h-screen">
            <HeaderToolbar />
            <div className="flex flex-1 overflow-hidden">
                <div className="w-1/4 p-4 bg-gray-100 overflow-auto">
                    <TreeView onNodeSelect={handleNodeSelect} />
                </div>
                <div className="w-3/4 p-4 overflow-auto">
                    <FMEAWorksheet
                        selectedNode={selectedNode}
                        data={fmeaData}
                        onDataChange={handleDataChange}
                        getNodePath={getNodePath} // Pass the new function as a prop
                    />
                </div>
            </div>
        </div>
    );
}
