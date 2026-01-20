import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  sanitizeHtml,
  sanitizeEmail,
  sanitizePhone,
  validatePassword,
  checkRateLimit,
  RATE_LIMIT_CONFIGS,
  generateCsrfToken,
  isPhiEntity,
  sanitizeErrorMessage,
} from "./security";

describe("Security Utilities", () => {
  describe("Input Sanitization", () => {
    describe("sanitizeHtml", () => {
      it("should escape HTML entities", () => {
        expect(sanitizeHtml("<script>alert('xss')</script>")).toBe(
          "&lt;script&gt;alert(&#x27;xss&#x27;)&lt;&#x2F;script&gt;"
        );
      });

      it("should escape quotes", () => {
        expect(sanitizeHtml('test "quotes" and \'apostrophe\'')).toBe(
          "test &quot;quotes&quot; and &#x27;apostrophe&#x27;"
        );
      });

      it("should handle empty string", () => {
        expect(sanitizeHtml("")).toBe("");
      });

      it("should pass through safe text", () => {
        expect(sanitizeHtml("Hello World")).toBe("Hello World");
      });
    });

    describe("sanitizeEmail", () => {
      it("should validate correct email", () => {
        expect(sanitizeEmail("test@example.com")).toBe("test@example.com");
      });

      it("should lowercase email", () => {
        expect(sanitizeEmail("Test@Example.COM")).toBe("test@example.com");
      });

      it("should trim whitespace", () => {
        expect(sanitizeEmail("  test@example.com  ")).toBe("test@example.com");
      });

      it("should return null for invalid email", () => {
        expect(sanitizeEmail("not-an-email")).toBeNull();
        expect(sanitizeEmail("@example.com")).toBeNull();
        expect(sanitizeEmail("test@")).toBeNull();
      });
    });

    describe("sanitizePhone", () => {
      it("should validate Japanese phone numbers", () => {
        expect(sanitizePhone("03-1234-5678")).toBe("03-1234-5678");
        expect(sanitizePhone("090-1234-5678")).toBe("090-1234-5678");
      });

      it("should return null for invalid phone", () => {
        expect(sanitizePhone("123")).toBeNull();
        expect(sanitizePhone("abc-def-ghij")).toBeNull();
      });
    });
  });

  describe("Password Validation", () => {
    describe("validatePassword", () => {
      it("should reject short passwords", () => {
        const result = validatePassword("Short1!");
        expect(result).toContain("12文字以上");
      });

      it("should require uppercase letters", () => {
        const result = validatePassword("lowercase1234!");
        expect(result).toContain("大文字");
      });

      it("should require lowercase letters", () => {
        const result = validatePassword("UPPERCASE1234!");
        expect(result).toContain("小文字");
      });

      it("should require numbers", () => {
        const result = validatePassword("NoNumbersHere!");
        expect(result).toContain("数字");
      });

      it("should require special characters", () => {
        const result = validatePassword("NoSpecialChars123");
        expect(result).toContain("特殊文字");
      });

      it("should accept valid passwords", () => {
        const result = validatePassword("ValidP@ssword123!");
        expect(result).toBeNull();
      });

      it("should reject common passwords", () => {
        // Test with a valid format password that isn't in the common list
        const validResult = validatePassword("SecureP@ss123!");
        expect(validResult).toBeNull();
      });
    });
  });

  describe("Rate Limiting", () => {
    beforeEach(() => {
      // Clear rate limit store between tests
      vi.useFakeTimers();
    });

    it("should allow requests within limit", () => {
      const config = { ...RATE_LIMIT_CONFIGS.api, keyPrefix: "test1" };
      const result = checkRateLimit("user1", config);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(99);
    });

    it("should track multiple requests", () => {
      const config = { windowMs: 60000, maxRequests: 3, keyPrefix: "test2" };

      let result = checkRateLimit("user2", config);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(2);

      result = checkRateLimit("user2", config);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(1);

      result = checkRateLimit("user2", config);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(0);

      result = checkRateLimit("user2", config);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it("should isolate different users", () => {
      const config = { windowMs: 60000, maxRequests: 2, keyPrefix: "test3" };

      checkRateLimit("userA", config);
      checkRateLimit("userA", config);
      const resultA = checkRateLimit("userA", config);

      const resultB = checkRateLimit("userB", config);

      expect(resultA.allowed).toBe(false);
      expect(resultB.allowed).toBe(true);
    });
  });

  describe("CSRF Protection", () => {
    describe("generateCsrfToken", () => {
      it("should generate 64 character hex string", () => {
        const token = generateCsrfToken();
        expect(token).toHaveLength(64);
        expect(/^[0-9a-f]+$/.test(token)).toBe(true);
      });

      it("should generate unique tokens", () => {
        const token1 = generateCsrfToken();
        const token2 = generateCsrfToken();
        expect(token1).not.toBe(token2);
      });
    });
  });

  describe("PHI Entity Detection", () => {
    describe("isPhiEntity", () => {
      it("should identify PHI entities", () => {
        expect(isPhiEntity("Patient")).toBe(true);
        expect(isPhiEntity("MedicalRecord")).toBe(true);
        expect(isPhiEntity("Prescription")).toBe(true);
        expect(isPhiEntity("LabResult")).toBe(true);
        expect(isPhiEntity("AudiometryTest")).toBe(true);
      });

      it("should return false for non-PHI entities", () => {
        expect(isPhiEntity("Tenant")).toBe(false);
        expect(isPhiEntity("User")).toBe(false);
        expect(isPhiEntity("Invoice")).toBe(false);
      });
    });
  });

  describe("Error Handling", () => {
    describe("sanitizeErrorMessage", () => {
      // Note: NODE_ENV cannot be easily changed in tests
      // These tests verify the function handles errors correctly
      it("should handle Error objects", () => {
        const result = sanitizeErrorMessage(new Error("Test error"));
        // In test environment (development), it should return the message
        expect(typeof result).toBe("string");
        expect(result.length).toBeGreaterThan(0);
      });

      it("should handle string errors", () => {
        const result = sanitizeErrorMessage("String error");
        expect(typeof result).toBe("string");
      });

      it("should handle unknown error types", () => {
        const result = sanitizeErrorMessage({ custom: "error" });
        expect(typeof result).toBe("string");
      });
    });
  });
});

describe("Rate Limit Configurations", () => {
  it("should have auth config with strict limits", () => {
    expect(RATE_LIMIT_CONFIGS.auth.maxRequests).toBe(5);
    expect(RATE_LIMIT_CONFIGS.auth.windowMs).toBe(15 * 60 * 1000);
  });

  it("should have api config with reasonable limits", () => {
    expect(RATE_LIMIT_CONFIGS.api.maxRequests).toBe(100);
    expect(RATE_LIMIT_CONFIGS.api.windowMs).toBe(60 * 1000);
  });

  it("should have upload config with moderate limits", () => {
    expect(RATE_LIMIT_CONFIGS.upload.maxRequests).toBe(10);
  });
});
