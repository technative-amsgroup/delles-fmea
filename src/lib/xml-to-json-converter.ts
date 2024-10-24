import {
    TreeNode,
    ParentTreeNode,
    FaultTreeNode,
    BaseTreeNode,
    FMEAData,
} from "@/lib/types";
import { parseString } from "xml2js";

interface XMLElement {
    $: { ID: string; "F-ID-CLASS"?: string };
    "LONG-NAME": [{ "L-4": [{ _: string }] }];
    "SHORT-NAME"?: [{ _: string; $?: { SI?: string } }];
    "FM-SE-DECOMPOSITION"?: [
        { "FM-STRUCTURE-ELEMENT-REF": [{ $: { "ID-REF": string } }] }
    ];
    "FM-SE-FUNCTIONS"?: [{ "FM-FUNCTION-REF": [{ $: { "ID-REF": string } }] }];
    "FM-FAULT-REFS"?: [{ "FM-FAULT-REF": [{ $: { "ID-REF": string } }] }];
    "FM-STRUCTURE-ROOT"?: [
        { "FM-STRUCTURE-ELEMENT-REF": [{ $: { "ID-REF": string } }] }
    ];
}

interface XMLStructure {
    MSRFMEA: {
        "FM-STRUCTURES": [{ "FM-STRUCTURE": XMLElement[] }];
        "FM-STRUCTURE-ELEMENTS": [{ "FM-STRUCTURE-ELEMENT": XMLElement[] }];
        "FM-FUNCTIONS": [{ "FM-FUNCTION": XMLElement[] }];
        "FM-FAULTS": [{ "FM-FAULT": XMLElement[] }];
    };
}

export async function convertXMLToJSON(
    xmlContent: string
): Promise<{ treeData: TreeNode; fmeaData: FMEAData }> {
    return new Promise((resolve, reject) => {
        parseString(xmlContent, (err, result: XMLStructure) => {
            if (err) {
                reject(err);
                return;
            }

            const structures =
                result.MSRFMEA["FM-STRUCTURES"][0]["FM-STRUCTURE"];
            const structureElements =
                result.MSRFMEA["FM-STRUCTURE-ELEMENTS"][0][
                    "FM-STRUCTURE-ELEMENT"
                ];
            const functions = result.MSRFMEA["FM-FUNCTIONS"][0]["FM-FUNCTION"];
            const faults = result.MSRFMEA["FM-FAULTS"][0]["FM-FAULT"];

            const elementsMap = new Map<string, XMLElement>();
            structureElements.forEach((element) =>
                elementsMap.set(element.$.ID, element)
            );
            functions.forEach((func) => elementsMap.set(func.$.ID, func));
            faults.forEach((fault) => elementsMap.set(fault.$.ID, fault));

            function buildTreeNode(
                element: XMLElement,
                depth: number = 0
            ): ParentTreeNode | FaultTreeNode {
                const baseNode: BaseTreeNode = {
                    id: element.$.ID,
                    name: element["LONG-NAME"][0]["L-4"][0]._ || "Unnamed",
                    type: getNodeType(element, depth),
                };

                if (baseNode.type === "fault") {
                    return baseNode as FaultTreeNode;
                }

                const parentNode: ParentTreeNode = {
                    ...baseNode,
                    type: baseNode.type as
                        | "system"
                        | "subsystem"
                        | "component"
                        | "function",
                    children: [],
                };

                if (element["FM-SE-DECOMPOSITION"]) {
                    element["FM-SE-DECOMPOSITION"][0][
                        "FM-STRUCTURE-ELEMENT-REF"
                    ].forEach((ref) => {
                        const childElement = elementsMap.get(ref.$["ID-REF"]);
                        if (childElement) {
                            parentNode.children.push(
                                buildTreeNode(childElement, depth + 1)
                            );
                        }
                    });
                }

                if (element["FM-SE-FUNCTIONS"]) {
                    element["FM-SE-FUNCTIONS"][0]["FM-FUNCTION-REF"].forEach(
                        (ref) => {
                            const funcElement = elementsMap.get(
                                ref.$["ID-REF"]
                            );
                            if (funcElement) {
                                parentNode.children.push(
                                    buildTreeNode(funcElement, depth)
                                );
                            }
                        }
                    );
                }

                if (element["FM-FAULT-REFS"]) {
                    element["FM-FAULT-REFS"][0]["FM-FAULT-REF"].forEach(
                        (ref) => {
                            const faultElement = elementsMap.get(
                                ref.$["ID-REF"]
                            );
                            if (faultElement) {
                                parentNode.children.push(
                                    buildTreeNode(faultElement, depth)
                                );
                            }
                        }
                    );
                }

                return parentNode;
            }

            function getNodeType(
                element: XMLElement,
                depth: number
            ): TreeNode["type"] {
                if (element.$["F-ID-CLASS"] === "FM-FUNCTION")
                    return "function";
                if (element.$["F-ID-CLASS"] === "FM-FAULT") return "fault";

                if (depth === 0) return "system";
                if (
                    element["FM-SE-DECOMPOSITION"] &&
                    element["FM-SE-DECOMPOSITION"][0][
                        "FM-STRUCTURE-ELEMENT-REF"
                    ].length > 0
                ) {
                    return "subsystem";
                }
                return "component";
            }

            const rootStructure = structures[0];
            const rootElementRef =
                rootStructure["FM-STRUCTURE-ROOT"]?.[0][
                    "FM-STRUCTURE-ELEMENT-REF"
                ][0].$["ID-REF"];

            if (!rootElementRef) {
                reject(new Error("Root element reference not found"));
                return;
            }

            const rootElement = elementsMap.get(rootElementRef);

            if (!rootElement) {
                reject(new Error("Root element not found"));
                return;
            }

            const rootNode = buildTreeNode(rootElement, 0);

            // Generate FMEA data
            const fmeaData: FMEAData = {};

            function traverseTreeForFMEAData(node: TreeNode) {
                if (
                    node.type === "component" ||
                    node.type === "system" ||
                    node.type === "subsystem"
                ) {
                    fmeaData[node.id] = { functions: {} };
                    if ("children" in node && node.children) {
                        node.children.forEach((child) => {
                            if (child.type === "function") {
                                fmeaData[node.id].functions[child.id] = {
                                    id: child.id,
                                    faults: {},
                                };
                                if ("children" in child && child.children) {
                                    child.children.forEach((fault) => {
                                        if (fault.type === "fault") {
                                            fmeaData[node.id].functions[
                                                child.id
                                            ].faults[fault.id] = {
                                                id: fault.id,
                                                failureMode: fault.name,
                                                effect:
                                                    (fault as FaultTreeNode)
                                                        .effect || "",
                                                severity:
                                                    (fault as FaultTreeNode)
                                                        .severity || 1,
                                                cause:
                                                    (fault as FaultTreeNode)
                                                        .cause || "",
                                                occurrence:
                                                    (fault as FaultTreeNode)
                                                        .occurrence || 1,
                                                detection:
                                                    (fault as FaultTreeNode)
                                                        .detection || 1,
                                                controls:
                                                    (fault as FaultTreeNode)
                                                        .controls || "",
                                            };
                                        }
                                    });
                                }
                            }
                        });
                    }
                }
                if ("children" in node && node.children) {
                    node.children.forEach(traverseTreeForFMEAData);
                }
            }

            traverseTreeForFMEAData(rootNode);

            resolve({ treeData: rootNode, fmeaData });
        });
    });
}
