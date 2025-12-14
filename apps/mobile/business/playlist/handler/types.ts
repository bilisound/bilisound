import type { TrackData } from "@bilisound/player/build/types";

/**
 * 旧版本的 TrackData 类型（1.x 版本）
 */
export interface TrackDataOld {
  /** The track title */
  title?: string;
  /** The track album */
  album?: string;
  /** The track artist */
  artist?: string;
  /** The track duration in seconds */
  duration?: number;
  /** The track artwork */
  artwork?: string;
  /** track description */
  description?: string;
  /** The track genre */
  genre?: string;
  /** The track release date in [RFC 3339](https://www.ietf.org/rfc/rfc3339.txt) */
  date?: string;
  /** The track rating */
  rating?: any;
  /**
   * (iOS only) Whether the track is presented in the control center as being
   * live
   **/
  isLiveStream?: boolean;
  url: string;
  type?: any;
  /** The user agent HTTP header */
  userAgent?: string;
  /** Mime type of the media file */
  contentType?: string;
  /** (iOS only) The pitch algorithm to apply to the sound. */
  pitchAlgorithm?: any;

  headers?: { [key: string]: any };

  bilisoundId: string;
  bilisoundEpisode: string;
  bilisoundUniqueId: string;
  bilisoundIsLoaded: boolean;
}

export type { TrackData };
