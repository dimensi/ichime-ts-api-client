import * as cheerio from "cheerio";
import type { Element } from "domhandler";
import type { HttpSession } from "../http-session.js";
import { WebClientError } from "./errors.js";
import { extractIdentifiersFromUrl, parseDurationString, parseWebDate } from "./helpers.js";
import type {
  AnimeListCategory,
  AnimeListEditableEntry,
  AnimeListEntry,
  MomentDetails,
  MomentEmbed,
  MomentPreview,
  MomentSorting,
  NewPersonalEpisode,
  NewRecentEpisode,
  Profile,
  VideoSource,
} from "./types/index.js";
import { AnimeListCategoryWebPath, animeListEntryStatusFromNumericId } from "./types/index.js";

const COOKIE_NAME_CSRF = "csrf";
const FORM_DATA_FIELD_CSRF = "csrf";

export interface WebClientConfig {
  debug?: boolean;
}

export class WebClient {
  private readonly debug: boolean;

  constructor(
    private readonly session: HttpSession,
    config: WebClientConfig = {}
  ) {
    this.debug = config.debug ?? false;
  }

  get baseUrl(): string {
    return this.session.baseUrl;
  }

  async sendRequest(path: string, queryItems: Record<string, string> = {}): Promise<string> {
    const url = new URL(path, this.session.baseUrl);

    // Сортируем параметры по имени (как в Swift)
    const sortedParams = Object.entries(queryItems).sort(([a], [b]) => a.localeCompare(b));
    for (const [key, value] of sortedParams) {
      url.searchParams.set(key, value);
    }

    let response: Response;
    try {
      response = await this.session.request(url.pathname + url.search, {
        method: "GET",
      });
    } catch (error) {
      if (this.debug) {
        console.debug(`[WebClient] Request failed: GET ${url.toString()}`, error);
      }
      throw WebClientError.unknownError(error instanceof Error ? error : new Error(String(error)));
    }

    if (this.debug) {
      console.debug(`[WebClient] Web request: GET ${url.toString()} [${response.status}]`);
    }

    if (response.status >= 400) {
      if (this.debug) {
        console.debug(`[WebClient] Bad status code: ${response.status}`);
      }
      throw WebClientError.badStatusCode(response.status);
    }

    let html: string;
    try {
      html = await response.text();
    } catch (error) {
      if (this.debug) {
        console.debug(`[WebClient] Could not convert response data to string`, error);
      }
      throw WebClientError.couldNotConvertResponseDataToString();
    }

    return html;
  }

  async sendPostRequest(
    path: string,
    queryItems: Record<string, string> = {},
    formData: Record<string, string> = {}
  ): Promise<string> {
    const url = new URL(path, this.session.baseUrl);

    // Сортируем параметры по имени
    const sortedParams = Object.entries(queryItems).sort(([a], [b]) => a.localeCompare(b));
    for (const [key, value] of sortedParams) {
      url.searchParams.set(key, value);
    }

    // Получаем или создаем CSRF токен
    let csrfToken = await this.session.getCookie(COOKIE_NAME_CSRF);
    if (!csrfToken) {
      csrfToken = crypto.randomUUID();
      await this.session.setCookie(COOKIE_NAME_CSRF, csrfToken);
    }

    // Добавляем CSRF токен в form data
    const formDataWithCsrf = {
      ...formData,
      [FORM_DATA_FIELD_CSRF]: csrfToken,
    };

    // Формируем body как URL-encoded
    const body = new URLSearchParams(formDataWithCsrf).toString();

    let response: Response;
    try {
      response = await this.session.request(url.pathname + url.search, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
      });
    } catch (error) {
      if (this.debug) {
        console.debug(`[WebClient] Request failed: POST ${url.toString()}`, error);
      }
      throw WebClientError.unknownError(error instanceof Error ? error : new Error(String(error)));
    }

    if (this.debug) {
      console.debug(`[WebClient] Web request: POST ${url.toString()} [${response.status}]`);
    }

    if (response.status >= 400) {
      if (this.debug) {
        console.debug(`[WebClient] Bad status code: ${response.status}`);
        console.debug(`[WebClient] Form data: ${JSON.stringify(formDataWithCsrf)}`);
      }
      throw WebClientError.badStatusCode(response.status);
    }

