import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // An unrelated package-lock.json sits in the home directory above this
  // project, so Turbopack's root inference picks that up and treats the
  // whole home folder as the workspace root. Pin it explicitly instead.
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
