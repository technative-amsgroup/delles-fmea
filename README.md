# Delles FMEA Tool (Prototype)

A web-based tool for exploring Failure Mode and Effects Analysis (FMEA), built with Next.js, TypeScript, and D3.js.

**⚠️ Current Status: Prototype / Proof-of-Concept**

This project was initially developed as an exploration for a friend working in automotive safety expertise, aiming to provide a modern, interactive alternative to traditional spreadsheet-based FMEA.

It is **not production-ready** and should be considered a prototype. While core functionalities like tree building, basic FMEA data entry, and visualization are implemented, it lacks comprehensive features, robust error handling, data validation, user management, and thorough testing required for reliable real-world application.

## Purpose

-   Explore a modern web interface for FMEA tasks.
-   Visualize system hierarchy and relationships using interactive diagrams.
-   Structure FMEA data around a system decomposition (System > Subsystem > Component > Function > Fault).
-   Experiment with component/function/fault reusability through import/export.

## Features Implemented

-   **Hierarchical Tree View:** Decompose systems into subsystems and components.
-   **FMEA Worksheet:** Define functions within components and associate faults (failure modes). Enter basic FMEA data (Effect, Cause, Severity, Occurrence, Detection, Controls).
-   **RPN Calculation:** Automatic calculation of Risk Priority Number based on S, O, D ratings.
-   **Interactive Tree Diagram:** D3.js powered visualization of the system hierarchy. Nodes can be collapsed/expanded. Supports SVG/PNG export. Includes "Element View" to focus on specific paths.
-   **Data Import/Export:**
    -   Save/Load entire analysis state (`.fmea` JSON format).
    -   Export/Import individual Components (`.comp`), Functions (`.func`), and Faults (`.fault`) in JSON format for reusability.
    -   Basic XML export/import (MSRFMEA-like structure, likely incomplete standard adherence).
-   **Basic UI:** Built with Shadcn/ui components, Tailwind CSS. Includes responsive checks for minimum screen width.

_Note: The analysis charts (`RiskPriorityChart`, `SeverityDistributionChart`) exist but are currently commented out in `fmea-page.tsx`._

## Tech Stack

-   Framework: Next.js 14 (App Router)
-   Language: TypeScript
-   Styling: Tailwind CSS
-   UI Components: Shadcn/ui
-   Visualization: D3.js
-   Charting: Chart.js (via react-chartjs-2)
-   Utilities: Lodash, clsx, tailwind-merge
-   XML Handling: xml2js

## Getting Started

1.  Clone the repository:
    ```bash
    git clone https://github.com/Delles/delles-fmea.git
    cd delles-fmea
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Run the development server:
    ```bash
    npm run dev
    ```
4.  Open [http://localhost:3000](http://localhost:3000) in your browser. Requires a screen width of at least 768px.

## License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

This means you are free to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, provided you include the original copyright notice. This license allows commercial use but comes with no warranties.

_As the original author, I appreciate acknowledgment if you build significantly upon this work, but it is not a requirement of the license beyond the standard copyright notice._

## Contributing

This project is not actively seeking contributions as it's primarily a prototype. However, feel free to fork the repository and adapt it for your own needs according to the MIT License.

## Contact

For questions or discussions related to this specific project, please use the [GitHub Issues](https://github.com/[your-username]/delles-fmea/issues).
