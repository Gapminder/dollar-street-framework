export interface Translation {
  lang: string;
  name?: string;
  shortDescription?: string;
  description?: string;
  value?: string;
  CURRENCY_TEXT?: string;
  COUNTRY_CODE?: string;
  COUNTRY_NAME?: string;
  text?: string;
  context?: string;
  alias?: string;
  country?: string;
  header?: string;
  link?: Link;
  familyInfo?: string;
  familyInfoSummary?: string;
  aboutData?: string;
  synonymous?: Synonymous[];
  thingName?: string;
  tags?: Tags[];
  plural?: string;
  thingDescription?: string;
  firstName?: string;
  lastName?: string;
  company: Company;
  answer?: string;
}

export interface Company {
  name: string;
  link: string;
  description: string;
}

export interface Link {
  href: string;
  text: string;
}

export interface Synonymous {
  text: string;
}

export interface Tags {
  text: string;
}
