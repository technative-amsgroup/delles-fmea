import React from "react";

const UnsupportedScreen: React.FC = () => {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="text-center p-8 bg-white rounded-lg shadow-md">
                <h1 className="text-2xl font-bold mb-4">
                    Unsupported Screen Size
                </h1>
                <p className="text-gray-600">
                    We are sorry, but this application is not supported on small
                    screens or mobile devices. Please use a larger screen or
                    desktop computer for the best experience.
                </p>
            </div>
        </div>
    );
};

export default UnsupportedScreen;
