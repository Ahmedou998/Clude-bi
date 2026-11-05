import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/components/providers.tsx"],
    rules: { "react-hooks/set-state-in-effect": "off" },
  },
  { ignores: [".next/**", "node_modules/**", "coverage/**"] },
];

export default eslintConfig;
