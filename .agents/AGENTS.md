# WORKSPACE RULES & BEHAVIORAL CONSTRAINTS

## 1. Strict Code Quality & Build Checks
* **No Unused Imports or Variables**: Before staging or committing any code (especially in the frontend React repository), you **MUST** ensure all unused imports, variables, and functions are completely removed. Unused imports/variables will crash the build process (due to strict `tsc` compiler configurations).
* **Local Build Verification**: Always execute a production build check locally using `npm run build` or compile check after modifications to ensure that the project compiles with zero TypeScript or bundler warnings/errors.
* **No Ignoring Lint / Type Warnings**: Never ignore or bypass ESLint warnings or TS compiler diagnostics. Fix them immediately.

## 2. Git Hooks & Local Quality Assurance
* **Respect Git Hooks (Husky)**: Do not bypass or commit with `--no-verify` unless absolutely necessary for infrastructure changes. Verify all linting checks pass locally.
