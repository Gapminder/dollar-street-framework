import * as mongoose from 'mongoose';

export interface ComparisonQuery {
  title?: { [key: string]: string | number };
}

export interface SnippetImage {
  image: mongoose.Types.ObjectId;
  place: mongoose.Types.ObjectId;
  fullUrl: string;
}

export interface ComparisonCategory {
  place: mongoose.Types.ObjectId;
  country: string;
}

export interface ComparisonCountry {
  place: mongoose.Types.ObjectId;
  country: string;
}

export interface ComparisonEntity {
  _id: mongoose.Types.ObjectId;
  title: string;
  thing: mongoose.Types.ObjectId;
  snippetImages: SnippetImage[];
  comparisonImages: SnippetImage[];
  image: string;
  imageText: string;
  imageLinkText: string;
  heading: string;
  subHeading: string;
  countries: ComparisonCountry[];
  isHidden: boolean;
  categories: ComparisonCategory[];
}
