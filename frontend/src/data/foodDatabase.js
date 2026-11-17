/**
 * MyFitSync Comprehensive Food & Nutrition Intelligence Database
 * Provides instant, zero-latency macro calculation across multiple serving units (pcs, grms, oz, cups, scoops).
 */

export const POPULAR_FOODS = [
  {
    id: 'boiled_egg',
    name: 'Boiled Egg',
    category: 'Protein',
    aliases: ['boiled egg', 'hard boiled egg', 'egg', 'eggs', 'ande', 'boiled eggs'],
    defaultUnit: 'pcs',
    availableUnits: ['pcs', 'grms'],
    // Base values per 1 unit of availableUnits
    perUnit: {
      pcs: { calories: 78, protein: 6.3, carbs: 0.6, fat: 5.3 },
      grms: { calories: 1.55, protein: 0.126, carbs: 0.012, fat: 0.106 }, // 1g = ~1.55 kcal
    },
  },
  {
    id: 'egg_white',
    name: 'Egg White',
    category: 'Protein',
    aliases: ['egg white', 'egg whites', 'boiled egg white'],
    defaultUnit: 'pcs',
    availableUnits: ['pcs', 'grms'],
    perUnit: {
      pcs: { calories: 17, protein: 3.6, carbs: 0.2, fat: 0.1 },
      grms: { calories: 0.52, protein: 0.11, carbs: 0.007, fat: 0.002 },
    },
  },
  {
    id: 'chicken_breast',
    name: 'Chicken Breast (Cooked)',
    category: 'Protein',
    aliases: ['chicken breast', 'chicken', 'grilled chicken', 'cooked chicken breast', 'murgh'],
    defaultUnit: 'grms',
    availableUnits: ['grms', 'oz', 'pcs'],
    perUnit: {
      grms: { calories: 1.65, protein: 0.31, carbs: 0.0, fat: 0.036 }, // 100g = 165 kcal, 31g P, 3.6g F
      oz: { calories: 46.8, protein: 8.8, carbs: 0.0, fat: 1.02 },
      pcs: { calories: 280, protein: 53.0, carbs: 0.0, fat: 6.1 }, // ~170g breast
    },
  },
  {
    id: 'white_rice',
    name: 'White Rice (Cooked)',
    category: 'Carbs',
    aliases: ['white rice', 'rice', 'cooked white rice', 'boiled rice', 'steamed rice', 'chawal'],
    defaultUnit: 'grms',
    availableUnits: ['grms', 'cups', 'oz'],
    perUnit: {
      grms: { calories: 1.30, protein: 0.027, carbs: 0.28, fat: 0.003 }, // 100g = 130 kcal, 2.7g P, 28g C
      cups: { calories: 205, protein: 4.2, carbs: 44.5, fat: 0.4 }, // 1 cup cooked (~158g)
      oz: { calories: 36.9, protein: 0.77, carbs: 7.9, fat: 0.09 },
    },
  },
  {
    id: 'brown_rice',
    name: 'Brown Rice (Cooked)',
    category: 'Carbs',
    aliases: ['brown rice', 'cooked brown rice'],
    defaultUnit: 'grms',
    availableUnits: ['grms', 'cups'],
    perUnit: {
      grms: { calories: 1.23, protein: 0.027, carbs: 0.26, fat: 0.01 },
      cups: { calories: 218, protein: 4.5, carbs: 45.8, fat: 1.6 },
    },
  },
  {
    id: 'oatmeal',
    name: 'Oats / Oatmeal (Dry)',
    category: 'Carbs',
    aliases: ['oats', 'oatmeal', 'rolled oats', 'quaker oats'],
    defaultUnit: 'grms',
    availableUnits: ['grms', 'cups', 'oz'],
    perUnit: {
      grms: { calories: 3.89, protein: 0.169, carbs: 0.663, fat: 0.069 }, // 100g = 389 kcal
      cups: { calories: 307, protein: 13.3, carbs: 52.4, fat: 5.5 }, // 1/2 cup dry (~80g) = ~307 kcal
      oz: { calories: 110, protein: 4.8, carbs: 18.8, fat: 2.0 },
    },
  },
  {
    id: 'whey_protein',
    name: 'Whey Protein Powder',
    category: 'Supplement',
    aliases: ['whey', 'whey protein', 'protein powder', 'protein shake', 'isolate'],
    defaultUnit: 'scoops',
    availableUnits: ['scoops', 'grms'],
    perUnit: {
      scoops: { calories: 120, protein: 24.0, carbs: 3.0, fat: 1.5 }, // 1 scoop (~30g)
      grms: { calories: 4.0, protein: 0.80, carbs: 0.10, fat: 0.05 },
    },
  },
  {
    id: 'banana',
    name: 'Banana (Fresh)',
    category: 'Fruit',
    aliases: ['banana', 'bananas', 'kela'],
    defaultUnit: 'pcs',
    availableUnits: ['pcs', 'grms'],
    perUnit: {
      pcs: { calories: 105, protein: 1.3, carbs: 27.0, fat: 0.3 }, // 1 medium banana (~118g)
      grms: { calories: 0.89, protein: 0.011, carbs: 0.228, fat: 0.003 },
    },
  },
  {
    id: 'peanut_butter',
    name: 'Peanut Butter',
    category: 'Fat',
    aliases: ['peanut butter', 'pb', 'crunchy peanut butter', 'creamy peanut butter'],
    defaultUnit: 'tbsp',
    availableUnits: ['tbsp', 'grms'],
    perUnit: {
      tbsp: { calories: 95, protein: 4.0, carbs: 3.5, fat: 8.0 }, // 1 tbsp (~16g)
      grms: { calories: 5.88, protein: 0.25, carbs: 0.20, fat: 0.50 },
    },
  },
  {
    id: 'paneer',
    name: 'Paneer (Cottage Cheese)',
    category: 'Protein',
    aliases: ['paneer', 'cottage cheese', 'indian cottage cheese'],
    defaultUnit: 'grms',
    availableUnits: ['grms', 'oz'],
    perUnit: {
      grms: { calories: 2.96, protein: 0.183, carbs: 0.045, fat: 0.225 }, // 100g = 296 kcal, 18.3g P, 22.5g F
      oz: { calories: 84.0, protein: 5.2, carbs: 1.3, fat: 6.4 },
    },
  },
  {
    id: 'salmon',
    name: 'Salmon Fillet (Cooked)',
    category: 'Protein',
    aliases: ['salmon', 'cooked salmon', 'grilled salmon', 'salmon fillet'],
    defaultUnit: 'grms',
    availableUnits: ['grms', 'oz', 'pcs'],
    perUnit: {
      grms: { calories: 2.06, protein: 0.22, carbs: 0.0, fat: 0.12 }, // 100g = 206 kcal, 22g P, 12g F
      oz: { calories: 58.4, protein: 6.2, carbs: 0.0, fat: 3.4 },
      pcs: { calories: 350, protein: 37.4, carbs: 0.0, fat: 20.4 }, // ~170g fillet
    },
  },
  {
    id: 'greek_yogurt',
    name: 'Greek Yogurt (0% Fat)',
    category: 'Protein',
    aliases: ['greek yogurt', 'nonfat greek yogurt', 'plain greek yogurt', 'yogurt', 'curd', 'dahi'],
    defaultUnit: 'cups',
    availableUnits: ['cups', 'grms'],
    perUnit: {
      cups: { calories: 130, protein: 22.0, carbs: 7.0, fat: 0.0 }, // 1 cup (~200g)
      grms: { calories: 0.59, protein: 0.10, carbs: 0.036, fat: 0.004 },
    },
  },
  {
    id: 'roti',
    name: 'Roti / Chapati (Whole Wheat)',
    category: 'Carbs',
    aliases: ['roti', 'chapati', 'phulka', 'flatbread', 'wheat roti'],
    defaultUnit: 'pcs',
    availableUnits: ['pcs', 'grms'],
    perUnit: {
      pcs: { calories: 104, protein: 3.1, carbs: 20.2, fat: 1.2 }, // 1 medium roti (~40g)
      grms: { calories: 2.60, protein: 0.078, carbs: 0.505, fat: 0.03 },
    },
  },
  {
    id: 'whole_milk',
    name: 'Whole Milk',
    category: 'Dairy',
    aliases: ['milk', 'whole milk', 'full cream milk', 'cow milk'],
    defaultUnit: 'cups',
    availableUnits: ['cups', 'ml'],
    perUnit: {
      cups: { calories: 149, protein: 7.7, carbs: 11.7, fat: 8.0 }, // 1 cup (244ml)
      ml: { calories: 0.61, protein: 0.032, carbs: 0.048, fat: 0.033 },
    },
  },
  {
    id: 'almonds',
    name: 'Almonds',
    category: 'Fat',
    aliases: ['almonds', 'almond', 'badam'],
    defaultUnit: 'grms',
    availableUnits: ['grms', 'pcs', 'oz'],
    perUnit: {
      grms: { calories: 5.79, protein: 0.21, carbs: 0.22, fat: 0.50 }, // 100g = 579 kcal
      pcs: { calories: 7.0, protein: 0.26, carbs: 0.27, fat: 0.61 }, // 1 almond (~1.2g)
      oz: { calories: 164, protein: 6.0, carbs: 6.1, fat: 14.2 },
    },
  },
  {
    id: 'apple',
    name: 'Apple (Fresh)',
    category: 'Fruit',
    aliases: ['apple', 'apples', 'seb'],
    defaultUnit: 'pcs',
    availableUnits: ['pcs', 'grms'],
    perUnit: {
      pcs: { calories: 95, protein: 0.5, carbs: 25.0, fat: 0.3 }, // 1 medium apple (~182g)
      grms: { calories: 0.52, protein: 0.003, carbs: 0.138, fat: 0.002 },
    },
  },
  {
    id: 'bread',
    name: 'Whole Wheat Bread Slice',
    category: 'Carbs',
    aliases: ['bread', 'toast', 'wheat bread', 'brown bread', 'white bread'],
    defaultUnit: 'pcs',
    availableUnits: ['pcs', 'grms'],
    perUnit: {
      pcs: { calories: 80, protein: 4.0, carbs: 14.0, fat: 1.0 }, // 1 slice (~35g)
      grms: { calories: 2.47, protein: 0.12, carbs: 0.44, fat: 0.034 },
    },
  },
];

