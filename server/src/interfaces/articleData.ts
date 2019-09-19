export interface ArticleData {
  thing: string;
  shortDescription: string;
  description: string;
  isDescription: boolean;
  translations: Translation[];
  translated: boolean;
}

export interface Translation {
  lang: string;
  shortDescription: string;
  description: string;
  name: string;
  header: string;
  link: {
    href: string;
    text: string;
  };
  synonymous: { text: string }[];
  thingName: string;
  tags: { text: string }[];
  plural: string;
  thingDescription: string;
  familyInfoSummary: string;
  aboutData: string;
  familyInfo: string;
  country: string;
  alias: string;
  firstName: string;
  lastName: string;
  company: {
    name: string;
    link: string;
    description: string;
  };
}
