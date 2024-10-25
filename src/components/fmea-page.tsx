"use client";

import React, { useState, useEffect, useCallback } from "react";
import { TreeView } from "@/components/tree-view";
import {
    TreeNode,
    ParentTreeNode,
    FMEAData,
    FaultTreeNode,
    FaultData,
} from "@/lib/types";
import { FMEAWorksheet } from "@/components/fmea-worksheet";
// import { AnalysisPage } from "@/components/analysis-page"; // Commented out
import { initialTree } from "@/lib/initial-tree-data";
import { convertXMLToJSON } from "@/lib/xml-to-json-converter";
import { saveToXML } from "@/lib/save-to-xml";
import { saveAs } from "file-saver"; // You'll need to install this package: npm install file-saver @types/file-saver
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Download, Upload, ChevronDown } from "lucide-react";
import { useNodeTypes } from "@/hooks/useNodeTypes";
import { TreeDiagram } from "@/components/tree-diagram";

// Add this interface near the top of the file
interface FMEAFileData {
    version: string;
    lastModified: string;
    treeData: TreeNode;
    fmeaData: FMEAData;
    metadata?: {
        projectName?: string;
        author?: string;
        description?: string;
    };
}

// Add these functions inside FmeaPage component, after the state declarations
export function FmeaPage() {
    const { updateNodeTypes } = useNodeTypes();

    const [fmeaData, setFMEAData] = useState<FMEAData>({});
    const [treeData, setTreeData] = useState(initialTree);
    const [activeTab, setActiveTab] = useState<
        "worksheet" | "diagram" | "analysis"
    >("worksheet");
    const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(
        () => new Set()
    );

    // Use useEffect to update the tree data after the component mounts
    useEffect(() => {
        setTreeData(updateNodeTypes(initialTree));
    }, [updateNodeTypes]);

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
                    controls: faultNode.controls || {
                        preventive: "",
                        detection: "",
                    },
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
                controls: { preventive: "", detection: "" },
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

    const handleAddFunction = (
        componentId: string,
        newFunction: { name: string }
    ) => {
        const functionId = `function_${Date.now()}`;

        // Update tree data
        const updateTreeData = (node: TreeNode): TreeNode => {
            if (node.id === componentId) {
                const newFunctionNode: ParentTreeNode = {
                    id: functionId,
                    name: newFunction.name,
                    type: "function",
                    children: [],
                };

                return {
                    ...node,
                    children: [...(node.children || []), newFunctionNode],
                } as ParentTreeNode;
            }

            if ("children" in node) {
                return {
                    ...node,
                    children: node.children?.map(updateTreeData),
                } as ParentTreeNode;
            }

            return node;
        };

        // Update both tree and FMEA data
        const updatedTree = updateTreeData(treeData);
        setTreeData(updatedTree);

        // Update FMEA data
        setFMEAData((prevData) => {
            const updatedData = { ...prevData };
            if (!updatedData[componentId]) {
                updatedData[componentId] = { functions: {} };
            }

            updatedData[componentId].functions[functionId] = {
                id: functionId,
                faults: {},
            };

            return updatedData;
        });

        // Add this section to update the selected node
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

    const handleDeleteFault = (
        componentId: string,
        functionId: string,
        faultId: string
    ) => {
        // Update tree data
        const updateTreeData = (node: TreeNode): TreeNode => {
            if (node.id === functionId) {
                return {
                    ...node,
                    children: (node as ParentTreeNode).children?.filter(
                        (child) => child.id !== faultId
                    ),
                } as ParentTreeNode;
            }

            if ("children" in node) {
                return {
                    ...node,
                    children: node.children?.map(updateTreeData),
                } as ParentTreeNode;
            }

            return node;
        };

        // Update both tree and FMEA data
        const updatedTree = updateTreeData(treeData);
        setTreeData(updatedTree);

        // Update FMEA data
        setFMEAData((prevData) => {
            const updatedData = { ...prevData };
            if (updatedData[componentId]?.functions[functionId]?.faults) {
                delete updatedData[componentId].functions[functionId].faults[
                    faultId
                ];
            }
            return updatedData;
        });

        // Update selected node if necessary
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

    // Add the handleDeleteFunction function
    const handleDeleteFunction = (componentId: string, functionId: string) => {
        // Update tree data
        const updateTreeData = (node: TreeNode): TreeNode => {
            if (node.id === componentId) {
                return {
                    ...node,
                    children: (node as ParentTreeNode).children?.filter(
                        (child) => child.id !== functionId
                    ),
                } as ParentTreeNode;
            }

            if ("children" in node) {
                return {
                    ...node,
                    children: node.children?.map(updateTreeData),
                } as ParentTreeNode;
            }

            return node;
        };

        // Update both tree and FMEA data
        const updatedTree = updateTreeData(treeData);
        setTreeData(updatedTree);

        // Update FMEA data by removing the function and all its faults
        setFMEAData((prevData) => {
            const updatedData = { ...prevData };
            if (updatedData[componentId]?.functions[functionId]) {
                delete updatedData[componentId].functions[functionId];
            }
            return updatedData;
        });

        // Update selected node if necessary
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

    // Add this new function in FmeaPage component
    const handleDeleteNode = (nodeId: string) => {
        const updateTreeData = (node: TreeNode): TreeNode | null => {
            if (node.id === nodeId) {
                return null;
            }

            if ("children" in node && node.children) {
                const updatedChildren = node.children
                    .map(updateTreeData)
                    .filter((child): child is TreeNode => child !== null);

                return {
                    ...node,
                    children: updatedChildren,
                } as ParentTreeNode;
            }

            return node;
        };

        const updatedTree = updateTreeData(treeData);
        if (updatedTree) {
            const fullyUpdatedTree = updateNodeTypes(updatedTree);
            setTreeData(fullyUpdatedTree);

            // Update FMEA data by removing all associated functions and faults
            setFMEAData((prevData) => {
                const updatedData = { ...prevData };
                const removeAssociatedData = (node: TreeNode) => {
                    delete updatedData[node.id];
                    if ("children" in node && node.children) {
                        node.children.forEach(removeAssociatedData);
                    }
                };
                removeAssociatedData(updatedTree);
                return updatedData;
            });

            // Clear selection if the deleted node was selected
            if (selectedNode?.id === nodeId) {
                setSelectedNode(null);
            }
        }
    };

    // Add this new function to find a node by its path
    const findNodeByPath = useCallback(
        (path: string): TreeNode | null => {
            const segments = path.split(" > ");

            let currentNode: TreeNode = treeData;

            // Skip the first segment if it's the root node name
            const startIndex = segments[0] === treeData.name ? 1 : 0;

            for (let i = startIndex; i < segments.length; i++) {
                const segment = segments[i];
                if (!("children" in currentNode)) {
                    return null;
                }

                const found = currentNode.children?.find(
                    (child) => child.name === segment
                );

                if (!found) {
                    return null;
                }

                currentNode = found;
            }

            return currentNode;
        },
        [treeData]
    );

    // Update the TreeView component to highlight the selected node
    const handleBreadcrumbNodeSelect = (node: TreeNode | null) => {
        if (node) {
            setSelectedNode(node);
            // You might want to expand the parent nodes here as well
            // This would require tracking expanded nodes in the TreeView component
        } else {
            setSelectedNode(null);
        }
    };

    const handleAddChild = (parentId: string, newNodeName: string) => {
        const updateTreeData = (node: TreeNode): TreeNode => {
            if (node.id === parentId) {
                const newChild = {
                    id: `node_${Date.now()}`,
                    name: newNodeName,
                    type: "component",
                    children: [],
                } as ParentTreeNode;

                const updatedNode = {
                    ...node,
                    type: node.type === "component" ? "subsystem" : node.type,
                    children: [...(node.children || []), newChild],
                } as ParentTreeNode;

                return updatedNode;
            }

            if ("children" in node) {
                return {
                    ...node,
                    children: node.children?.map(updateTreeData),
                } as ParentTreeNode;
            }

            return node;
        };

        const updatedTree = updateTreeData(treeData);
        const fullyUpdatedTree = updateNodeTypes(updatedTree);
        setTreeData(fullyUpdatedTree);

        // Expand the parent node to show the new child
        setExpandedNodes((prev) => new Set([...prev, parentId]));
    };

    const handleSaveXML = () => {
        const xmlContent = saveToXML(treeData, fmeaData);
        const blob = new Blob([xmlContent], { type: "text/xml" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "fmea.xml";
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleSaveFMEA = () => {
        const fileData: FMEAFileData = {
            version: "1.0.0",
            lastModified: new Date().toISOString(),
            treeData: treeData, // Use the state variable directly
            fmeaData: fmeaData, // Use the state variable directly
            metadata: {
                projectName: "My FMEA Project",
                author: "System User",
                description: "FMEA Analysis Data",
            },
        };

        const jsonString = JSON.stringify(fileData, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });

        if (window.showSaveFilePicker) {
            window
                .showSaveFilePicker({
                    suggestedName: "analysis.fmea",
                    types: [
                        {
                            description: "FMEA File",
                            accept: { "application/json": [".fmea"] },
                        },
                    ],
                })
                .then(async (fileHandle: FileSystemFileHandle) => {
                    const writable = await fileHandle.createWritable();
                    await writable.write(blob);
                    await writable.close();
                })
                .catch((error: Error) => {
                    console.error("Error saving file:", error);
                    // Fallback to saveAs if the file system API is not supported or fails
                    saveAs(blob, "analysis.fmea");
                });
        } else {
            // Fallback for browsers that don't support the file system API
            saveAs(blob, "analysis.fmea");
        }
    };

    const handleLoadFMEA = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.name.toLowerCase().endsWith(".fmea")) {
            alert("Please select a valid .fmea file");
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const parsedData: FMEAFileData = JSON.parse(content);

                if (
                    !parsedData.version ||
                    !parsedData.treeData ||
                    !parsedData.fmeaData
                ) {
                    throw new Error("Invalid file format");
                }

                setTreeData(updateNodeTypes(parsedData.treeData));
                setFMEAData(parsedData.fmeaData);
                setSelectedNode(null);

                console.log("Project loaded:", parsedData.metadata);
            } catch (error) {
                console.error("Error loading file:", error);
                alert(
                    "Error loading file. Please ensure it is a valid .fmea file."
                );
            }
        };
        reader.readAsText(file);
    };

    const handleLoadXML = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.name.toLowerCase().endsWith(".xml")) {
            alert("Please select a valid .xml file");
            return;
        }

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const content = e.target?.result as string;
                const result = await convertXMLToJSON(content);

                setTreeData(updateNodeTypes(result.treeData as ParentTreeNode));
                setFMEAData(result.fmeaData);
                setSelectedNode(null);

                console.log("XML file loaded successfully");
            } catch (error) {
                console.error("Error loading XML file:", error);
                alert(
                    "Error loading XML file. Please ensure it is a valid FMEA XML file."
                );
            }
        };
        reader.readAsText(file);
    };

    const handleExportComponent = (nodeId: string) => {
        const findNodeById = (node: TreeNode): TreeNode | null => {
            if (node.id === nodeId) return node;
            if ("children" in node && node.children) {
                for (const child of node.children) {
                    const found = findNodeById(child);
                    if (found) return found;
                }
            }
            return null;
        };

        const nodeToExport = findNodeById(treeData);
        if (!nodeToExport) {
            console.error("Node not found");
            return;
        }

        const extractFMEAData = (node: TreeNode): FMEAData => {
            const result: FMEAData = {};
            const extractData = (
                currentNode: TreeNode,
                parentPath: string[] = []
            ) => {
                const currentPath = [...parentPath, currentNode.name];
                if (currentNode.type === "component") {
                    const componentId = currentNode.id;
                    result[componentId] = fmeaData[componentId] || {
                        functions: {},
                    };
                }
                if ("children" in currentNode && currentNode.children) {
                    currentNode.children.forEach((child) =>
                        extractData(child, currentPath)
                    );
                }
            };
            extractData(node);
            return result;
        };

        const componentData = {
            treeData: nodeToExport,
            fmeaData: extractFMEAData(nodeToExport),
        };

        const jsonString = JSON.stringify(componentData, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });

        const defaultFileName = `${nodeToExport.name.replace(
            /\s+/g,
            "_"
        )}.comp`;

        if (window.showSaveFilePicker) {
            window
                .showSaveFilePicker({
                    suggestedName: defaultFileName,
                    types: [
                        {
                            description: "Component File",
                            accept: { "application/json": [".comp"] },
                        },
                    ],
                })
                .then(async (fileHandle: FileSystemFileHandle) => {
                    const writable = await fileHandle.createWritable();
                    await writable.write(blob);
                    await writable.close();
                })
                .catch((error: Error) => {
                    console.error("Error saving file:", error);
                    // Fallback to saveAs if the file system API is not supported or fails
                    saveAs(blob, defaultFileName);
                });
        } else {
            // Fallback for browsers that don't support the file system API
            saveAs(blob, defaultFileName);
        }
    };

    const handleImportComponent = (parentId: string) => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".comp";
        input.onchange = (event) => {
            const file = (event.target as HTMLInputElement).files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const content = e.target?.result as string;
                        const importedData = JSON.parse(content);

                        // Generate new IDs for the imported component and its children
                        const generateNewIds = (node: TreeNode): TreeNode => {
                            const newNode = {
                                ...node,
                                id: `imported_${Date.now()}_${Math.random()
                                    .toString(36)
                                    .slice(2, 11)}`,
                            };
                            if ("children" in newNode && newNode.children) {
                                newNode.children =
                                    newNode.children.map(generateNewIds);
                            }
                            return newNode;
                        };

                        const updatedImportedNode = generateNewIds(
                            importedData.treeData
                        );
                        const updatedImportedNodeWithTypes =
                            updateNodeTypes(updatedImportedNode);

                        // Find the parent node and update it
                        const updateTreeData = (node: TreeNode): TreeNode => {
                            if (node.id === parentId) {
                                const updatedNode = {
                                    ...node,
                                    children: [
                                        ...(node.children || []),
                                        updatedImportedNodeWithTypes,
                                    ],
                                } as ParentTreeNode;
                                // Force the parent to be a subsystem if it's currently a component
                                if (updatedNode.type === "component") {
                                    updatedNode.type = "subsystem";
                                }
                                return updatedNode;
                            }
                            if ("children" in node) {
                                return {
                                    ...node,
                                    children:
                                        node.children?.map(updateTreeData),
                                } as ParentTreeNode;
                            }
                            return node;
                        };

                        // Update tree data
                        const updatedTree = updateTreeData(treeData);
                        const fullyUpdatedTree = updateNodeTypes(updatedTree);
                        setTreeData(fullyUpdatedTree);

                        // Expand the parent node to show the new child
                        setExpandedNodes(
                            (prev) => new Set([...prev, parentId])
                        );

                        // Update FMEA data
                        setFMEAData((prevData) => {
                            const newFMEAData = { ...prevData };
                            const updateFMEAIds = (
                                oldId: string,
                                newId: string
                            ) => {
                                if (importedData.fmeaData[oldId]) {
                                    newFMEAData[newId] = {
                                        ...importedData.fmeaData[oldId],
                                    };
                                    delete newFMEAData[oldId];
                                }
                            };

                            const traverseAndUpdateIds = (node: TreeNode) => {
                                // Use type assertion to access the newId property
                                const newId =
                                    (node as TreeNode & { newId?: string })
                                        .newId || node.id;
                                updateFMEAIds(node.id, newId);
                                if ("children" in node && node.children) {
                                    node.children.forEach(traverseAndUpdateIds);
                                }
                            };

                            traverseAndUpdateIds(updatedImportedNodeWithTypes);
                            return newFMEAData;
                        });

                        console.log("Component imported successfully");
                    } catch (error) {
                        console.error("Error importing component:", error);
                        alert(
                            "Error importing component. Please ensure it is a valid .comp file."
                        );
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    };

    const handleExportFunction = (
        componentId: string,
        functionId: string,
        fileName: string
    ) => {
        const componentData = fmeaData[componentId];
        if (!componentData || !componentData.functions[functionId]) {
            console.error("Function not found");
            return;
        }

        const functionData = componentData.functions[functionId];

        // Find the current function name from the tree data
        const findFunctionNode = (node: TreeNode): TreeNode | null => {
            if (node.id === functionId) {
                return node;
            }
            if ("children" in node && node.children) {
                for (const child of node.children) {
                    const result = findFunctionNode(child);
                    if (result) return result;
                }
            }
            return null;
        };

        const functionNode = findFunctionNode(treeData);

        if (!functionNode) {
            console.error("Function not found in tree data");
            return;
        }

        // Prepare fault data with all properties
        const faults = Object.entries(functionData.faults).map(
            ([faultId, faultData]) => {
                const faultNode = (
                    functionNode as ParentTreeNode
                ).children?.find((child) => child.id === faultId);
                return {
                    id: faultId,
                    name: faultNode?.name || faultData.failureMode,
                    failureMode: faultData.failureMode,
                    effect: faultData.effect,
                    cause: faultData.cause,
                    severity: faultData.severity,
                    occurrence: faultData.occurrence,
                    detection: faultData.detection,
                    controls: faultData.controls,
                    // Include any other properties from FaultData that you want to export
                };
            }
        );

        const exportData = {
            id: functionId,
            name: functionNode.name,
            faults: faults,
        };

        const jsonString = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });

        if (window.showSaveFilePicker) {
            window
                .showSaveFilePicker({
                    suggestedName: fileName,
                    types: [
                        {
                            description: "Function File",
                            accept: { "application/json": [".func"] },
                        },
                    ],
                })
                .then(async (fileHandle: FileSystemFileHandle) => {
                    const writable = await fileHandle.createWritable();
                    await writable.write(blob);
                    await writable.close();
                })
                .catch((error: Error) => {
                    console.error("Error saving file:", error);
                    // Fallback to saveAs if the file system API is not supported or fails
                    saveAs(blob, fileName);
                });
        } else {
            // Fallback for browsers that don't support the file system API
            saveAs(blob, fileName);
        }
    };

    // Add this function inside the FmeaPage component
    const handleImportFunctions = async (
        componentId: string,
        functionFiles: FileList
    ) => {
        const importFunction = async (file: File) => {
            return new Promise<ParentTreeNode | null>((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const content = e.target?.result as string;
                        const importedData: {
                            id: string;
                            name: string;
                            faults: {
                                id: string;
                                name: string;
                                failureMode: string;
                                effect: string;
                                cause: string;
                                severity: number;
                                occurrence: number;
                                detection: number;
                                controls: {
                                    preventive: string;
                                    detection: string;
                                };
                            }[];
                        } = JSON.parse(content);

                        // Generate a new ID for the imported function
                        const newFunctionId = `imported_function_${Date.now()}_${Math.random()
                            .toString(36)
                            .slice(2, 11)}`;

                        const newFunctionNode: ParentTreeNode = {
                            id: newFunctionId,
                            name: importedData.name,
                            type: "function",
                            children: importedData.faults.map((fault) => ({
                                id: `imported_fault_${Date.now()}_${Math.random()
                                    .toString(36)
                                    .slice(2, 11)}`,
                                name: fault.name,
                                type: "fault" as const,
                                effect: fault.effect,
                                cause: fault.cause,
                                severity: fault.severity,
                                occurrence: fault.occurrence,
                                detection: fault.detection,
                                controls: fault.controls,
                            })),
                        };

                        // Update FMEA data
                        setFMEAData((prevData) => {
                            const newFMEAData = { ...prevData };
                            if (!newFMEAData[componentId]) {
                                newFMEAData[componentId] = { functions: {} };
                            }
                            newFMEAData[componentId].functions[newFunctionId] =
                                {
                                    id: newFunctionId,
                                    faults: importedData.faults.reduce(
                                        (acc, fault) => {
                                            const newFaultId = `imported_fault_${Date.now()}_${Math.random()
                                                .toString(36)
                                                .slice(2, 11)}`;
                                            acc[newFaultId] = {
                                                id: newFaultId,
                                                failureMode: fault.failureMode,
                                                effect: fault.effect,
                                                cause: fault.cause,
                                                severity: fault.severity,
                                                occurrence: fault.occurrence,
                                                detection: fault.detection,
                                                controls: fault.controls,
                                            };
                                            return acc;
                                        },
                                        {} as Record<string, FaultData>
                                    ),
                                };
                            return newFMEAData;
                        });

                        console.log(
                            `Function "${importedData.name}" imported successfully`
                        );
                        resolve(newFunctionNode);
                    } catch (error) {
                        console.error("Error importing function:", error);
                        alert(
                            "Error importing function. Please ensure it is a valid .func file."
                        );
                        resolve(null);
                    }
                };
                reader.readAsText(file);
            });
        };

        const importedFunctions: ParentTreeNode[] = [];
        for (const file of Array.from(functionFiles)) {
            const newFunction = await importFunction(file);
            if (newFunction) {
                importedFunctions.push(newFunction);
            }
        }

        // Update tree data synchronously first
        const updateTreeData = (node: TreeNode): TreeNode => {
            if (node.id === componentId) {
                return {
                    ...node,
                    children: [...(node.children || []), ...importedFunctions],
                } as ParentTreeNode;
            }
            if ("children" in node) {
                return {
                    ...node,
                    children: node.children?.map(updateTreeData),
                } as ParentTreeNode;
            }
            return node;
        };

        // Create the updated tree first
        const updatedTree = updateTreeData(treeData);

        // Set the tree data
        setTreeData(updatedTree);

        // Expand the parent node
        setExpandedNodes((prev) => new Set([...prev, componentId]));

        // Update selected node using the updatedTree instead of treeData
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

    // Add these new functions in FmeaPage component
    const handleExportFault = (
        componentId: string,
        functionId: string,
        faultId: string,
        fileName: string
    ) => {
        const componentData = fmeaData[componentId];
        if (!componentData?.functions[functionId]?.faults[faultId]) {
            console.error("Fault not found");
            return;
        }

        const faultData = componentData.functions[functionId].faults[faultId];

        // Find the current fault name from the tree data
        const findFaultNode = (node: TreeNode): TreeNode | null => {
            if (node.id === faultId) {
                return node;
            }
            if ("children" in node && node.children) {
                for (const child of node.children) {
                    const result = findFaultNode(child);
                    if (result) return result;
                }
            }
            return null;
        };

        const faultNode = findFaultNode(treeData);

        if (!faultNode) {
            console.error("Fault not found in tree data");
            return;
        }

        const exportData = {
            id: faultId,
            name: faultNode.name,
            failureMode: faultData.failureMode,
            effect: faultData.effect,
            cause: faultData.cause,
            severity: faultData.severity,
            occurrence: faultData.occurrence,
            detection: faultData.detection,
            controls: faultData.controls,
        };

        const jsonString = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });

        if (window.showSaveFilePicker) {
            window
                .showSaveFilePicker({
                    suggestedName: fileName,
                    types: [
                        {
                            description: "Fault File",
                            accept: { "application/json": [".fault"] },
                        },
                    ],
                })
                .then(async (fileHandle: FileSystemFileHandle) => {
                    const writable = await fileHandle.createWritable();
                    await writable.write(blob);
                    await writable.close();
                })
                .catch((error: Error) => {
                    console.error("Error saving file:", error);
                    saveAs(blob, fileName);
                });
        } else {
            saveAs(blob, fileName);
        }
    };

    const handleImportFaults = async (
        componentId: string,
        functionId: string,
        faultFiles: FileList
    ) => {
        const importFault = async (file: File) => {
            return new Promise<FaultTreeNode | null>((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const content = e.target?.result as string;
                        const importedData = JSON.parse(content);

                        // Generate a new ID for the imported fault
                        const newFaultId = `imported_fault_${Date.now()}_${Math.random()
                            .toString(36)
                            .slice(2, 11)}`;

                        const newFaultNode: FaultTreeNode = {
                            id: newFaultId,
                            name: importedData.name,
                            type: "fault",
                            effect: importedData.effect,
                            cause: importedData.cause,
                            severity: importedData.severity,
                            occurrence: importedData.occurrence,
                            detection: importedData.detection,
                            controls: importedData.controls,
                        };

                        // Update FMEA data
                        setFMEAData((prevData) => {
                            const updatedData = { ...prevData };
                            if (!updatedData[componentId]) {
                                updatedData[componentId] = { functions: {} };
                            }
                            if (
                                !updatedData[componentId].functions[functionId]
                            ) {
                                updatedData[componentId].functions[functionId] =
                                    {
                                        id: functionId,
                                        faults: {},
                                    };
                            }

                            updatedData[componentId].functions[
                                functionId
                            ].faults[newFaultId] = {
                                id: newFaultId,
                                failureMode: importedData.failureMode,
                                effect: importedData.effect,
                                cause: importedData.cause,
                                severity: importedData.severity,
                                occurrence: importedData.occurrence,
                                detection: importedData.detection,
                                controls: importedData.controls,
                            };

                            return updatedData;
                        });

                        console.log(
                            `Fault "${importedData.name}" imported successfully`
                        );
                        resolve(newFaultNode);
                    } catch (error) {
                        console.error("Error importing fault:", error);
                        alert(
                            "Error importing fault. Please ensure it is a valid .fault file."
                        );
                        resolve(null);
                    }
                };
                reader.readAsText(file);
            });
        };

        const importedFaults: FaultTreeNode[] = [];
        for (const file of Array.from(faultFiles)) {
            const newFault = await importFault(file);
            if (newFault) {
                importedFaults.push(newFault);
            }
        }

        // Update tree data synchronously first
        const updateTreeData = (node: TreeNode): TreeNode => {
            if (node.id === functionId) {
                return {
                    ...node,
                    children: [...(node.children || []), ...importedFaults],
                } as ParentTreeNode;
            }
            if ("children" in node) {
                return {
                    ...node,
                    children: node.children?.map(updateTreeData),
                } as ParentTreeNode;
            }
            return node;
        };

        // Create the updated tree first
        const updatedTree = updateTreeData(treeData);

        // Set the tree data
        setTreeData(updatedTree);

        // Update selected node using the updatedTree instead of treeData
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

    return (
        <div className="flex flex-col h-screen">
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
                <h1 className="text-2xl font-bold">FMEA Analysis</h1>
                <div className="flex items-center space-x-4">
                    <Button
                        variant={
                            activeTab === "worksheet" ? "secondary" : "ghost"
                        }
                        onClick={() => setActiveTab("worksheet")}
                    >
                        Worksheet
                    </Button>
                    <Button
                        variant={
                            activeTab === "diagram" ? "secondary" : "ghost"
                        }
                        onClick={() => setActiveTab("diagram")}
                    >
                        Tree Diagram
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                className="bg-white text-blue-700"
                            >
                                <Upload className="mr-2 h-4 w-4" />
                                Load
                                <ChevronDown className="ml-2 h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem
                                onSelect={() =>
                                    document
                                        .getElementById("fmea-file-input")
                                        ?.click()
                                }
                            >
                                Load FMEA
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onSelect={() =>
                                    document
                                        .getElementById("xml-file-input")
                                        ?.click()
                                }
                            >
                                Load XML
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                className="bg-white text-blue-700"
                            >
                                <Download className="mr-2 h-4 w-4" />
                                Save
                                <ChevronDown className="ml-2 h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onSelect={handleSaveFMEA}>
                                Save FMEA
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={handleSaveXML}>
                                Save XML
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
            <div className="flex flex-1 overflow-hidden">
                {activeTab === "diagram" ? (
                    // Full-width tree diagram
                    <div className="w-full overflow-auto">
                        <TreeDiagram data={treeData} />
                    </div>
                ) : (
                    // Original layout for worksheet view
                    <>
                        <div className="w-1/4 p-4 bg-gray-100 overflow-auto">
                            <TreeView
                                onNodeSelect={handleNodeSelect}
                                treeData={treeData}
                                onNodeNameChange={handleNodeNameChange}
                                onDeleteNode={handleDeleteNode}
                                selectedNodeId={selectedNode?.id}
                                onAddChild={handleAddChild}
                                expandedNodes={expandedNodes}
                                onToggleExpand={(nodeId: string) => {
                                    setExpandedNodes((prev) => {
                                        const next = new Set(prev);
                                        if (next.has(nodeId)) {
                                            next.delete(nodeId);
                                        } else {
                                            next.add(nodeId);
                                        }
                                        return next;
                                    });
                                }}
                                onExportComponent={handleExportComponent}
                                onImportComponent={handleImportComponent}
                            />
                        </div>
                        <div className="w-3/4 p-4 overflow-auto">
                            <FMEAWorksheet
                                selectedNode={selectedNode}
                                data={fmeaData}
                                onDataChange={handleDataChange}
                                getNodePath={getNodePath}
                                findNodeByPath={findNodeByPath}
                                onNodeSelect={handleBreadcrumbNodeSelect}
                                onFunctionNameChange={updateNodeName}
                                onAddFault={handleAddFault}
                                onAddFunction={handleAddFunction}
                                onDeleteFault={handleDeleteFault}
                                onDeleteFunction={handleDeleteFunction}
                                onExportFunction={handleExportFunction}
                                onImportFunctions={handleImportFunctions}
                                onExportFault={handleExportFault}
                                onImportFaults={handleImportFaults}
                            />
                        </div>
                    </>
                )}
            </div>
            <input
                type="file"
                accept=".fmea"
                onChange={handleLoadFMEA}
                className="hidden"
                id="fmea-file-input"
            />
            <input
                type="file"
                accept=".xml"
                onChange={handleLoadXML}
                className="hidden"
                id="xml-file-input"
            />
        </div>
    );
}
