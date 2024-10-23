"use client";

import React, { useState, useEffect, useCallback } from "react";
import { TreeView } from "@/components/tree-view";
import { TreeNode, ParentTreeNode, FMEAData, FaultTreeNode } from "@/lib/types";
import { FMEAWorksheet } from "@/components/fmea-worksheet";
// import { AnalysisPage } from "@/components/analysis-page"; // Commented out
import { initialTree } from "@/lib/initial-tree-data";
import { convertXMLToJSON } from "@/lib/xml-to-json-converter";

export function FmeaPage() {
    const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
    const [fmeaData, setFMEAData] = useState<FMEAData>({});
    const [treeData, setTreeData] = useState(initialTree);
    const [activeTab, setActiveTab] = useState<"worksheet" | "analysis">(
        "worksheet"
    );

    // Move the traverseTree function outside of generateFMEAData
    const traverseTree = useCallback(
        (currentNode: TreeNode, parentPath: string[] = []): FMEAData => {
            const newFMEAData: FMEAData = {};
            const currentPath = [...parentPath, currentNode.name];

            if (currentNode.type === "fault") {
                const faultNode = currentNode as FaultTreeNode;
                const componentId =
                    parentPath[parentPath.length - 2] || "unknown";
                const functionId =
                    parentPath[parentPath.length - 1] || "unknown";

                if (!newFMEAData[componentId]) {
                    newFMEAData[componentId] = { functions: {} };
                }
                if (!newFMEAData[componentId].functions[functionId]) {
                    newFMEAData[componentId].functions[functionId] = {
                        id: functionId,
                        faults: {},
                    };
                }

                newFMEAData[componentId].functions[functionId].faults[
                    currentNode.id
                ] = {
                    id: currentNode.id,
                    failureMode: currentNode.name,
                    effect: faultNode.effect || "",
                    severity: faultNode.severity || 1,
                    cause: faultNode.cause || "",
                    occurrence: faultNode.occurrence || 1,
                    controls: faultNode.controls || "",
                    detection: faultNode.detection || 1,
                };
            }

            if ("children" in currentNode && currentNode.children) {
                currentNode.children.forEach((child) => {
                    const childData = traverseTree(child, currentPath);
                    // Merge child data with current data
                    Object.keys(childData).forEach((componentId) => {
                        if (!newFMEAData[componentId]) {
                            newFMEAData[componentId] = { functions: {} };
                        }
                        Object.assign(
                            newFMEAData[componentId].functions,
                            childData[componentId].functions
                        );
                    });
                });
            }

            return newFMEAData;
        },
        []
    );

    // Use useEffect with proper dependencies
    useEffect(() => {
        if (Object.keys(fmeaData).length === 0) {
            const newData = traverseTree(treeData);
            setFMEAData(newData);
        }
    }, [fmeaData, treeData, traverseTree]);

    const handleNodeSelect = (node: TreeNode) => {
        setSelectedNode(node);
    };

    const handleDataChange = (newData: FMEAData) => {
        setFMEAData(newData);
    };

    const getNodePath = (node: TreeNode | null): string => {
        if (!node) return "FMEA Worksheet";

        const path: string[] = [];

        const findNodePath = (
            currentNode: TreeNode,
            targetId: string
        ): boolean => {
            if (currentNode.id === targetId) {
                path.unshift(currentNode.name);
                return true;
            }

            if ("children" in currentNode && currentNode.children) {
                for (const child of currentNode.children) {
                    if (findNodePath(child, targetId)) {
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
                    console.log("Extracted JSON data:", jsonData);
                    setTreeData(jsonData);
                    setSelectedNode(null);
                } catch (error) {
                    console.error("Error converting XML to JSON:", error);
                }
            };
            reader.readAsText(file);
        }
    };

    const updateNodeName = (nodeId: string, newName: string) => {
        const updateTreeNode = (node: TreeNode): TreeNode => {
            if (node.id === nodeId) {
                return { ...node, name: newName };
            }

            if ("children" in node && node.children) {
                return {
                    ...node,
                    children: node.children.map(updateTreeNode),
                };
            }

            return node;
        };

        // Update the tree data
        setTreeData((prevTreeData) => updateTreeNode(prevTreeData));

        // Don't regenerate FMEA data here
        // Remove or comment out the generateFMEAData call if it exists
    };

    const handleNodeNameChange = (nodeId: string, newName: string) => {
        const updateTreeNode = (node: TreeNode): TreeNode => {
            if (node.id === nodeId) {
                return { ...node, name: newName };
            }

            if ("children" in node && node.children) {
                return {
                    ...node,
                    children: node.children.map(updateTreeNode),
                };
            }

            return node;
        };

        setTreeData((prevTreeData) => updateTreeNode(prevTreeData));
    };

    const handleAddFault = (
        componentId: string,
        functionId: string,
        newFault: { name: string; effect: string }
    ) => {
        const faultId = `fault_${Date.now()}`;

        // First, find and update the function node in the tree
        const findAndUpdateFunction = (node: TreeNode): TreeNode => {
            if (node.type === "function" && node.id === functionId) {
                const newFaultNode: FaultTreeNode = {
                    id: faultId,
                    name: newFault.name,
                    type: "fault",
                    effect: newFault.effect,
                };

                const updatedNode: ParentTreeNode = {
                    ...node,
                    children: [...(node.children || []), newFaultNode],
                };

                return updatedNode;
            }

            if ("children" in node) {
                return {
                    ...node,
                    children: node.children?.map(findAndUpdateFunction),
                } as ParentTreeNode;
            }

            return node;
        };

        // Update both tree and FMEA data
        const updatedTree = findAndUpdateFunction(treeData);
        setTreeData(updatedTree);

        // Update FMEA data
        setFMEAData((prevData) => {
            const updatedData = { ...prevData };
            if (!updatedData[componentId]) {
                updatedData[componentId] = { functions: {} };
            }
            if (!updatedData[componentId].functions[functionId]) {
                updatedData[componentId].functions[functionId] = {
                    id: functionId,
                    faults: {},
                };
            }

            updatedData[componentId].functions[functionId].faults[faultId] = {
                id: faultId,
                failureMode: newFault.name,
                effect: newFault.effect,
                severity: 1,
                occurrence: 1,
                detection: 1,
                cause: "",
                controls: "",
            };

            return updatedData;
        });

        // If we have a selected node, update it to trigger a re-render
        if (selectedNode) {
            const updatedSelectedNode = findNodeById(
                updatedTree,
                selectedNode.id
            );
            if (updatedSelectedNode) {
                setSelectedNode(updatedSelectedNode);
            }
        }
    };

    // Add this helper function if not already present
    const findNodeById = (tree: TreeNode, nodeId: string): TreeNode | null => {
        if (tree.id === nodeId) {
            return tree;
        }

        if ("children" in tree && tree.children) {
            for (const child of tree.children) {
                const found = findNodeById(child, nodeId);
                if (found) {
                    return found;
                }
            }
        }

        return null;
    };

    return (
        <div className="flex flex-col h-screen">
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-500 to-blue-700 text-white">
                <h1 className="text-2xl font-bold">FMEA Analysis</h1>
                <div className="flex items-center space-x-4">
                    <button
                        className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
                            activeTab === "worksheet"
                                ? "bg-white text-blue-700"
                                : "bg-blue-600 hover:bg-blue-500"
                        }`}
                        onClick={() => setActiveTab("worksheet")}
                    >
                        Worksheet
                    </button>
                    {/* <button
                        className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
                            activeTab === "analysis"
                                ? "bg-white text-blue-700"
                                : "bg-blue-600 hover:bg-blue-500"
                        }`}
                        onClick={() => setActiveTab("analysis")}
                    >
                        Analysis
                    </button> */}
                    <input
                        type="file"
                        accept=".xml"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="xml-file-input"
                    />
                    <label
                        htmlFor="xml-file-input"
                        className="bg-white text-blue-700 hover:bg-blue-100 font-semibold py-2 px-4 rounded-lg cursor-pointer transition-colors duration-200"
                    >
                        Load XML File
                    </label>
                </div>
            </div>
            <div className="flex flex-1 overflow-hidden">
                {activeTab === "worksheet" ? (
                    <>
                        <div className="w-1/4 p-4 bg-gray-100 overflow-auto">
                            <TreeView
                                onNodeSelect={handleNodeSelect}
                                treeData={treeData}
                                onNodeNameChange={handleNodeNameChange}
                            />
                        </div>
                        <div className="w-3/4 p-4 overflow-auto">
                            <FMEAWorksheet
                                selectedNode={selectedNode}
                                data={fmeaData}
                                onDataChange={handleDataChange}
                                getNodePath={getNodePath}
                                onFunctionNameChange={updateNodeName}
                                onAddFault={handleAddFault}
                            />
                        </div>
                    </>
                ) : (
                    // <div className="w-full p-4 overflow-auto">
                    //     <AnalysisPage data={fmeaData} />
                    // </div> // Commented out
                    <div className="w-full p-4 overflow-auto">
                        {/* Analysis page content will be added in future updates */}
                    </div>
                )}
            </div>
        </div>
    );
}
