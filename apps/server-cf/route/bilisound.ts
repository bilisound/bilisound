import { IRequest, RouterType } from "itty-router";
import { getSDK } from "../utils/sdk";
import { ajaxError, ajaxSuccess } from "../utils/misc";
import { UserListMode } from "@bilisound/sdk";
import CORS_HEADERS from "../constants/cors";
import { USER_AGENT } from "../constants/values";

function getHandleResource(method: string) {
  return async (request: IRequest, env: any) => {
    const id = request.query.id;
    const episode = Number(request.query.episode);
    const dl = request.query.dl;
    if (typeof id !== "string" || !Number.isInteger(episode) || episode < 1) {
      return ajaxError("api usage error", 400);
    }

    try {
      // 获取视频
      const sdk = getSDK(env);
      const range = request.headers.get("Range");

      const { aid, bvid, episodeName, data, contentRange, contentLength } = await sdk.getResource(id, episode, {
        method,
        range,
      });
      const fileName = `[${dl === "av" ? `av${aid}` : bvid}] [P${episode}] ${episodeName}.m4a`;

      return new Response(data, {
        status: range ? 206 : 200,
        headers: {
          ...CORS_HEADERS,
          ...(dl
            ? {
                "Content-Disposition": `filename*=utf-8''${encodeURIComponent(fileName)}`,
              }
            : {}),
          "Content-Type": dl ? "application/octet-stream" : "audio/mp4",
          "Accept-Ranges": "bytes",
          "Cache-Control": "max-age=604800",
          "Content-Length": contentLength,
          ...(range
            ? {
                "Content-Range": contentRange,
              }
            : {}),
        },
      });
    } catch (e) {
      return ajaxError(e);
    }
  };
}

export default function bilisound(router: RouterType) {
  router.get("/api/internal/resolve-b23", async (request, env) => {
    const id = request.query.id;
    if (typeof id !== "string") {
      return ajaxError("api usage error", 400);
    }

    try {
      const sdk = getSDK(env);
      const url = await sdk.parseB23(id);
      return ajaxSuccess(url);
    } catch (e) {
      return ajaxError(e);
    }
  });

  router.get("/api/internal/user-list", async (request, env) => {
    const { userId, listId, page, mode } = request.query;
    if (
      typeof userId !== "string" ||
      typeof listId !== "string" ||
      typeof page !== "string" ||
      typeof mode !== "string"
    ) {
      return ajaxError("api usage error", 400);
    }

    try {
      const sdk = getSDK(env);
      const url = await sdk.getUserList(mode as UserListMode, userId, listId, Number(page));
      return ajaxSuccess(url);
    } catch (e) {
      return ajaxError(e);
    }
  });

  router.get("/api/internal/user-list-all", async (request, env) => {
    const { userId, listId, mode } = request.query;
    if (typeof userId !== "string" || typeof listId !== "string" || typeof mode !== "string") {
      return ajaxError("api usage error", 400);
    }

    try {
      const sdk = getSDK(env);
      const url = await sdk.getUserListFull(mode as UserListMode, userId, listId);
      return ajaxSuccess(url);
    } catch (e) {
      return ajaxError(e);
    }
  });

  router.get("/api/internal/metadata", async (request, env) => {
    const id = request.query.id;
    if (typeof id !== "string") {
      return ajaxError("api usage error", 400);
    }

    try {
      const sdk = getSDK(env);
      const res = await sdk.getMetadata(id);
      return ajaxSuccess(res);
    } catch (e) {
      return ajaxError(e);
    }
  });

  router.get("/api/internal/resource", getHandleResource("get"));

  router.head("/api/internal/resource", getHandleResource("head"));

  router.get("/api/internal/image", async request => {
    const url = request.query.url;
    const referer = request.query.referer;
    if (!(typeof url === "string" && typeof referer === "string")) {
      return new Response("", { status: 400 });
    }

    const URL_ALLOWED_SUFFIX = ["hdslb.com", "biliimg.com"];
    const REFERER_ALLOWED_SUFFIX = ["bilibili.com"];

    try {
      const urlHostname = new URL(url).hostname;
      const refererHostname = new URL(referer).hostname;
      let urlFound = false;
      let refererFound = false;
      for (let i = 0; i < URL_ALLOWED_SUFFIX.length; i++) {
        const e = URL_ALLOWED_SUFFIX[i];
        if (urlHostname.endsWith(e)) {
          urlFound = true;
          break;
        }
      }
      for (let i = 0; i < REFERER_ALLOWED_SUFFIX.length; i++) {
        const e = REFERER_ALLOWED_SUFFIX[i];
        if (refererHostname.endsWith(e)) {
          refererFound = true;
          break;
        }
      }

      if (!(urlFound && refererFound)) {
        return new Response("", { status: 403 });
      }

      const res = await fetch(url, {
        headers: {
          "User-Agent": USER_AGENT,
          referer,
        },
      });

      return new Response(await res.arrayBuffer(), {
        headers: {
          ...CORS_HEADERS,
          "Cache-Control": "max-age=604800",
          "Content-Type": res.headers.get("Content-Type"),
        },
      });
    } catch (e) {
      console.error(e);
      return new Response("", { status: 500 });
    }
  });

  router.get("/api/internal/debug-request", async (request, env) => {});

  router.post("/api/internal/transfer-list", async (request, env) => {});

  router.get("/api/internal/transfer-list/:id", async (request, env) => {});

  router.get("/api/internal/app/update", async (request, env) => {
    let arch = request.query.arch;
    const nightly = request.query.nightly;
    if (typeof arch !== "string") {
      arch = "android";
    }

    // 未来可能会增加其它的 arch，但是目前先只判断 android
    if (arch !== "android") {
      return ajaxError("bad arch", 400);
    }

    const endpoint = nightly
      ? "https://api.github.com/repos/bilisound/client-mobile/releases"
      : "https://api.github.com/repos/bilisound/client-mobile/releases/latest";
    const response = (await fetch(endpoint, {
      headers: {
        "User-Agent": "Bilisound Server",
      },
    }).then(e => e.json())) as any;
    const latestRelease = nightly ? response.find((r: any) => r.prerelease) || response[0] : response;
    const version = latestRelease.tag_name.replace("v", "");

    return ajaxSuccess({
      version,
      info: "",
      downloadPage: latestRelease.html_url,
      downloadUrl: latestRelease.assets[0].browser_download_url,
    });
  });
}
