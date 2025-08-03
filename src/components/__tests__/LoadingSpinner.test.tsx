import { render, screen } from "@testing-library/react";
import React from "react";

import { LoadingSpinner } from "../LoadingSpinner";

interface MockSpinnerProps {
  size?: string;
  color?: string;
}

interface MockCardProps {
  children?: React.ReactNode;
  className?: string;
}

interface MockCardBodyProps {
  children?: React.ReactNode;
  className?: string;
}

// Mock HeroUI components
jest.mock("@heroui/react", () => ({
  Spinner: ({ size, color, ...props }: MockSpinnerProps) => (
    <div
      data-testid="spinner"
      data-size={size as string}
      data-color={color as string}
      {...props}
    />
  ),
  Card: ({ children, className }: MockCardProps) => (
    <div data-testid="card" className={className as string}>
      {children as React.ReactNode}
    </div>
  ),
  CardBody: ({ children, className }: MockCardBodyProps) => (
    <div data-testid="card-body" className={className as string}>
      {children as React.ReactNode}
    </div>
  ),
}));

// Mock utils
jest.mock("@/lib/utils", () => ({
  cn: (...classes: string[]) => classes.filter(Boolean).join(" "),
}));

describe("LoadingSpinner", () => {
  it("デフォルトのスピナーをレンダリングする", () => {
    render(<LoadingSpinner />);

    const spinner = screen.getByTestId("spinner");
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveAttribute("data-size", "lg"); // デフォルトはlg
    expect(spinner).toHaveAttribute("data-color", "primary");
    expect(screen.getByText("読み込み中...")).toBeInTheDocument();
  });

  it("カスタムメッセージでレンダリングする", () => {
    render(<LoadingSpinner message="データを読み込み中..." />);

    const spinner = screen.getByTestId("spinner");
    expect(spinner).toBeInTheDocument();
    expect(screen.getByText("データを読み込み中...")).toBeInTheDocument();
  });

  it("カスタムサイズでレンダリングする", () => {
    render(<LoadingSpinner size="sm" />);

    const spinner = screen.getByTestId("spinner");
    expect(spinner).toHaveAttribute("data-size", "sm");
  });

  it("フルスクリーンモードでレンダリングする", () => {
    const { container } = render(<LoadingSpinner variant="fullscreen" />);

    const fullscreenDiv = container.firstChild as HTMLElement;
    expect(fullscreenDiv).toHaveClass(
      "fixed",
      "inset-0",
      "backdrop-blur-sm",
      "z-50",
      "flex",
      "items-center",
      "justify-center",
    );
  });

  it("カードモードでレンダリングする", () => {
    render(<LoadingSpinner variant="card" />);

    const card = screen.getByTestId("card");
    expect(card).toBeInTheDocument();
    expect(card).toHaveClass("mx-auto max-w-sm");

    const cardBody = screen.getByTestId("card-body");
    expect(cardBody).toHaveClass("text-center py-12");
  });

  it("通常モードでは適切なクラスを持つ", () => {
    const { container } = render(<LoadingSpinner />);

    const outerDiv = container.firstChild as HTMLElement;
    expect(outerDiv).toHaveClass("flex", "justify-center", "py-8");
    expect(outerDiv).not.toHaveClass("fixed");
  });

  it("カスタムクラス名を適用する", () => {
    const { container } = render(<LoadingSpinner className="custom-class" />);

    const outerDiv = container.firstChild as HTMLElement;
    expect(outerDiv).toHaveClass("custom-class");
  });

  it("メッセージなしの場合は表示されない", () => {
    render(<LoadingSpinner message="" />);

    const spinner = screen.getByTestId("spinner");
    expect(spinner).toBeInTheDocument();
    expect(screen.queryByText("読み込み中...")).not.toBeInTheDocument();
  });

  it("サイズによってテキストサイズが変わる", () => {
    const { rerender } = render(<LoadingSpinner size="sm" message="小さい" />);

    let text = screen.getByText("小さい");
    expect(text).toHaveClass("text-xs");

    rerender(<LoadingSpinner size="md" message="中くらい" />);
    text = screen.getByText("中くらい");
    expect(text).toHaveClass("text-sm");

    rerender(<LoadingSpinner size="lg" message="大きい" />);
    text = screen.getByText("大きい");
    expect(text).toHaveClass("text-base");
  });
});
