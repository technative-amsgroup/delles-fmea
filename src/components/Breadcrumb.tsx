import React from "react";

interface BreadcrumbProps {
    path: string;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ path }) => {
    const pathSegments = path.split(" > ");

    return (
        <nav className="text-lg text-gray-800 mb-4">
            {pathSegments.map((segment, index) => (
                <span key={index} className="font-medium">
                    {segment}
                    {index < pathSegments.length - 1 && (
                        <span className="mx-2">/</span>
                    )}
                </span>
            ))}
        </nav>
    );
};

export default Breadcrumb;
