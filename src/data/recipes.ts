export type Ingredient = {
  quantity: number | null
  unit: string | null
  name: string
  scalable?: boolean
}

export type Recipe = {
  id: string
  title: string
  servings: number
  minutes: number
  tags: string[]
  ingredients: Ingredient[]
  steps: string[]
}

export const recipes: Recipe[] = [
  {
    id: 'weeknight-chicken-curry',
    title: 'Weeknight chicken curry',
    servings: 4,
    minutes: 35,
    tags: ['Kylling', 'Hverdag'],
    ingredients: [
      { quantity: 600, unit: 'g', name: 'chicken thighs, boneless' },
      { quantity: 2, unit: 'stk', name: 'onions, sliced' },
      { quantity: 3, unit: 'fedd', name: 'garlic, crushed' },
      { quantity: 1, unit: 'ss', name: 'fresh ginger, grated' },
      { quantity: 2, unit: 'ss', name: 'curry paste' },
      { quantity: 1, unit: 'boks', name: 'coconut milk (400 ml)' },
      { quantity: 1, unit: 'boks', name: 'chopped tomatoes' },
      { quantity: 1, unit: 'ts', name: 'garam masala' },
      { quantity: 4, unit: 'dl', name: 'basmati rice' },
      { quantity: null, unit: null, name: 'salt, to taste', scalable: false },
    ],
    steps: [
      'Fry the onions in a little oil over medium heat until soft, about 8 minutes.',
      'Add garlic, ginger and curry paste. Cook for 1 minute until fragrant.',
      'Add the chicken, coconut milk and tomatoes. Simmer for 20 minutes.',
      'Stir in garam masala and season with salt. Serve with rice.',
    ],
  },
]
