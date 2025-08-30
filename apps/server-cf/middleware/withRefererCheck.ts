import { IRequest } from "itty-router";
import { ajaxError } from "../utils/misc";

const whitelist = [
  /^https:\/\/(?:[\w-]+\.)*bilisound\.moe(?:\/[\w/.-]*)?$/,
  /^https:\/\/(?:[\w-]+\.)*bilisound\.com(?:\/[\w/.-]*)?$/,
  /^https:\/\/(?:[\w-]+\.)*client-mobile.pages.dev(?:\/[\w/.-]*)?$/,
  /^http:\/\/(?:[\w-]+\.)*localhost:\d{4,5}(?:\/[\w/.-]*)?$/,
];

const withRefererCheck = (request: IRequest) => {
  const refererValue = request.headers.get("referer");
  if (refererValue && !whitelist.find(e => e.test(refererValue))) {
    return ajaxError("forbidden", 403);
  }
};

export default withRefererCheck;