    let html: string;
    try {
      html = await response.text();
    } catch (error) {
      if (this.debug) {
        console.debug(`[WebClient] Could not convert response data to string`, error);
      }
      throw WebClientError.couldNotConvertResponseDataToString();
    }

    return html;
  }

  parseHtml(html: string): cheerio.CheerioAPI {
    return cheerio.load(html);
  }

  // === Login ===

  async login(username: string, password: string): Promise<void> {
    const html = await this.sendPostRequest(
      "/users/login",
      {},
      {
        "LoginForm[username]": username,
        "LoginForm[password]": password,
        dynpage: "1",
        yt0: "",
      }
    );

    if (html.includes("Неверный E-mail или пароль.") || html.includes("Вход по паролю")) {
      throw new WebClientError("Invalid credentials");
    }
  }

  // === Profile ===

  async getProfile(): Promise<Profile> {
    const html = await this.sendRequest("/users/profile", { dynpage: "1" });

    if (html.includes("Вход по паролю")) {
      throw WebClientError.authenticationRequired();
    }

    const $ = this.parseHtml(html);

    // Извлекаем ID аккаунта
    const accountIdMatch = html.match(/ID аккаунта: (\d+)/);
    if (!accountIdMatch) {
      throw WebClientError.couldNotParseHtml();
    }
    const id = Number.parseInt(accountIdMatch[1], 10);

    // Извлекаем имя
    const name = $("content .m-small-title").first().text().trim();
    if (!name) {
      throw WebClientError.couldNotParseHtml();
    }

    // Извлекаем аватар
    const avatarSrc = $("content .card-image.hide-on-small-and-down img").first().attr("src");
    if (!avatarSrc) {
      throw WebClientError.couldNotParseHtml();
    }
    const avatarUrl = new URL(avatarSrc, this.baseUrl).toString();

    return { id, name, avatarUrl };
  }

  // === Personal Episodes ===

  async getPersonalEpisodes(page: number): Promise<NewPersonalEpisode[]> {
    const queryItems: Record<string, string> = {
      ajax: "m-index-personal-episodes",
    };

    if (page > 1) {
      queryItems.pageP = String(page);
    }

    const html = await this.sendRequest("/", queryItems);

    if (html.includes("Вход или регистрация") || html.includes("Вход - Anime 365")) {
      throw WebClientError.authenticationRequired();
    }

    const $ = this.parseHtml(html);
    const episodes: NewPersonalEpisode[] = [];

    $("#m-index-personal-episodes div.m-new-episode").each((_, element) => {
      try {
        const episode = this.parsePersonalEpisode($, element);
        if (episode) {
          episodes.push(episode);
        }
      } catch {
        // Skip invalid episodes
      }
    });

    return episodes;
  }

  private parsePersonalEpisode($: cheerio.CheerioAPI, element: Element): NewPersonalEpisode | null {
    const $el = $(element);

    // Извлекаем URL эпизода
    const episodeHref = $el.find("a[href]").first().attr("href");
    if (!episodeHref) {
      return null;
    }

    const episodeUrl = new URL(episodeHref, this.baseUrl);
    const { seriesId, episodeId } = extractIdentifiersFromUrl(episodeUrl);

    if (seriesId === null || episodeId === null) {
      return null;
    }

    // Извлекаем постер
    const styleAttr = $el.find("div.circle[style]").first().attr("style") || "";
    const posterMatch = styleAttr.match(/background-image: ?url\('(.+?)'\)/);
    if (!posterMatch) {
      return null;
    }
    const seriesPosterUrl = new URL(
      posterMatch[1].replace(".140x140.1", ""),
      this.baseUrl
    ).toString();

    // Извлекаем названия
    const seriesTitleRu = $el.find("h5.line-1 a").first().text().trim();
    const seriesTitleRomaji = $el.find("h6.line-2 a").first().text().trim();

    if (!seriesTitleRu || !seriesTitleRomaji) {
      return null;
    }

    // Извлекаем номер эпизода
    const episodeNumberLabel = $el.find("span.online-h").first().text().trim();
    if (!episodeNumberLabel) {
      return null;
    }

    // Извлекаем тип обновления
    const titleText = $el.find("span.title").first().text();
    const updateTypeMatch = titleText.match(/\((.+?)\)/);
    if (!updateTypeMatch) {
      return null;
    }
    const episodeUpdateType = updateTypeMatch[1].trim();

    return {
      seriesId,
      seriesPosterUrl,
      seriesTitleRu,
      seriesTitleRomaji,
      episodeId,
      episodeNumberLabel,
      episodeUpdateType,
    };
  }

  // === Recent Episodes ===

  async getRecentEpisodes(page: number): Promise<NewRecentEpisode[]> {
    const html = await this.sendRequest(`/page/${page}`, {
      ajax: "m-index-recent-episodes",
    });

    if (html.includes("Вход или регистрация") || html.includes("Вход - Anime 365")) {
      throw WebClientError.authenticationRequired();
    }

    const $ = this.parseHtml(html);
    const episodes: NewRecentEpisode[] = [];

    $("#m-index-recent-episodes .m-new-episodes.collection.with-header").each(
      (_, sectionElement) => {
        const $section = $(sectionElement);
        const sectionHeader = $section.find("h3").text().trim();

        if (!sectionHeader) {
          return;
        }

        $section.find("div.m-new-episode").each((_, episodeElement) => {
          try {
            const episode = this.parseRecentEpisode($, episodeElement, sectionHeader);
            if (episode) {
              episodes.push(episode);
            }
          } catch {
            // Skip invalid episodes
          }
        });
      }
    );

    return episodes;
  }

  private parseRecentEpisode(
    $: cheerio.CheerioAPI,
    element: Element,
    sectionTitle: string
  ): NewRecentEpisode | null {
    const $el = $(element);

    // Извлекаем URL эпизода
    const episodeHref = $el.find("a[href]").first().attr("href");
    if (!episodeHref) {
      return null;
    }

    const episodeUrl = new URL(episodeHref, this.baseUrl);
    const { seriesId, episodeId } = extractIdentifiersFromUrl(episodeUrl);

    if (seriesId === null || episodeId === null) {
      return null;
    }

    // Извлекаем постер
    const styleAttr = $el.find("div.circle[style]").first().attr("style") || "";
    const posterMatch = styleAttr.match(/background-image: ?url\('(.+?)'\)/);
    if (!posterMatch) {
      return null;
    }
    const seriesPosterUrl = new URL(
      posterMatch[1].replace(".140x140.1", ""),
      this.baseUrl
    ).toString();

    // Извлекаем названия
    const seriesTitleRu = $el.find("h5.line-1 a").first().text().trim();
    const seriesTitleRomaji = $el.find("h6.line-2 a").first().text().trim();

    if (!seriesTitleRu || !seriesTitleRomaji) {
      return null;
    }

    // Извлекаем номер эпизода
    const episodeNumberLabel = $el.find("span.online-h").first().text().trim();
    if (!episodeNumberLabel) {
      return null;
    }

    // Извлекаем время загрузки
    const titleText = $el.find("span.title").first().text();
    const timeMatch = titleText.match(/в (\d{2}:\d{2})/);
    if (!timeMatch) {
      return null;
    }

    // Парсим дату из заголовка секции
    const dateString = sectionTitle.replace("Новые серии ", "");
    const episodeUploadedAt = parseWebDate(`${dateString} ${timeMatch[1]}`);

    if (!episodeUploadedAt) {
      return null;
    }

    return {
      seriesId,
      seriesPosterUrl,
      seriesTitleRu,
      seriesTitleRomaji,
      episodeId,
      episodeNumberLabel,
      episodeUploadedAt,
    };
  }

  // === Anime List ===

  async getAnimeList(userId: number, category: AnimeListCategory): Promise<AnimeListEntry[]> {
    const html = await this.sendRequest(
      `/users/${userId}/list/${AnimeListCategoryWebPath[category]}`,
      {
        dynpage: "1",
      }
    );

    if (html.includes("Вход или регистрация") || html.includes("Вход - Anime 365")) {
      throw WebClientError.authenticationRequired();
    }

    const $ = this.parseHtml(html);
    const entries: AnimeListEntry[] = [];

    $("div.card.m-animelist-card tr.m-animelist-item").each((_, element) => {
      try {
        const entry = this.parseAnimeListEntry($, element);
        if (entry) {
          entries.push(entry);
        }
      } catch {
        // Skip invalid entries
      }
    });

    return entries;
  }

  private parseAnimeListEntry($: cheerio.CheerioAPI, element: Element): AnimeListEntry | null {
    const $el = $(element);

    const seriesIdStr = $el.attr("data-id");
    if (!seriesIdStr) {
      return null;
    }
    const seriesId = Number.parseInt(seriesIdStr, 10);

    const seriesTitleFull = $el.find("a[href]").first().text().trim();
    if (!seriesTitleFull) {
      return null;
    }

    const episodesString = $el.find('td[data-name="episodes"]').first().text().trim();
    const episodesParts = episodesString.split(" / ");
    if (episodesParts.length !== 2) {
      return null;
    }

    const episodesWatched = Number.parseInt(episodesParts[0], 10);
    if (Number.isNaN(episodesWatched)) {
      return null;
    }

    const episodesTotal = Number.parseInt(episodesParts[1], 10);

    const scoreString = $el.find('td[data-name="score"]').first().text().trim();
    const score = scoreString ? Number.parseInt(scoreString, 10) : null;

    return {
      seriesId,
      seriesTitleFull,
      episodesWatched,
      episodesTotal: Number.isNaN(episodesTotal) ? null : episodesTotal,
      score: score && !Number.isNaN(score) ? score : null,
    };
  }

  async getAnimeListEditableEntry(seriesId: number): Promise<AnimeListEditableEntry> {
    const html = await this.sendRequest(`/animelist/edit/${seriesId}`, {
      mode: "mini",
    });

    if (html.includes("Вход или регистрация") || html.includes("Вход - Anime 365")) {
      throw WebClientError.authenticationRequired();
    }

    if (html.includes("Добавить в список")) {
      return {
        episodesWatched: 0,
        status: "notInList",
        score: null,
        commentary: null,
      };
    }

    const $ = this.parseHtml(html);

    const episodesWatchedStr = $("input#UsersRates_episodes").first().attr("value");
    if (!episodesWatchedStr) {
      throw WebClientError.couldNotParseHtml();
    }
    const episodesWatched = Number.parseInt(episodesWatchedStr, 10);

    const statusStr = $("select#UsersRates_status option[selected]").first().attr("value");
    if (!statusStr) {
      throw WebClientError.couldNotParseHtml();
    }
    const statusInt = Number.parseInt(statusStr, 10);
    const status = animeListEntryStatusFromNumericId(statusInt);
    if (!status) {
      throw WebClientError.couldNotParseHtml();
    }

    const scoreStr = $("#UsersRates_score option[selected]").first().attr("value");
    const scoreInt = scoreStr ? Number.parseInt(scoreStr, 10) : 0;
    const score = scoreInt > 0 ? scoreInt : null;

    const commentary = $("#UsersRates_comment").first().text() || null;

    return {
      episodesWatched,
      status,
      score,
      commentary,
    };
  }

  async editAnimeListEntry(
    seriesId: number,
    score: number,
    episodes: number,
    status: number,
    comment: string
  ): Promise<void> {
    await this.sendPostRequest(
      `/animelist/edit/${seriesId}`,
      { mode: "mini" },
      {
        "UsersRates[score]": String(score),
        "UsersRates[episodes]": String(episodes),
        "UsersRates[status]": String(status),
        "UsersRates[comment]": comment,
      }
    );
  }

  // === Mark Episode ===

  async markEpisodeAsWatched(translationId: number): Promise<void> {
    await this.sendPostRequest(`/translations/watched/${translationId}`, {}, {});
  }

  // === Moments ===

  async getMoments(page: number, sort?: MomentSorting): Promise<MomentPreview[]> {
    const queryItems: Record<string, string> = {};

    if (page === 1) {
      queryItems.dynpage = "1";
    } else {
      queryItems.ajaxPage = "yw_moments_all";
      queryItems.ajaxPageMode = "more";
      queryItems["moments-page"] = String(page);
    }

    if (sort) {
      queryItems["MomentsFilter[sort]"] = sort;
    }

    const html = await this.sendRequest("/moments/index", queryItems);

    if (html.includes("Вход или регистрация") || html.includes("Вход - Anime 365")) {
      throw WebClientError.authenticationRequired();
    }

    const $ = this.parseHtml(html);
    const moments: MomentPreview[] = [];

    $("#yw_moments_all div.m-moment").each((_, element) => {
      try {
        const moment = this.parseMomentPreview($, element);
        if (moment) {
          moments.push(moment);
        }
      } catch {
        // Skip invalid moments
      }
    });

    return moments;
  }

  async getMomentsBySeries(seriesId: number, page: number): Promise<MomentPreview[]> {
    const queryItems: Record<string, string> = {};

    if (page === 1) {
      queryItems.dynpage = "1";
    } else {
      queryItems.ajaxPage = "yw_moments_by_series";
      queryItems.ajaxPageMode = "more";
      queryItems["moments-page"] = String(page);
    }

    const html = await this.sendRequest(`/moments/listBySeries/${seriesId}`, queryItems);

    if (html.includes("Вход или регистрация") || html.includes("Вход - Anime 365")) {
      throw WebClientError.authenticationRequired();
    }

    const $ = this.parseHtml(html);
    const moments: MomentPreview[] = [];

    $("#yw_moments_by_series div.m-moment").each((_, element) => {
      try {
        const moment = this.parseMomentPreview($, element);
        if (moment) {
          moments.push(moment);
        }
      } catch {
        // Skip invalid moments
      }
    });

    return moments;
  }

  private parseMomentPreview($: cheerio.CheerioAPI, element: Element): MomentPreview | null {
    const $el = $(element);

    const momentTitle = $el.find(".m-moment__title a").first().text().trim();
    if (!momentTitle) {
      return null;
    }

    const sourceDescription = $el.find(".m-moment__episode").first().text().trim();
    if (!sourceDescription) {
      return null;
    }

    const previewSrc = $el.find(".m-moment__thumb.a img[src]").first().attr("src");
    if (!previewSrc) {
      return null;
    }
    const coverUrl = new URL(
      previewSrc.trim().replace(".320x180", ".1280x720").replace(/\?.+$/, ""),
      this.baseUrl
    ).toString();

    const momentHref = $el.find(".m-moment__title a[href]").first().attr("href");
    if (!momentHref) {
      return null;
    }
    const momentIdMatch = momentHref.match(/\/moments\/(\d+)/);
    if (!momentIdMatch) {
      return null;
    }
    const momentId = Number.parseInt(momentIdMatch[1], 10);

    const durationString = $el.find(".m-moment__duration").first().text().trim();
    const durationSeconds = parseDurationString(durationString);
    if (durationSeconds === null) {
      return null;
    }

    return {
      momentId,
      coverUrl,
      momentTitle,
      sourceDescription,
      durationSeconds,
    };
  }

  async getMomentDetails(momentId: number): Promise<MomentDetails> {
    const html = await this.sendRequest(`/moments/${momentId}`, {});

    if (html.includes("Вход или регистрация") || html.includes("Вход - Anime 365")) {
      throw WebClientError.authenticationRequired();
    }

    const $ = this.parseHtml(html);

    const linkElements = $(".m-moment-player h3 a[href]");
    if (linkElements.length !== 2) {
      throw WebClientError.couldNotParseHtml();
    }

    const episodeHref = linkElements.first().attr("href");
    if (!episodeHref) {
      throw WebClientError.couldNotParseHtml();
    }

    const episodeUrl = new URL(episodeHref, this.baseUrl);
    const { seriesId, episodeId } = extractIdentifiersFromUrl(episodeUrl);

    if (seriesId === null || episodeId === null) {
      throw WebClientError.couldNotParseHtml();
    }

    const seriesTitle = linkElements.eq(1).text().trim();
    if (!seriesTitle) {
      throw WebClientError.couldNotParseHtml();
    }

    return { seriesId, seriesTitle, episodeId };
  }

  async getMomentEmbed(momentId: number): Promise<MomentEmbed> {
    const html = await this.sendRequest(`/moments/embed/${momentId}`, {});

    if (html.includes("Вход или регистрация") || html.includes("Вход - Anime 365")) {
      throw WebClientError.authenticationRequired();
    }

    const $ = this.parseHtml(html);

    const dataSourcesJson = $("#main-video").first().attr("data-sources");
    if (!dataSourcesJson) {
      throw WebClientError.couldNotParseHtml();
    }

    let videoSources: VideoSource[];
    try {
      videoSources = JSON.parse(dataSourcesJson);
    } catch {
      throw WebClientError.couldNotParseHtml();
    }

    const validSource = videoSources
      .filter((s) => s.urls && s.urls.length > 0)
      .sort((a, b) => b.height - a.height)[0];

    if (!validSource || !validSource.urls[0]) {
      throw WebClientError.couldNotParseHtml();
    }

    return { videoUrl: validSource.urls[0] };
  }
}
