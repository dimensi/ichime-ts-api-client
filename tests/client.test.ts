import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiClient } from "../src/client.js";
import { ApiClientError } from "../src/types/errors.js";

describe("ApiClient", () => {
  let client: ApiClient;
  let originalFetch: typeof fetch;

  beforeEach(() => {
    client = new ApiClient();
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe("initialization", () => {
    it("should create client with default baseURL", () => {
      const defaultClient = new ApiClient();
      expect(defaultClient).toBeInstanceOf(ApiClient);
    });

    it("should create client with custom baseURL", () => {
      const customClient = new ApiClient({
        baseURL: "https://custom.example.com",
      });
      expect(customClient).toBeInstanceOf(ApiClient);
    });

    it("should create client with custom timeout", () => {
      const customClient = new ApiClient({
        timeout: 5000,
      });
      expect(customClient).toBeInstanceOf(ApiClient);
    });
  });

  describe("listSeries", () => {
    it("should return series list", async () => {
      const mockSeries = [
        {
          id: 1,
          title: "Test Series",
          titles: { ru: "Тест", romaji: "Test" },
          posterUrl: null,
          myAnimeListScore: "8.5",
          season: "2024",
          type: "tv" as const,
          year: 2024,
        },
      ];

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockSeries }),
      } as Response);

      const result = await client.listSeries();

      expect(result).toEqual(mockSeries);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/series"),
        expect.any(Object)
      );
    });

    it("should handle API error response", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          error: { code: 404, message: "Not found" },
        }),
      } as Response);

      await expect(client.listSeries()).rejects.toThrow(ApiClientError);
      await expect(client.listSeries()).rejects.toThrow("Not found");
    });

    it("should handle HTTP error status", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      } as Response);

      await expect(client.listSeries()).rejects.toThrow(ApiClientError);
    });

    it("should pass query parameters", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: [] }),
      } as Response);

      await client.listSeries({ query: "naruto", limit: 10, offset: 0 });

      const fetchCall = vi.mocked(global.fetch).mock.calls[0];
      const url = fetchCall[0] as string;
      expect(url).toContain("query=naruto");
      expect(url).toContain("limit=10");
      expect(url).toContain("offset=0");
    });
  });
});
