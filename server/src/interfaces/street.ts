import { Document } from 'mongoose';

export interface Street extends Document {
  showDividers: boolean;
  low: number;
  medium: number;
  high: number;
  poor: number;
  rich: number;
  lowDividerCoord: number;
  mediumDividerCoord: number;
  highDividerCoord: number;
  dividers: number[];
}
