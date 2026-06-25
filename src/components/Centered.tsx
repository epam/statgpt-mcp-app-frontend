import type { ReactNode } from 'react';

/**
 * Vertically + horizontally centered block, used for loaders and status
 * messages.
 *
 * @example
 * ```tsx
 * <Centered>
 *   <Loader />
 * </Centered>
 * ```
 *
 * @param children - Content to center inside the container.
 */
export function Centered({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[240px] w-full flex-col items-center justify-center p-6">
      {children}
    </div>
  );
}
