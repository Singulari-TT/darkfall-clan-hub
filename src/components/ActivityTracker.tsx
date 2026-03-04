"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { logActivity } from "@/app/api/audit/actions";

export default function ActivityTracker() {
    const pathname = usePathname();
    const lastPathname = useRef<string | null>(null);

    useEffect(() => {
        // Debounce or filter rapid navigation changes if needed
        // Here we just prevent duplicate logging of the same route in a row
        if (pathname && pathname !== lastPathname.current) {
            lastPathname.current = pathname;

            // Log the page view via Server Action
            logActivity("PAGE_VIEW", pathname, `Visited ${pathname}`);
        }
    }, [pathname]);

    return null; // This is a logic-only component, it renders nothing
}
