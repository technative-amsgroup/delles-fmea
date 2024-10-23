"use client";

import React, { useState, useEffect } from "react";
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

    useEffect(() => {
        generateFMEAData(treeData);
    }, [treeData]);

    const generateFMEAData = (node: TreeNode) => {
        const newFMEAData: FMEAData = {};

        const traverseTree = (
            currentNode: TreeNode,
            parentPath: string[] = []
        ) => {
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
                currentNode.children.forEach((child) =>
                    traverseTree(child, currentPath)
                );
            }
        };

        traverseTree(node);
        setFMEAData(newFMEAData);
    };

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
