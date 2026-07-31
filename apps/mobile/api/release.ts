import { BILISOUND_API_PREFIX, USER_AGENT_BILISOUND } from "~/constants/network";

import { defineWrap } from "./common";

// Release metadata belongs to the application API, not the Bilibili SDK adapter.
export interface GetUpdateResponse {
  version: string;
  info: string;
  downloadPage: string;
  downloadUrl: string;
}

export async function getUpdate(nightly = false) {
  const query = nightly ? "?nightly=1" : "";
  const response = await fetch(`${BILISOUND_API_PREFIX}/internal/app/update${query}`, {
    headers: {
      "user-agent": USER_AGENT_BILISOUND,
    },
  });
  return defineWrap<GetUpdateResponse>(await response.json());
}
