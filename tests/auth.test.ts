import { describe, expect, it } from "vitest";
import { HttpSession, WebClient } from "../src/index.js";

const BASE_URL = process.env.ANIME365_BASE_URL || "https://smotret-anime.org";
const USERNAME = process.env.ANIME365_USERNAME as string | undefined;
const PASSWORD = process.env.ANIME365_PASSWORD as string | undefined;

function getCredentials(): { username: string; password: string } {
  if (!USERNAME || !PASSWORD) {
    throw new Error("Credentials not set");
  }
  return { username: USERNAME, password: PASSWORD };
}

describe("WebClient Authentication", () => {
  it("should fail login with invalid credentials", async () => {
    const session = new HttpSession(BASE_URL);
    const webClient = new WebClient(session);

    await expect(webClient.login("invalid@example.com", "wrongpassword")).rejects.toThrow(
      "Invalid credentials"
    );
  });

  it.skipIf(!USERNAME || !PASSWORD)(
    "should successfully login with valid credentials",
    async () => {
      const { username, password } = getCredentials();
      const session = new HttpSession(BASE_URL);
      const webClient = new WebClient(session);

      // Login should not throw
      await expect(webClient.login(username, password)).resolves.toBeUndefined();

      // After login, getProfile should work
      const profile = await webClient.getProfile();

      expect(profile).toBeDefined();
      expect(profile.id).toBeGreaterThan(0);
      expect(profile.name).toBeTruthy();
      expect(profile.avatarUrl).toBeTruthy();

      console.log("Logged in as:", profile.name, `(ID: ${profile.id})`);
    }
  );

  it.skipIf(!USERNAME || !PASSWORD)(
    "should persist cookies across requests after login",
    async () => {
      const { username, password } = getCredentials();
      const session = new HttpSession(BASE_URL);
      const webClient = new WebClient(session);

      // Login
      await webClient.login(username, password);

      // Multiple requests should work with the same session
      const profile1 = await webClient.getProfile();
      const profile2 = await webClient.getProfile();

      expect(profile1.id).toBe(profile2.id);
    }
  );

  it("should throw authenticationRequired when accessing profile without login", async () => {
    const session = new HttpSession(BASE_URL);
    const webClient = new WebClient(session);

    await expect(webClient.getProfile()).rejects.toThrow("Authentication required");
  });

  it.skipIf(!USERNAME || !PASSWORD)("should get personal episodes after login", async () => {
    const { username, password } = getCredentials();
    const session = new HttpSession(BASE_URL);
    const webClient = new WebClient(session);

    await webClient.login(username, password);

    const episodes = await webClient.getPersonalEpisodes(1);

    // Episodes array should exist (may be empty if user has no episodes)
    expect(Array.isArray(episodes)).toBe(true);

    if (episodes.length > 0) {
      const episode = episodes[0];
      expect(episode.seriesId).toBeGreaterThan(0);
      expect(episode.episodeId).toBeGreaterThan(0);
      expect(episode.seriesTitleRu).toBeTruthy();
      console.log(`Found ${episodes.length} personal episodes`);
    }
  });
});
