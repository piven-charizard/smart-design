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
}
