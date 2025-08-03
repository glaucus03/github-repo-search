// Jest DOM テスト用のカスタムマッチャーをインポート
import "@testing-library/jest-dom";

// framer-motionのモック
jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }) => {
      const { createElement } = require("react");
      return createElement("div", props, children);
    },
    button: ({ children, ...props }) => {
      const { createElement } = require("react");
      return createElement("button", props, children);
    },
    span: ({ children, ...props }) => {
      const { createElement } = require("react");
      return createElement("span", props, children);
    },
  },
  AnimatePresence: ({ children }) => children,
  useMotionValue: () => ({ set: jest.fn() }),
  useTransform: () => ({ set: jest.fn() }),
  useAnimation: () => ({
    start: jest.fn(),
    stop: jest.fn(),
    set: jest.fn(),
  }),
  useDragControls: () => ({
    start: jest.fn(),
  }),
}));

// HeroUI のモック設定
jest.mock("@heroui/react", () => {
  const React = require("react");
  return {
    ...jest.requireActual("@heroui/react"),
    // アニメーション関連のコンポーネントをシンプルなモックに置き換え
    Button: ({ children, ...props }) =>
      React.createElement("button", props, children),
    Navbar: ({ children, ...props }) =>
      React.createElement("nav", props, children),
    NavbarBrand: ({ children, ...props }) =>
      React.createElement("div", props, children),
    NavbarContent: ({ children, ...props }) =>
      React.createElement("div", props, children),
    NavbarItem: ({ children, ...props }) =>
      React.createElement("div", props, children),
    Link: ({ children, ...props }) => React.createElement("a", props, children),
  };
});

// Next.js Router のモック
jest.mock("next/navigation", () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return "";
  },
}));

// GitHub API のモック設定
global.fetch = jest.fn();

// Window オブジェクトのモック（必要に応じて）
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Intersection Observer のモック（無限スクロール用）
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {
    return null;
  }
  disconnect() {
    return null;
  }
  unobserve() {
    return null;
  }
};
