import { Document } from 'mongoose';
import { Things } from './things';
import { Media } from './media';
import { PlaceEntity } from './places';

export interface Differences extends Document {
  title: string;
  thing: string | Things;
  snippetImages: [
    {
      image: string | Media;
      place: string | PlaceEntity;
      fullUrl: string;
    }
  ];
  comparisonImages: [
    {
      image: string | Media;
      place: string | PlaceEntity;
      fullUrl: string;
    }
  ];
  image: string;
  imageText: string;
  imageLinkText: string;
  heading: string;
  subHeading: string;
  countries: [
    {
      place: string | PlaceEntity;
      country: string;
    }
  ];
  isHidden: boolean;
  categories: [
    {
      place: string | PlaceEntity;
      country: string;
    }
  ];
}
