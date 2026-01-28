import { CookieJar } from "tough-cookie";
import {
  type RequestInit as UndiciRequestInit,
  fetch as undiciFetch,
} from "undici";

export interface RequestOptions extends Omit<UndiciRequestInit, "dispatcher"> {
  timeout?: number;
}

export class HttpSession {
  readonly jar: CookieJar;
  readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.jar = new CookieJar();
  }

  async request(path: string, options: RequestOptions = {}): Promise<Response> {
    const { timeout = 10000, ...init } = options;
    let url = new URL(path, this.baseUrl);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      // Manually follow redirects to preserve cookies from intermediate responses
      let redirectCount = 0;
      const maxRedirects = 10;

      while (redirectCount < maxRedirects) {
        // Get cookies for this URL
        const cookieString = await this.jar.getCookieString(url.toString());

        const headers = {
          Accept: "*/*",
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36",
          "Cache-Control": "no-cache",
          ...(cookieString ? { Cookie: cookieString } : {}),
          ...init.headers,
        };

        const response = await undiciFetch(url, {
          ...init,
          headers,
          signal: controller.signal,
          redirect: "manual", // Don't follow redirects automatically
        });

        // Store cookies from response BEFORE following redirect
        const setCookieHeaders = response.headers.getSetCookie();
        for (const setCookie of setCookieHeaders) {
          await this.jar.setCookie(setCookie, url.toString());
        }

        // Check if it's a redirect
        if (response.status >= 300 && response.status < 400) {
          const location = response.headers.get("location");
          if (!location) {
            return response;
          }

          // Resolve relative URL against current URL
          url = new URL(location, url);
          redirectCount++;

          // For 302/303, switch to GET method
          if (response.status === 302 || response.status === 303) {
            init.method = "GET";
            init.body = undefined;
          }

          continue;
        }

        return response;
      }

      throw new Error("Too many redirects");
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async getCookie(name: string): Promise<string | undefined> {
    const cookies = await this.jar.getCookies(this.baseUrl);
    return cookies.find((c) => c.key === name)?.value;
  }

  async getCookieString(): Promise<string> {
    return await this.jar.getCookieString(this.baseUrl);
  }

  async setCookie(name: string, value: string): Promise<void> {
    const url = new URL(this.baseUrl);
    await this.jar.setCookie(
      `${name}=${value}; Domain=${url.hostname}; Path=/`,
      this.baseUrl,
    );
  }
}
