/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Product } from '../components/types';

export const PLANT_PRODUCTS: Product[] = [
  {
    id: 1,
    name: "Anthurium Red",
    imageUrl: "/assets/anthurium-red.webp",
    description: "Beautiful red anthurium flowers in a terracotta pot",
    price: "From $39",
    lightLevel: "Medium Light"
  },
  {
    id: 2,
    name: "Parlor Palm", 
    imageUrl: "/assets/parlor-palm.webp",
    description: "Elegant parlor palm in a beige ceramic pot",
    price: "From $39",
    lightLevel: "Low Light"
  },
  {
    id: 3,
    name: "Money Tree",
    imageUrl: "/assets/money-tree.webp", 
    description: "Braided money tree in a mint green pot",
    price: "From $45",
    lightLevel: "Medium Light",
    petFriendly: true
  },
  {
    id: 4,
    name: "Snake Plant",
    imageUrl: "/assets/snake-plant.webp",
    description: "Striking snake plant in a bright yellow pot",
    price: "From $39",
    lightLevel: "Low Light"
  },
  {
    id: 5,
    name: "Pothos",
    imageUrl: "/assets/pothos.webp", 
    description: "Cascading pothos in a modern gray pot",
    price: "From $39",
    lightLevel: "Low Light"
  },
];

export const MIXTILES_PRODUCTS: Product[] = [
  {
    id: 6,
    name: "Paris, France",
    imageUrl: "/assets/paris.png",
    description: "Nighttime Paris street scene with illuminated Eiffel Tower",
    isTile: true,
    price: "From $29"
  },
  {
    id: 7,
    name: "Italy, Amalfi Coast",
    imageUrl: "/assets/italy.png",
    description: "Vintage palm trees and retro hotel sign",
    isTile: true,
    price: "From $29"
  },
  
];

export const ALL_PRODUCTS: Product[] = [
  // Mix plants and tiles for better discoverability
  PLANT_PRODUCTS[0], // Anthurium Red
  MIXTILES_PRODUCTS[0], // Paris, France
  PLANT_PRODUCTS[1], // Parlor Palm
  MIXTILES_PRODUCTS[1], // Italy, Amalfi Coast
  PLANT_PRODUCTS[2], // Money Tree
  PLANT_PRODUCTS[3], // Snake Plant
  PLANT_PRODUCTS[4], // Pothos
];
