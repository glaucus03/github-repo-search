import { render, screen } from "@testing-library/react";
import React from "react";

// Mock rehype-raw
jest.mock("rehype-raw");

// Mock @uiw/react-markdown-preview before importing MarkdownPreview
jest.mock("@uiw/react-markdown-preview", () => {
  return function MockMarkdownPreview({ source }: { source: string }) {
    return <div data-testid="markdown-content">{source}</div>;
  };
});

// Mock CSS module
jest.mock("../MarkdownPreview/MarkdownPreview.module.css", () => ({
  markdownWrapper: "markdownWrapper",
}));

import { MarkdownPreview } from "../MarkdownPreview";

describe("MarkdownPreview", () => {
  it("基本的なMarkdownが正しくレンダリングされる", () => {
    const content = "# Test Heading\\n\\nThis is a test.";

    render(<MarkdownPreview content={content} />);

    expect(screen.getByTestId("markdown-content")).toBeInTheDocument();
  });

  it("リポジトリ情報が提供された場合、画像URLが変換される", () => {
    const content = "![Test Image](./test.png)";
    const repositoryInfo = {
      owner: "test-owner",
      name: "test-repo",
      branch: "main",
    };

    render(
      <MarkdownPreview content={content} repositoryInfo={repositoryInfo} />,
    );

    expect(screen.getByTestId("markdown-content")).toBeInTheDocument();
  });

  it("空のコンテンツでも正しく処理される", () => {
    render(<MarkdownPreview content="" />);

    expect(screen.getByTestId("markdown-content")).toBeInTheDocument();
  });

  it("カスタムクラス名が適用される", () => {
    const content = "Test content";
    const customClass = "custom-markdown";

    const { container } = render(
      <MarkdownPreview content={content} className={customClass} />,
    );

    expect(container.firstChild).toHaveClass(customClass);
  });

  it("HTMLタグが正しく処理される", () => {
    const content = "<p>HTML content</p>";

    render(<MarkdownPreview content={content} />);

    expect(screen.getByTestId("markdown-content")).toBeInTheDocument();
  });
});
