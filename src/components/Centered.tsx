import type { ReactNode } from "react";

/** Vertically + horizontally centered block, used for loaders and status
 *  messages. */
export function Centered({ children }: { children: ReactNode }) {
    return (
        <div className="flex min-h-[240px] w-full flex-col items-center justify-center p-6">
            {children}
        </div>
    );
}
