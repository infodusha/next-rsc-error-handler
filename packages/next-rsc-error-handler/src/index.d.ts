import { NextConfig } from "next";

export interface RscErrorHandlerOptions {}

export function rscErrorHandler(
  options: RscErrorHandlerOptions
): (nextConfig: NextConfig) => NextConfig;

export interface GlobalServerErrorContext {
  filePath: string;
  functionName: string;
  options: RscErrorHandlerOptions;
}

export type GlobalServerError = (
  error: unknown,
  ctx: GlobalServerErrorContext
) => React.ReactNode;
