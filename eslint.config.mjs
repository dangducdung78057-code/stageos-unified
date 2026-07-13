import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  {
    rules: {
      // PixiJS / Canvas / R3F 渲染循环必须命令式更新场景图和画布。
      "react-hooks/immutability": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  },
  globalIgnores([
    ".next/**",
    ".handoff/**",
    "imported-app/**",
    "imported-assets/**",
    "public/**",
  ]),
]);
