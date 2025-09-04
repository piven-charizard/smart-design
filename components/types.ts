/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Product {
  id: number;
  name: string;
  imageUrl: string;
  description?: string;
  isTile?: boolean;
  price?: string;
  lightLevel?: 'Low Light' | 'Medium Light' | 'Bright Light';
  petFriendly?: boolean;
  size?: 'small' | 'medium' | 'large' | 'huge';
  height?: string; // e.g., "9-16 inches"
  potWidth?: string; // e.g., "5.6 inches"
  potHeight?: string; // e.g., "4.8 inches"
  pictureCount?: number; // For gallery walls - number of pictures in the arrangement
}
