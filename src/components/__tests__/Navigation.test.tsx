import { render, screen, fireEvent } from "@testing-library/react";
import { useRouter } from "next/navigation";
import React from "react";

import { Navigation } from "../Navigation";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

// Mock stores
const mockUseSearchStore = {
  resetSearch: jest.fn(),
};

const mockUseUIStore = {
  resetToInitialState: jest.fn(),
};

jest.mock("@/store/searchStore", () => ({
  useSearchStore: () => mockUseSearchStore,
}));

jest.mock("@/store/uiStore", () => ({
  useUIStore: () => mockUseUIStore,
}));

describe("Navigation", () => {
  const mockPush = jest.fn();
  const mockRouter = {
    push: mockPush,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  it("正しくレンダリングされる", () => {
    render(<Navigation />);

    expect(
      screen.getByRole("button", { name: /ホームに戻る/ }),
    ).toBeInTheDocument();
  });

  it("アイコンクリックで初期状態にリセットされる", () => {
    render(<Navigation />);

    const homeButton = screen.getByRole("button", { name: /ホームに戻る/ });
    fireEvent.click(homeButton);

    expect(mockUseSearchStore.resetSearch).toHaveBeenCalled();
    expect(mockUseUIStore.resetToInitialState).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith("/");
  });

  it("カスタムイベントが発行される", () => {
    render(<Navigation />);

    const mockDispatchEvent = jest.spyOn(window, "dispatchEvent");
    const homeButton = screen.getByRole("button", { name: /ホームに戻る/ });

    fireEvent.click(homeButton);

    expect(mockDispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "resetToInitialState",
      }),
    );

    mockDispatchEvent.mockRestore();
  });
});
