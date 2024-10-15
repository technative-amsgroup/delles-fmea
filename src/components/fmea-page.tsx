"use client";

import React, { useState } from "react";
import { TreeView } from "@/components/tree-view";
import { TreeNode, ParentTreeNode } from "@/lib/types"; // Import TreeNode and ParentNode from types
import { FMEAWorksheet } from "@/components/fmea-worksheet";

import { HeaderToolbar } from "@/components/header-toolbar";
import { FMEARow } from "@/lib/types"; // Import FMEARow from types
import { initialTree } from "@/lib/initial-tree-data"; // Add this import
import { convertXMLToJSON } from "@/lib/xml-to-json-converter"; // Add this import

export function FmeaPage() {
    const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
    const [fmeaData, setFMEAData] = useState<Record<string, FMEARow>>({});
    const [treeData, setTreeData] = useState(initialTree);

    const handleNodeSelect = (node: TreeNode) => {
        setSelectedNode(node);
    };

    const handleDataChange = (newData: Record<string, FMEARow>) => {
        setFMEAData(newData);
    };

    // Updated function to get the full path of a node
    const getNodePath = (node: TreeNode | null): string => {
        if (!node) return "FMEA Worksheet";

        const path: string[] = [];

        const findNodePath = (
            currentNode: ParentTreeNode,
            targetId: string
        ): boolean => {
            if (currentNode.id === targetId) {
                path.unshift(currentNode.name);
                return true;
            }

            if (currentNode.children) {
                for (const child of currentNode.children) {
                    if ("children" in child) {
                        if (findNodePath(child, targetId)) {
                            path.unshift(currentNode.name);
                            return true;
                        }
                    } else if (child.id === targetId) {
                        path.unshift(child.name);
                        path.unshift(currentNode.name);
                        return true;
                    }
                }
            }

            return false;
        };

        findNodePath(treeData as ParentTreeNode, node.id);
        return path.join(" > ");
    };

    const handleFileUpload = async (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const xmlContent = e.target?.result as string;
                try {
                    const jsonData = await convertXMLToJSON(xmlContent);
                    console.log("Extracted JSON data:", jsonData); // Add this line
                    setTreeData(jsonData);
                    setSelectedNode(null);
                    setFMEAData({});
                } catch (error) {
                    console.error("Error converting XML to JSON:", error);
                    // You might want to show an error message to the user here
                }
            };
            reader.readAsText(file);
        }
    };

    return (
        <div className="flex flex-col h-screen">
            <HeaderToolbar />
            <div className="flex items-center justify-between p-4 bg-gray-200">
                <h1 className="text-2xl font-bold">FMEA Analysis</h1>
                <div>
                    <input
                        type="file"
                        accept=".xml"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="xml-file-input"
                    />
                    <label
                        htmlFor="xml-file-input"
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded cursor-pointer"
                    >
                        Load XML File
                    </label>
                </div>
            </div>
            <div className="flex flex-1 overflow-hidden">
                <div className="w-1/4 p-4 bg-gray-100 overflow-auto">
                    <TreeView
                        onNodeSelect={handleNodeSelect}
                        treeData={treeData}
                    />
                </div>
                <div className="w-3/4 p-4 overflow-auto">
                    <FMEAWorksheet
                        selectedNode={selectedNode}
                        data={fmeaData}
                        onDataChange={handleDataChange}
                        getNodePath={getNodePath}
                    />
                </div>
            </div>
        </div>
    );
}
