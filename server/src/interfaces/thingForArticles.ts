export interface ThingForArticles {
  thingName: string;
  translations: {
    lang: string;
    synonymous: { text: string }[];
    thingName: string;
    tags: { text: string }[];
    plural: string;
    thingDescription: string;
  }[];
}
