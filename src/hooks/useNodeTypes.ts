import { useCallback } from "react";
import { TreeNode, ParentTreeNode } from "@/lib/types";

export const useNodeTypes = () => {
    const determineNodeType = useCallback(
        (
            node: TreeNode,
            isRoot: boolean
        ): "system" | "subsystem" | "component" => {
            if (isRoot) {
                return "system";
            }
            if (
                node.type === "component" ||
                !("children" in node) ||
                !node.children ||
                node.children.length === 0 ||
                node.children.every(
                    (child) =>
                        child.type === "function" || child.type === "fault"
                )
            ) {
                return "component";
            }
            return "subsystem";
        },
        []
    );

    const updateNodeTypes = useCallback(
        (treeData: TreeNode): TreeNode => {
            const updateNode = (node: TreeNode, isRoot: boolean): TreeNode => {
                if (node.type === "function" || node.type === "fault") {
                    return node; // Preserve function and fault nodes as they are
                }

                const newType = determineNodeType(node, isRoot);
                const updatedNode: ParentTreeNode = {
                    ...node,
                    type: newType,
                    children: [],
                };

                if ("children" in node && node.children) {
                    updatedNode.children = node.children.map((child) =>
                        updateNode(child, false)
                    );
                }

                return updatedNode;
            };

            return updateNode(treeData, true);
        },
        [determineNodeType]
    );

    return { determineNodeType, updateNodeTypes };
};
