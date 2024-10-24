import { TreeNode, ParentTreeNode, FaultTreeNode, FMEAData } from "./types";

function createXMLElement(
    name: string,
    attributes: Record<string, string> = {},
    textContent?: string
): string {
    const attrs = Object.entries(attributes)
        .map(([key, value]) => `${key}="${value}"`)
        .join(" ");

    const openTag = attrs ? `<${name} ${attrs}>` : `<${name}>`;
    const closeTag = `</${name}>`;

    return textContent !== undefined
        ? `${openTag}${textContent}${closeTag}`
        : openTag;
}

function generateStaticStructure(rootNode: TreeNode): string {
    // Start with XML declaration
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';

    // Create root MSRFMEA element
    xml += "<MSRFMEA>\n";

    // Add ADMIN-DATA
    xml += "  <ADMIN-DATA>\n";
    xml += "    <USED-LANGUAGES>\n";
    xml += '      <L-10 L="EN">EN</L-10>\n';
    xml += "    </USED-LANGUAGES>\n";
    xml += "    <COMPANY-DOC-INFOS>\n";
    xml += "      <COMPANY-DOC-INFO>\n";
    xml += "        <COMPANY-REF>Company</COMPANY-REF>\n";
    xml += "      </COMPANY-DOC-INFO>\n";
    xml += "    </COMPANY-DOC-INFOS>\n";
    xml += "  </ADMIN-DATA>\n";

    // Add FM-HEAD
    xml += "  <FM-HEAD>\n";
    xml += "    <COMPANIES>\n";
    xml += '      <COMPANY ID="P.project">\n';
    xml += "        <LONG-NAME>\n";
    xml += '          <L-4 L="EN">Default</L-4>\n';
    xml += "        </LONG-NAME>\n";
    xml += "        <SHORT-NAME>Default</SHORT-NAME>\n";
    xml += "      </COMPANY>\n";
    xml += "    </COMPANIES>\n";
    xml += "  </FM-HEAD>\n";

    // Add FM-TOOL-DATA
    xml += "  <FM-TOOL-DATA>\n";
    xml += '    <FM-TOOL ID="GENERATED-ID-0">\n';
    xml += "      <LONG-NAME>\n";
    xml += '        <L-4 L="EN">Default</L-4>\n';
    xml += "      </LONG-NAME>\n";
    xml += "      <SHORT-NAME>Default</SHORT-NAME>\n";
    xml += "    </FM-TOOL>\n";
    xml += "  </FM-TOOL-DATA>\n";

    // Add FM-STRUCTURES with root reference
    xml += "  <FM-STRUCTURES>\n";
    xml += `    <FM-STRUCTURE F-ID-CLASS="FM-STRUCTURE" ID="Structure_01">\n`;
    xml += "      <LONG-NAME>\n";
    xml += `        <L-4 L="EN">${rootNode.name}</L-4>\n`;
    xml += "      </LONG-NAME>\n";
    xml += "      <FM-STRUCTURE-ROOT>\n";
    xml += `        <FM-STRUCTURE-ELEMENT-REF ID-REF="${rootNode.id}"/>\n`;
    xml += "      </FM-STRUCTURE-ROOT>\n";
    xml += "    </FM-STRUCTURE>\n";
    xml += "  </FM-STRUCTURES>\n";

    return xml;
}

function addElementsToXML(rootNode: TreeNode, fmeaData: FMEAData): string {
    let xml = "";

    // Start main sections
    xml += "  <FM-STRUCTURE-ELEMENTS>\n";
    const componentsXML = addComponents(rootNode);
    xml += componentsXML;
    xml += "  </FM-STRUCTURE-ELEMENTS>\n";

    xml += "  <FM-FUNCTIONS>\n";
    const functionsXML = addFunctions(rootNode, fmeaData);
    xml += functionsXML;
    xml += "  </FM-FUNCTIONS>\n";

    xml += "  <FM-FAULTS>\n";
    const faultsXML = addFaults(rootNode, fmeaData);
    xml += faultsXML;
    xml += "  </FM-FAULTS>\n";

    return xml;
}

function addComponents(node: TreeNode): string {
    if (node.type === "fault") return "";

    let xml = "";
    const componentNode = node as ParentTreeNode;

    xml += `    <FM-STRUCTURE-ELEMENT ID="${componentNode.id}" F-ID-CLASS="FM-STRUCTURE-ELEMENT">\n`;
    xml += "      <LONG-NAME>\n";
    xml += `        <L-4 L="EN">${componentNode.name}</L-4>\n`;
    xml += "      </LONG-NAME>\n";
    xml += `      <SHORT-NAME SI="AUTONUMBER">${componentNode.id}</SHORT-NAME>\n`;

    // Add decomposition if there are child components
    const childComponents = componentNode.children.filter(
        (child) =>
            child.type === "system" ||
            child.type === "subsystem" ||
            child.type === "component"
    );

    if (childComponents.length > 0) {
        xml += "      <FM-SE-DECOMPOSITION>\n";
        childComponents.forEach((child) => {
            xml += `        <FM-STRUCTURE-ELEMENT-REF ID-REF="${child.id}" F-ID-CLASS="FM-STRUCTURE-ELEMENT"/>\n`;
        });
        xml += "      </FM-SE-DECOMPOSITION>\n";
    }

    // Add function references
    const functions = componentNode.children.filter(
        (child) => child.type === "function"
    );
    if (functions.length > 0) {
        xml += "      <FM-SE-FUNCTIONS>\n";
        functions.forEach((func) => {
            xml += `        <FM-FUNCTION-REF ID-REF="${func.id}" F-ID-CLASS="FM-FUNCTION"/>\n`;
        });
        xml += "      </FM-SE-FUNCTIONS>\n";
    }

    xml += "    </FM-STRUCTURE-ELEMENT>\n";

    // Recursively add child components
    childComponents.forEach((child) => {
        xml += addComponents(child);
    });

    return xml;
}

