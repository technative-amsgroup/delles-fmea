"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
    FileIcon,
    SaveIcon,
    UndoIcon,
    RedoIcon,
    HelpCircleIcon,
} from "lucide-react";

export function HeaderToolbar() {
    return (
        <div className="flex items-center justify-between p-4 bg-gray-800 text-white">
            <div className="flex items-center space-x-2">
                <Button variant="ghost" size="icon">
                    <FileIcon className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                    <SaveIcon className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                    <UndoIcon className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                    <RedoIcon className="h-4 w-4" />
                </Button>
            </div>

            <Button variant="ghost" size="icon">
                <HelpCircleIcon className="h-4 w-4" />
            </Button>
        </div>
    );
}
