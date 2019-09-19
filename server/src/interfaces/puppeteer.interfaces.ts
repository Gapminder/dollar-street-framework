export interface EmbedParams {
  requestUuid: string;
  screenshot?: string;
  tool?: string;
  download?: boolean;
  medias?: string;
  mediasIds?: string[];
  thingId?: string;
  lang?: string;
  referer?: string;
  embed?: string;
  resolution?: string;
}

export interface EmbedUrls {
  _id: string;
  embedUrl: string;
  imageUrl: string;
  downloadUrl: string;
}