function addFunctions(node: TreeNode, fmeaData: FMEAData): string {
    if (node.type === "fault") return "";

    let xml = "";
    const parentNode = node as ParentTreeNode;

    // Add current node's functions
    parentNode.children
        .filter((child) => child.type === "function")
        .forEach((func) => {
            xml += `    <FM-FUNCTION ID="${func.id}" F-ID-CLASS="FM-FUNCTION">\n`;
            xml += "      <LONG-NAME>\n";
            xml += `        <L-4 L="EN">${func.name}</L-4>\n`;
            xml += "      </LONG-NAME>\n";
            xml += `      <SHORT-NAME SI="AUTONUMBER">${func.id}</SHORT-NAME>\n`;

            // Add fault references
            const faults = (func as ParentTreeNode).children.filter(
                (child) => child.type === "fault"
            );
            if (faults.length > 0) {
                xml += "      <FM-FAULT-REFS>\n";
                faults.forEach((fault) => {
                    xml += `        <FM-FAULT-REF ID-REF="${fault.id}" F-ID-CLASS="FM-FAULT"/>\n`;
                });
                xml += "      </FM-FAULT-REFS>\n";
            }

            xml += "    </FM-FUNCTION>\n";
        });

    // Recursively add functions from child components
    parentNode.children
        .filter((child) => child.type !== "function" && child.type !== "fault")
        .forEach((child) => {
            xml += addFunctions(child, fmeaData);
        });

    return xml;
}

function addFaults(node: TreeNode, fmeaData: FMEAData): string {
    if (node.type === "fault") return "";

    let xml = "";
    const parentNode = node as ParentTreeNode;

    // Add faults from functions
    parentNode.children
        .filter((child) => child.type === "function")
        .forEach((func) => {
            (func as ParentTreeNode).children
                .filter((child) => child.type === "fault")
                .forEach((fault) => {
                    const faultNode = fault as FaultTreeNode;
                    const faultData =
                        fmeaData[node.id]?.functions[func.id]?.faults[fault.id];

                    xml +=
                        createXMLElement("FM-FAULT", {
                            ID: faultNode.id,
                            "F-ID-CLASS": "FM-FAULT",
                        }) + "\n";

                    xml += "      " + createXMLElement("LONG-NAME") + "\n";
                    xml +=
                        "        " +
                        createXMLElement("L-4", { L: "EN" }, faultNode.name) +
                        "\n";
                    xml += "      </LONG-NAME>\n";

                    xml +=
                        "      " +
                        createXMLElement(
                            "SHORT-NAME",
                            { SI: "AUTONUMBER" },
                            faultNode.id
                        ) +
                        "\n";

                    if (faultData) {
                        xml +=
                            "      " +
                            createXMLElement(
                                "FAILURE-MODE",
                                {},
                                faultData.failureMode
                            ) +
                            "\n";
                        xml +=
                            "      " +
                            createXMLElement("EFFECT", {}, faultData.effect) +
                            "\n";
                        xml +=
                            "      " +
                            createXMLElement("CAUSE", {}, faultData.cause) +
                            "\n";
                        xml +=
                            "      " +
                            createXMLElement(
                                "CONTROLS",
                                {},
                                faultData.controls
                            ) +
                            "\n";
                        xml +=
                            "      " +
                            createXMLElement(
                                "SEVERITY",
                                {},
                                faultData.severity.toString()
                            ) +
                            "\n";
                        xml +=
                            "      " +
                            createXMLElement(
                                "OCCURRENCE",
                                {},
                                faultData.occurrence.toString()
                            ) +
                            "\n";
                        xml +=
                            "      " +
                            createXMLElement(
                                "DETECTION",
                                {},
                                faultData.detection.toString()
                            ) +
                            "\n";
                    }

                    xml += "    </FM-FAULT>\n";
                });
        });

    // Recursively add faults from child components
    parentNode.children
        .filter((child) => child.type !== "function" && child.type !== "fault")
        .forEach((child) => {
            xml += addFaults(child, fmeaData);
        });

    return xml;
}

export function saveToXML(rootNode: TreeNode, fmeaData: FMEAData): string {
    let xml = generateStaticStructure(rootNode);
    xml += addElementsToXML(rootNode, fmeaData);
    xml += "</MSRFMEA>";
    return xml;
}
