/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Product } from '../components/types';

// Plant products with different sizes based on Easyplant specifications
export const PLANT_PRODUCTS: Product[] = [
  // Small plants (9"-16" tall) - for tables and small surfaces
  {
    id: 1,
    name: 'Anthurium Red - Small',
    imageUrl: '/assets/anthurium-red.webp',
    description: 'Beautiful red anthurium flowers in a terracotta pot',
    price: 'From $39',
    lightLevel: 'Medium Light',
    size: 'small',
    height: '9-16 inches',
    potWidth: '5.6 inches',
    potHeight: '4.8 inches',
  },
  {
    id: 2,
    name: 'Parlor Palm - Small',
    imageUrl: '/assets/parlor-palm.webp',
    description: 'Elegant parlor palm in a beige ceramic pot',
    price: 'From $39',
    lightLevel: 'Low Light',
    size: 'small',
    height: '9-16 inches',
    potWidth: '5.1 inches',
    potHeight: '5.1 inches',
  },
  // Medium plants (11"-26" tall) - for regular surfaces
  {
    id: 3,
    name: 'Money Tree - Medium',
    imageUrl: '/assets/money-tree.webp',
    description: 'Braided money tree in a mint green pot',
    price: 'From $45',
    lightLevel: 'Medium Light',
    petFriendly: true,
    size: 'medium',
    height: '11-26 inches',
    potWidth: '7 inches',
    potHeight: '5.8 inches',
  },
  {
    id: 4,
    name: 'Snake Plant - Medium',
    imageUrl: '/assets/snake-plant.webp',
    description: 'Striking snake plant in a bright yellow pot',
    price: 'From $39',
    lightLevel: 'Low Light',
    size: 'medium',
    height: '11-26 inches',
    potWidth: '7.6 inches',
    potHeight: '6.4 inches',
  },
  // Large plants (23"-40" tall) - for big empty spaces
  {
    id: 5,
    name: 'Pothos - Large',
    imageUrl: '/assets/pothos.webp',
    description: 'Cascading pothos in a modern gray pot',
    price: 'From $39',
    lightLevel: 'Low Light',
    size: 'large',
    height: '23-40 inches',
    potWidth: '10.9 inches',
    potHeight: '9.9 inches',
  },
  // Huge plants (40"-69" tall) - for very large empty spaces
  {
    id: 6,
    name: 'Fiddle Leaf Fig - Huge',
    imageUrl: '/assets/anthurium-red.webp', // Using placeholder - would need actual huge plant image
    description: 'Majestic fiddle leaf fig in a large ceramic pot',
    price: 'From $89',
    lightLevel: 'Bright Light',
    size: 'huge',
    height: '40-69 inches',
    potWidth: '10.9 inches',
    potHeight: '9.9 inches',
  },
];

export const MIXTILES_PRODUCTS: Product[] = [
  {
    id: 6,
    name: 'Wall Tile 1',
    imageUrl: '/assets/pictures/wall-1.webp',
    description: 'Beautiful wall tile design for your space',
    isTile: true,
    price: 'From $29',
  },
  {
    id: 7,
    name: 'Wall Tile 2',
    imageUrl: '/assets/pictures/wall-2.webp',
    description: 'Elegant wall tile design for your space',
    isTile: true,
    price: 'From $29',
  },
];

export const ALL_PRODUCTS: Product[] = [
  // Mix plants and tiles for better discoverability
  PLANT_PRODUCTS[0], // Anthurium Red
  MIXTILES_PRODUCTS[0], // Wall Tile 1
  PLANT_PRODUCTS[1], // Parlor Palm
  MIXTILES_PRODUCTS[1], // Wall Tile 2
  PLANT_PRODUCTS[2], // Money Tree
  PLANT_PRODUCTS[3], // Snake Plant
  PLANT_PRODUCTS[4], // Pothos
];
