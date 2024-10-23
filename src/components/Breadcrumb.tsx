import * as React from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreadcrumbProps {
    path: string;
    onSegmentClick?: (segmentPath: string) => void;
    className?: string;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({
    path,
    onSegmentClick,
    className,
}) => {
    const pathSegments = path.split(" > ");

    // Create segments array with cumulative paths
    const segments = pathSegments.map((segment, index) => ({
        name: segment,
        // Create cumulative path for each segment
        fullPath: pathSegments.slice(0, index + 1).join(" > "),
    }));

    return (
        <nav
            aria-label="Breadcrumb"
            className={cn(
                "flex items-center space-x-2 text-sm",
                "py-1", // Add padding to make it easier to click
                className
            )}
        >
            <ol className="flex items-center space-x-2">
                {segments.map((segment, index) => (
                    <li
                        key={segment.fullPath}
                        className="flex items-center space-x-2"
                    >
                        {index > 0 && (
                            <ChevronRight className="h-4 w-4 text-gray-500" />
                        )}
                        <button
                            onClick={() => onSegmentClick?.(segment.fullPath)}
                            className={cn(
                                "transition-colors hover:text-primary",
                                "rounded px-1 py-0.5", // Add padding for better click target
                                "hover:bg-gray-100", // Add hover background
                                index === segments.length - 1
                                    ? "font-semibold text-primary"
                                    : "text-muted-foreground"
                            )}
                        >
                            {segment.name}
                        </button>
                    </li>
                ))}
            </ol>
        </nav>
    );
};

export default Breadcrumb;
