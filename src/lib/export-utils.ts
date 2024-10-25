export const exportAsSVG = (svgElement: SVGSVGElement) => {
    // Get the SVG element and its bounding box
    const bbox = svgElement.getBBox();

    // Create a copy of the SVG
    const svgData = svgElement.cloneNode(true) as SVGElement;

    // Set the viewBox to encompass all content
    svgData.setAttribute(
        "viewBox",
        `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`
    );
    // Ensure width and height are set to maintain aspect ratio
    svgData.setAttribute("width", bbox.width.toString());
    svgData.setAttribute("height", bbox.height.toString());

    const svgString = new XMLSerializer().serializeToString(svgData);
    const blob = new Blob([svgString], { type: "image/svg+xml" });

    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "tree-diagram.svg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

export const exportAsPNG = (svgElement: SVGSVGElement) => {
    // Get the SVG element and its bounding box
    const bbox = svgElement.getBBox();

    // Create a canvas element with appropriate size
    const canvas = document.createElement("canvas");
    const scale = 2; // Increase resolution for better quality
    canvas.width = bbox.width * scale;
    canvas.height = bbox.height * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Create a copy of the SVG with proper viewBox
    const svgData = svgElement.cloneNode(true) as SVGElement;
    svgData.setAttribute(
        "viewBox",
        `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`
    );
    svgData.setAttribute("width", (bbox.width * scale).toString());
    svgData.setAttribute("height", (bbox.height * scale).toString());

    const svgString = new XMLSerializer().serializeToString(svgData);
    const img = new Image();
    const blob = new Blob([svgString], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);

    img.onload = () => {
        // Fill white background
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw the image
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const pngUrl = canvas.toDataURL("image/png");

        // Create download link
        const link = document.createElement("a");
        link.href = pngUrl;
        link.download = "tree-diagram.png";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };
    img.src = url;
};
