import "@bilisound/player";
import * as _monicon_icon_loader from "@monicon/icon-loader";
import * as React from "react";

declare module "@bilisound/player" {
  interface ExtendedData {
    id: string;
    episode: number;
    isLoaded: boolean;
    expireAt: number;
    artworkUrl: string;
  }
}

declare module "@monicon/icon-loader" {
  export type MoniconProps = {
    name: string;
    size?: number;
    color?: string;
    strokeWidth?: number;
    className?: string;
  };

  export const Monicon: (props: _monicon_icon_loader.MoniconProps) => React.JSX.Element;
}
