import { NextConfig } from "next";

export interface RscErrorHandlerOptions {
  componentName?: RegExp;
}

export function rscErrorHandler(
  options: RscErrorHandlerOptions
): (nextConfig: NextConfig) => NextConfig;

export interface GlobalServerErrorContext {
  filePath: string;
  componentName: string;
}

export type GlobalServerError = (
  error: unknown,
  ctx: GlobalServerErrorContext
) => React.ReactNode;
