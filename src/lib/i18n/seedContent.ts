import type { Language } from './types'

export interface SeedIngredientTranslation {
  name: string
}

export interface SeedRecipeTranslation {
  name: string
  description: string
  steps: string[]
}

/** Traducciones del catálogo de ingredientes de ejemplo (ver src/db/seed.ts), por `seedKey`. */
export const seedIngredientTranslations: Record<Language, Record<string, SeedIngredientTranslation>> = {
  es: {
    egg: { name: 'Huevo' },
    white_rice: { name: 'Arroz blanco' },
    pasta: { name: 'Pasta (macarrones)' },
    tomato: { name: 'Tomate' },
    onion: { name: 'Cebolla' },
    garlic: { name: 'Ajo' },
    chicken_breast: { name: 'Pechuga de pollo' },
    olive_oil: { name: 'Aceite de oliva virgen extra' },
    salt: { name: 'Sal' },
    black_pepper: { name: 'Pimienta negra' },
    parmesan: { name: 'Queso parmesano' },
    whole_milk: { name: 'Leche entera' },
  },
  en: {
    egg: { name: 'Egg' },
    white_rice: { name: 'White rice' },
    pasta: { name: 'Pasta (macaroni)' },
    tomato: { name: 'Tomato' },
    onion: { name: 'Onion' },
    garlic: { name: 'Garlic' },
    chicken_breast: { name: 'Chicken breast' },
    olive_oil: { name: 'Extra virgin olive oil' },
    salt: { name: 'Salt' },
    black_pepper: { name: 'Black pepper' },
    parmesan: { name: 'Parmesan cheese' },
    whole_milk: { name: 'Whole milk' },
  },
}

/** Traducciones de las recetas de ejemplo (ver src/db/seed.ts), por `seedKey`. */
export const seedRecipeTranslations: Record<Language, Record<string, SeedRecipeTranslation>> = {
  es: {
    french_omelette: {
      name: 'Tortilla francesa rápida',
      description: 'Un clásico sencillo y rápido, ideal cuando el tiempo apremia.',
      steps: [
        'Bate los huevos con una pizca de sal en un bol.',
        'Calienta el aceite en una sartén a fuego medio-alto.',
        'Vierte el huevo batido y cuaja 1-2 minutos por cada lado.',
      ],
    },
    tomato_garlic_pasta: {
      name: 'Pasta con tomate y ajo',
      description: 'Pasta sencilla con un sofrito de tomate, cebolla y ajo.',
      steps: [
        'Pon a hervir agua con sal y cuece la pasta según el paquete.',
        'Sofríe la cebolla y el ajo picados en aceite hasta que estén dorados.',
        'Añade el tomate troceado y cocina 10-12 minutos a fuego medio.',
        'Escurre la pasta, mézclala con la salsa y sirve con queso al gusto.',
      ],
    },
    airfryer_chicken_rice: {
      name: 'Pollo al airfryer con arroz',
      description: 'Pechuga de pollo crujiente en freidora de aire acompañada de arroz blanco.',
      steps: [
        'Salpimienta la pechuga y pincélala con aceite.',
        'Cocina en el airfryer a 190°C durante 15-18 minutos, dando la vuelta a mitad.',
        'Mientras, cuece el arroz en agua con sal según el paquete.',
        'Sirve el pollo troceado sobre el arroz.',
      ],
    },
  },
  en: {
    french_omelette: {
      name: 'Quick French omelette',
      description: 'A simple, quick classic, ideal when time is short.',
      steps: [
        'Beat the eggs with a pinch of salt in a bowl.',
        'Heat the oil in a frying pan over medium-high heat.',
        'Pour in the beaten egg and cook 1-2 minutes per side.',
      ],
    },
    tomato_garlic_pasta: {
      name: 'Tomato garlic pasta',
      description: 'Simple pasta with a tomato, onion and garlic sauté.',
      steps: [
        'Bring salted water to a boil and cook the pasta per the package instructions.',
        'Sauté the chopped onion and garlic in oil until golden.',
        'Add the chopped tomato and cook 10-12 minutes over medium heat.',
        'Drain the pasta, mix it with the sauce and serve with cheese to taste.',
      ],
    },
    airfryer_chicken_rice: {
      name: 'Air fryer chicken with rice',
      description: 'Crispy air-fried chicken breast served with white rice.',
      steps: [
        'Season the chicken breast with salt and pepper and brush with oil.',
        'Cook in the air fryer at 190°C (375°F) for 15-18 minutes, flipping halfway.',
        'Meanwhile, cook the rice in salted water per the package instructions.',
        'Serve the sliced chicken over the rice.',
      ],
    },
  },
}
