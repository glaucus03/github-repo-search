import {
  validateSearchQuery,
  validateGitHubRepositoryUrl,
  validateGitHubUserUrl,
  validateEmail,
  validateUrl,
  validatePageNumber,
  validateSortOption,
  validateOrderOption,
  validatePerPage,
  validateFileName,
  FormValidator,
  required,
  minLength,
  maxLength,
  pattern,
} from "../validators";

// Mock constants
jest.mock("../constants", () => ({
  REGEX_PATTERNS: {
    GITHUB_REPO_URL:
      /^https:\/\/github\.com\/([a-zA-Z0-9\-._]+)\/([a-zA-Z0-9\-._]+)\/?$/,
    GITHUB_USER_URL: /^https:\/\/github\.com\/([a-zA-Z0-9\-._]+)\/?$/,
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    URL: /^https?:\/\/.+/,
  },
  SEARCH: {
    MIN_QUERY_LENGTH: 1,
    MAX_QUERY_LENGTH: 256,
  },
}));

describe("バリデーション関数", () => {
  describe("validateSearchQuery", () => {
    it("有効な検索クエリを受け入れる", () => {
      const result = validateSearchQuery("react");
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("空の文字列を拒否する", () => {
      const result = validateSearchQuery("");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("検索クエリを入力してください");
    });

    it("nullやundefinedを拒否する", () => {
      const result1 = validateSearchQuery(null as unknown as string);
      const result2 = validateSearchQuery(undefined as unknown as string);

      expect(result1.isValid).toBe(false);
      expect(result2.isValid).toBe(false);
    });

    it("文字列以外の型を拒否する", () => {
      const result = validateSearchQuery(123 as unknown as string);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("検索クエリを入力してください");
    });

    it("長すぎるクエリを拒否する", () => {
      const longQuery = "a".repeat(257);
      const result = validateSearchQuery(longQuery);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "検索クエリは256文字以下で入力してください",
      );
    });

    it("危険な文字を含むクエリを拒否する", () => {
      const result1 = validateSearchQuery('<script>alert("xss")</script>');
      const result2 = validateSearchQuery("test <script> test");

      expect(result1.isValid).toBe(false);
      expect(result2.isValid).toBe(false);
      expect(result1.errors).toContain("無効な文字が含まれています");
    });

    it("前後のスペースを除去してバリデーションする", () => {
      const result = validateSearchQuery("  react  ");
      expect(result.isValid).toBe(true);
    });
  });

  describe("validateGitHubRepositoryUrl", () => {
    it("有効なGitHubリポジトリURLを受け入れる", () => {
      const result = validateGitHubRepositoryUrl(
        "https://github.com/facebook/react",
      );
      expect(result.isValid).toBe(true);
      expect(result.owner).toBe("facebook");
      expect(result.repo).toBe("react");
    });

    it("末尾スラッシュ付きのURLを受け入れる", () => {
      const result = validateGitHubRepositoryUrl(
        "https://github.com/microsoft/vscode/",
      );
      expect(result.isValid).toBe(true);
      expect(result.owner).toBe("microsoft");
      expect(result.repo).toBe("vscode");
    });

    it("無効なURLを拒否する", () => {
      const result = validateGitHubRepositoryUrl(
        "https://gitlab.com/user/repo",
      );
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("有効なGitHubリポジトリURLを入力してください");
    });

    it("空の文字列を拒否する", () => {
      const result = validateGitHubRepositoryUrl("");
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("URLを入力してください");
    });

    it("特殊文字を含むユーザー名/リポジトリ名を受け入れる", () => {
      const result = validateGitHubRepositoryUrl(
        "https://github.com/user-name_123/repo.name-test",
      );
      expect(result.isValid).toBe(true);
    });
  });

  describe("validateGitHubUserUrl", () => {
    it("有効なGitHubユーザーURLを受け入れる", () => {
      const result = validateGitHubUserUrl("https://github.com/torvalds");
      expect(result.isValid).toBe(true);
      expect(result.username).toBe("torvalds");
    });

    it("末尾スラッシュ付きのURLを受け入れる", () => {
      const result = validateGitHubUserUrl("https://github.com/gaearon/");
      expect(result.isValid).toBe(true);
      expect(result.username).toBe("gaearon");
    });

    it("無効なURLを拒否する", () => {
      const result = validateGitHubUserUrl("https://github.com/user/repo");
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("有効なGitHubユーザーURLを入力してください");
    });
  });

  describe("validateEmail", () => {
    it("有効なメールアドレスを受け入れる", () => {
      const validEmails = [
        "test@example.com",
        "user.name@domain.co.jp",
        "test+tag@example.org",
      ];

      validEmails.forEach((email) => {
        const result = validateEmail(email);
        expect(result.isValid).toBe(true);
      });
    });

    it("無効なメールアドレスを拒否する", () => {
      const invalidEmails = [
        "invalid-email",
        "@domain.com",
        "user@",
        "user space@domain.com",
      ];

      invalidEmails.forEach((email) => {
        const result = validateEmail(email);
        expect(result.isValid).toBe(false);
        expect(result.error).toBe("有効なメールアドレスを入力してください");
      });
    });

    it("空の文字列を拒否する", () => {
      const result = validateEmail("");
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("メールアドレスを入力してください");
    });
  });

  describe("validateUrl", () => {
    it("有効なURLを受け入れる", () => {
      const validUrls = [
        "https://example.com",
        "http://test.org",
        "https://sub.domain.com/path?query=value",
      ];

      validUrls.forEach((url) => {
        const result = validateUrl(url);
        expect(result.isValid).toBe(true);
      });
    });

    it("無効なURLを拒否する", () => {
      const invalidUrls = [
        "not-a-url",
        "ftp://example.com",
        'javascript:alert("xss")',
      ];

      invalidUrls.forEach((url) => {
        const result = validateUrl(url);
        expect(result.isValid).toBe(false);
        expect(result.error).toBe("有効なURLを入力してください");
      });
    });

    it("正しいURLオブジェクトを作成できないURLを拒否する", () => {
      const result = validateUrl("http://");
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("有効なURLを入力してください");
    });
  });

  describe("validatePageNumber", () => {
    it("有効なページ番号（数値）を受け入れる", () => {
      const result = validatePageNumber(5);
      expect(result.isValid).toBe(true);
      expect(result.value).toBe(5);
    });

    it("有効なページ番号（文字列）を受け入れる", () => {
      const result = validatePageNumber("10");
      expect(result.isValid).toBe(true);
      expect(result.value).toBe(10);
    });

    it("0以下のページ番号を拒否する", () => {
      const result = validatePageNumber(0);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("ページ番号は1以上である必要があります");
    });

    it("34を超えるページ番号を拒否する", () => {
      const result = validatePageNumber(35);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("ページ番号が大きすぎます");
    });

    it("無効な文字列を拒否する", () => {
      const result = validatePageNumber("abc");
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("有効なページ番号を入力してください");
    });
  });

  describe("validateSortOption", () => {
    it("有効なソートオプションを受け入れる", () => {
      const validOptions = ["stars", "forks", "help-wanted-issues", "updated"];

      validOptions.forEach((option) => {
        const result = validateSortOption(option);
        expect(result.isValid).toBe(true);
      });
    });

    it("無効なソートオプションを拒否する", () => {
      const result = validateSortOption("invalid");
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("無効なソートオプションです");
    });
  });

  describe("validateOrderOption", () => {
    it("有効な順序オプションを受け入れる", () => {
      const validOptions = ["asc", "desc"];

      validOptions.forEach((option) => {
        const result = validateOrderOption(option);
        expect(result.isValid).toBe(true);
      });
    });

    it("無効な順序オプションを拒否する", () => {
      const result = validateOrderOption("invalid");
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("無効な順序オプションです");
    });
  });

  describe("validatePerPage", () => {
    it("有効なページサイズ（数値）を受け入れる", () => {
      const result = validatePerPage(30);
      expect(result.isValid).toBe(true);
      expect(result.value).toBe(30);
    });

    it("有効なページサイズ（文字列）を受け入れる", () => {
      const result = validatePerPage("50");
      expect(result.isValid).toBe(true);
      expect(result.value).toBe(50);
    });

    it("0以下のページサイズを拒否する", () => {
      const result = validatePerPage(0);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("ページサイズは1以上である必要があります");
    });

    it("100を超えるページサイズを拒否する", () => {
      const result = validatePerPage(101);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("ページサイズは100以下である必要があります");
    });
  });

  describe("validateFileName", () => {
    it("有効なファイル名を受け入れる", () => {
      const validNames = ["document.txt", "file_name.pdf", "test-file.json"];

      validNames.forEach((name) => {
        const result = validateFileName(name);
        expect(result.isValid).toBe(true);
      });
    });

    it("危険な文字を含むファイル名を拒否する", () => {
      const dangerousNames = [
        "file<test.txt",
        "file>test.txt",
        "file:test.txt",
      ];

      dangerousNames.forEach((name) => {
        const result = validateFileName(name);
        expect(result.isValid).toBe(false);
        expect(result.error).toBe(
          "ファイル名に使用できない文字が含まれています",
        );
      });
    });

    it("長すぎるファイル名を拒否する", () => {
      const longName = "a".repeat(256) + ".txt";
      const result = validateFileName(longName);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("ファイル名は255文字以下である必要があります");
    });

    it("Windowsの予約語を拒否する", () => {
      const reservedNames = ["CON", "PRN", "AUX", "com1", "lpt1"];

      reservedNames.forEach((name) => {
        const result = validateFileName(name);
        expect(result.isValid).toBe(false);
        expect(result.error).toBe("このファイル名は使用できません");
      });
    });
  });
});

describe("FormValidator", () => {
  let validator: FormValidator;

  beforeEach(() => {
    validator = new FormValidator();
  });

  describe("validate", () => {
    it("複数のルールでバリデーションを実行する", () => {
      validator.validate("username", "test", [required, minLength(5)]);

      expect(validator.isValid()).toBe(false);
      expect(validator.getFieldErrors("username")).toContain(
        "5文字以上で入力してください",
      );
    });

    it("すべてのルールが通る場合は有効とする", () => {
      validator.validate("username", "testuser", [
        required,
        minLength(5),
        maxLength(20),
      ]);

      expect(validator.isValid()).toBe(true);
      expect(validator.getFieldErrors("username")).toEqual([]);
    });
  });

  describe("isValid", () => {
    it("エラーがない場合はtrueを返す", () => {
      validator.validate("field1", "value", [required]);
      expect(validator.isValid()).toBe(true);
    });

    it("エラーがある場合はfalseを返す", () => {
      validator.validate("field1", "", [required]);
      expect(validator.isValid()).toBe(false);
    });
  });

  describe("getErrors", () => {
    it("すべてのエラーを返す", () => {
      validator.validate("field1", "", [required]);
      validator.validate("field2", "a", [minLength(5)]);

      const errors = validator.getErrors();
      expect(errors.field1).toContain("この項目は必須です");
      expect(errors.field2).toContain("5文字以上で入力してください");
    });
  });

  describe("getFieldErrors", () => {
    it("特定のフィールドのエラーを返す", () => {
      validator.validate("username", "", [required]);

      const errors = validator.getFieldErrors("username");
      expect(errors).toContain("この項目は必須です");
    });

    it("存在しないフィールドの場合は空配列を返す", () => {
      const errors = validator.getFieldErrors("nonexistent");
      expect(errors).toEqual([]);
    });
  });

  describe("clear", () => {
    it("すべてのエラーをクリアする", () => {
      validator.validate("field1", "", [required]);
      expect(validator.isValid()).toBe(false);

      validator.clear();
      expect(validator.isValid()).toBe(true);
      expect(validator.getErrors()).toEqual({});
    });
  });
});

describe("バリデーションルール", () => {
  describe("required", () => {
    it("値がある場合は有効とする", () => {
      const result = required.validate("test");
      expect(result.isValid).toBe(true);
    });

    it("null、undefined、空文字列を無効とする", () => {
      const invalidValues = [null, undefined, ""];

      invalidValues.forEach((value) => {
        const result = required.validate(value);
        expect(result.isValid).toBe(false);
        expect(result.error).toBe("この項目は必須です");
      });
    });
  });

  describe("minLength", () => {
    it("最小長以上の文字列を有効とする", () => {
      const rule = minLength(5);
      const result = rule.validate("12345");
      expect(result.isValid).toBe(true);
    });

    it("最小長未満の文字列を無効とする", () => {
      const rule = minLength(5);
      const result = rule.validate("123");
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("5文字以上で入力してください");
    });

    it("文字列以外の型を無効とする", () => {
      const rule = minLength(5);
      const result = rule.validate(123);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("文字列である必要があります");
    });
  });

  describe("maxLength", () => {
    it("最大長以下の文字列を有効とする", () => {
      const rule = maxLength(10);
      const result = rule.validate("12345");
      expect(result.isValid).toBe(true);
    });

    it("最大長を超える文字列を無効とする", () => {
      const rule = maxLength(5);
      const result = rule.validate("123456");
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("5文字以下で入力してください");
    });
  });

  describe("pattern", () => {
    it("パターンにマッチする文字列を有効とする", () => {
      const rule = pattern(/^\d+$/, "数字のみ入力してください");
      const result = rule.validate("123");
      expect(result.isValid).toBe(true);
    });

    it("パターンにマッチしない文字列を無効とする", () => {
      const rule = pattern(/^\d+$/, "数字のみ入力してください");
      const result = rule.validate("abc");
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("数字のみ入力してください");
    });
  });
});
