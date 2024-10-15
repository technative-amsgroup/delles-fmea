"use client";
import { useState, useEffect } from "react";
import { FmeaPage } from "@/components/fmea-page";
import UnsupportedScreen from "@/components/UnsupportedScreen";

const MINIMUM_SUPPORTED_WIDTH = 768; // Adjust this value as needed

export default function Home() {
    const [isSupported, setIsSupported] = useState(true);

    useEffect(() => {
        const checkScreenSize = () => {
            setIsSupported(window.innerWidth >= MINIMUM_SUPPORTED_WIDTH);
        };

        checkScreenSize();
        window.addEventListener("resize", checkScreenSize);

        return () => window.removeEventListener("resize", checkScreenSize);
    }, []);

    return <div>{isSupported ? <FmeaPage /> : <UnsupportedScreen />}</div>;
}