/**
 * Searches the food database and estimates macronutrients based on quantity and unit.
 *
 * @param {string} foodQuery - Food description typed by athlete (e.g. "boiled egg", "chicken breast")
 * @param {number} quantity - Numeric amount (e.g. 2, 150)
 * @param {string} unit - Unit chosen (e.g. "pcs", "grms", "oz", "cups", "scoops")
 * @returns {object|null} Calculated macros or null if unknown
 */
export function estimateFoodMacros(foodQuery, quantity = 1, unit = null) {
  if (!foodQuery || typeof foodQuery !== 'string' || !foodQuery.trim()) {
    return null;
  }

  const cleanQuery = foodQuery.trim().toLowerCase();
  const qty = parseFloat(quantity) > 0 ? parseFloat(quantity) : 1;

  // 1. Exact or Alias match
  let matchedFood = POPULAR_FOODS.find((f) =>
    f.aliases.some((alias) => alias === cleanQuery)
  );

  // 2. Substring match if no exact match
  if (!matchedFood) {
    matchedFood = POPULAR_FOODS.find((f) =>
      f.aliases.some((alias) => cleanQuery.includes(alias) || alias.includes(cleanQuery))
    );
  }

  if (!matchedFood) {
    return null;
  }

  // Determine target unit
  const activeUnit = unit && matchedFood.perUnit[unit] ? unit : matchedFood.defaultUnit;
  const rates = matchedFood.perUnit[activeUnit];

  if (!rates) {
    return null;
  }

  const calories = Math.round(rates.calories * qty);
  const protein = Math.round(rates.protein * qty * 10) / 10;
  const carbs = Math.round(rates.carbs * qty * 10) / 10;
  const fat = Math.round(rates.fat * qty * 10) / 10;

  return {
    matched: true,
    foodName: matchedFood.name,
    category: matchedFood.category,
    defaultUnit: matchedFood.defaultUnit,
    availableUnits: matchedFood.availableUnits,
    activeUnit,
    quantity: qty,
    calories,
    protein_g: protein,
    carbs_g: carbs,
    fat_g: fat,
  };
}

/**
 * Autocomplete suggestions for meal typing.
 */
export function searchFoodSuggestions(query) {
  if (!query || query.trim().length < 2) return [];
  const clean = query.trim().toLowerCase();
  return POPULAR_FOODS.filter((f) =>
    f.aliases.some((alias) => alias.includes(clean))
  ).slice(0, 5);
}
