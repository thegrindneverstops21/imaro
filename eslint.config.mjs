import js from "@eslint/js";
import tseslint from "typescript-eslint";

const MAX_FUNCTION_LINES = 30;
const MAX_PARAMS = 3;
const MAX_NESTING = 2;
const MAX_COMPLEXITY = 8;

export default tseslint.config(
  { ignores: ["dist", "node_modules"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.ts"],
    rules: {
      "max-lines-per-function": [
        "error",
        { max: MAX_FUNCTION_LINES, skipBlankLines: true, skipComments: true },
      ],
      "max-params": ["error", MAX_PARAMS],
      "max-depth": ["error", MAX_NESTING],
      complexity: ["error", MAX_COMPLEXITY],
      "no-else-return": "error",
      "no-lonely-if": "error",
      "no-restricted-syntax": [
        "error",
        {
          selector: "IfStatement[alternate]",
          message: "Use guard clauses instead of else.",
        },
      ],
      "no-magic-numbers": "off",
      "@typescript-eslint/no-magic-numbers": [
        "error",
        {
          ignore: [0, 1, -1],
          ignoreArrayIndexes: true,
          enforceConst: true,
          ignoreEnums: true,
          ignoreNumericLiteralTypes: true,
          ignoreReadonlyClassProperties: true,
          ignoreTypeIndexes: true,
        },
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
    },
  },
);
