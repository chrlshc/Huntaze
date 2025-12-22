/// <reference types="vitest" />

import "@testing-library/jest-dom";

declare global {
  namespace Vi {
    interface JestAssertion<T = any> extends jest.Matchers<void, T> {
      toBeInTheDocument(): T;
      toBeChecked(): T;
      toBeDisabled(): T;
      toHaveTextContent(text: string | RegExp): T;
      toHaveClass(...classNames: string[]): T;
    }
  }
}
