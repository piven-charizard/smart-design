/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Product } from '../components/types';

export const PLANT_PRODUCTS: Product[] = [
  {
    id: 1,
    name: "Anthurium Red",
    imageUrl: "/public/anthurium-red.webp",
    description: "Beautiful red anthurium flowers in a terracotta pot"
  },
  {
    id: 2,
    name: "Parlor Palm", 
    imageUrl: "/public/parlor-palm.webp",
    description: "Elegant parlor palm in a beige ceramic pot"
  },
  {
    id: 3,
    name: "Money Tree",
    imageUrl: "/public/money-tree.webp", 
    description: "Braided money tree in a mint green pot"
  },
  {
    id: 4,
    name: "Snake Plant",
    imageUrl: "/public/snake-plant.webp",
    description: "Striking snake plant in a bright yellow pot"
  },
  {
    id: 5,
    name: "Pothos",
    imageUrl: "/public/pothos.webp", 
    description: "Cascading pothos in a modern gray pot"
  },
  {
    id: 6,
    name: "Collection of Plants",
    imageUrl: "/public/collection.jpg",
    description: "Collection of plants in a modern gray pot"
  }
];

export const MIXTILES_PRODUCTS: Product[] = [
  {
    id: 7,
    name: "Rue St. Dominique",
    imageUrl: "/public/rue-st-dominique.jpg",
    description: "Nighttime Paris street scene with illuminated Eiffel Tower by Blaine Harrington III",
    isTile: true
  },
  {
    id: 8,
    name: "Aloha Hotel",
    imageUrl: "/public/aloha-hotel.webp",
    description: "Vintage palm trees and retro hotel sign by Sisi and Seb",
    isTile: true
  },
  {
    id: 9,
    name: "Palm Springs",
    imageUrl: "/public/palm-springs.webp",
    description: "Mid-century modern house with orange door by Sisi and Seb",
    isTile: true
  },
  {
    id: 10,
    name: "Vacay",
    imageUrl: "/public/vacay.webp",
    description: "Beach scene with surfboards and pink wall by Sisi and Seb",
    isTile: true
  }
];

export const ALL_PRODUCTS: Product[] = [
  // Mix plants and tiles for better discoverability
  PLANT_PRODUCTS[0], // Anthurium Red
  MIXTILES_PRODUCTS[0], // Rue St. Dominique
  PLANT_PRODUCTS[1], // Parlor Palm
  MIXTILES_PRODUCTS[1], // Aloha Hotel
  PLANT_PRODUCTS[2], // Money Tree
  MIXTILES_PRODUCTS[2], // Palm Springs
  PLANT_PRODUCTS[3], // Snake Plant
  MIXTILES_PRODUCTS[3], // Vacay
  PLANT_PRODUCTS[4], // Pothos
  PLANT_PRODUCTS[5], // Collection
];
