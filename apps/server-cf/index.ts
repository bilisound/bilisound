import { Router } from "itty-router";
import CORS_HEADERS from "./constants/cors";
import bilisound from "./route/bilisound";
import withRefererCheck from "./middleware/withRefererCheck";

// Create a new router
const router = Router();

router.all("*", withRefererCheck);

router.get("/", () => {
  return new Response("", {
    status: 302,
    headers: {
      location: "https://bilisound.moe",
    },
  });
});

bilisound(router);

router.options(
  "*",
  () =>
    new Response("", {
      status: 200,
      headers: CORS_HEADERS,
    }),
);

router.all("*", () => new Response("404, not found!", { status: 404 }));

export default {
  fetch: router.fetch,
};
