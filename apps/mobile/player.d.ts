import "@bilisound/player";

declare module "@bilisound/player" {
  interface ExtendedData {
    id: string;
    episode: number;
    isLoaded: boolean;
    expireAt: number;
    artworkUrl: string;
  }
}
