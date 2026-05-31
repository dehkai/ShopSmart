```markdown
# ShopSmart Development Patterns

> Auto-generated skill from repository analysis

## Overview
This skill teaches you the core development patterns and workflows of the ShopSmart TypeScript codebase. ShopSmart is a frontend-focused project with modular UI components, custom hooks, and a clear structure for feature development and page revamps. The repository follows conventional commit messages, PascalCase file naming, and uses named exports with alias-based imports. This guide will help you contribute effectively by following established conventions and workflows.

## Coding Conventions

### File Naming
- **PascalCase** is used for all file and folder names, especially for components and hooks.
  - Example: `BasketInput.tsx`, `StateSelector.tsx`, `useBasket.ts`

### Import Style
- **Alias-based imports** are preferred for clarity and maintainability.
  - Example:
    ```typescript
    import { BasketInput } from '@/components/basket/BasketInput';
    import { useBasket } from '@/hooks/useBasket';
    ```

### Export Style
- **Named exports** are used throughout the codebase.
  - Example:
    ```typescript
    // In BasketInput.tsx
    export const BasketInput = () => { /* ... */ };
    ```

### Commit Messages
- **Conventional commits** with the `feat` prefix are standard.
  - Example: `feat: add basket state selector`

## Workflows

### Frontend Feature or Page Revamp
**Trigger:** When adding a new frontend page or significantly updating an existing one (e.g., landing or basket page).
**Command:** `/revamp-frontend-page`

1. **Update or create relevant page files** in `src/app` (e.g., `page.tsx`).
    ```typescript
    // src/app/page.tsx
    import { ResultsSection } from '@/components/results/ResultsSection';

    export const Page = () => (
      <main>
        <ResultsSection />
      </main>
    );
    ```
2. **Modify or add UI components** in `src/components` (such as in `basket`, `results`, or `ui` subfolders).
    ```typescript
    // src/components/basket/BasketInput.tsx
    export const BasketInput = () => { /* ... */ };
    ```
3. **Update related hooks** in `src/hooks` (e.g., `useBasket.ts`).
    ```typescript
    // src/hooks/useBasket.ts
    export const useBasket = () => { /* ... */ };
    ```
4. **Adjust global styles** in `src/app/globals.css` as needed.
    ```css
    /* src/app/globals.css */
    body {
      background: #fafafa;
    }
    ```

**Files commonly involved:**
- `frontend/src/app/page.tsx`
- `frontend/src/app/globals.css`
- `frontend/src/components/basket/BasketInput.tsx`
- `frontend/src/components/basket/StateSelector.tsx`
- `frontend/src/components/results/ItemPriceList.tsx`
- `frontend/src/components/results/MatchesTable.tsx`
- `frontend/src/components/results/ResultsSection.tsx`
- `frontend/src/components/results/StateChart.tsx`
- `frontend/src/components/results/SummaryStats.tsx`
- `frontend/src/hooks/useBasket.ts`

**Frequency:** ~2x/month

---

## Testing Patterns

- **Test files** use the pattern `*.test.*` (e.g., `BasketInput.test.tsx`).
- **Testing framework** is not specified, but tests are colocated with the code they cover.
- **Example test file:**
    ```typescript
    // BasketInput.test.tsx
    import { render } from '@testing-library/react';
    import { BasketInput } from './BasketInput';

    test('renders BasketInput', () => {
      render(<BasketInput />);
      // assertions...
    });
    ```

## Commands

| Command                | Purpose                                                      |
|------------------------|--------------------------------------------------------------|
| /revamp-frontend-page  | Start or document a frontend page or feature revamp workflow |
```
