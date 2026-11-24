const letterPattern = new RegExp('\\p{L}', 'u');

export function validateProductListingDetails(
  description: string,
  unit: string
): string | null {
  const cleanDescription = description.trim();
  const cleanUnit = unit.trim();

  if (cleanDescription.length < 20) {
    return 'Add a product description of at least 20 characters so buyers can understand what they are ordering.';
  }

  if (cleanDescription.length > 1000) {
    return 'Product descriptions must be 1,000 characters or fewer.';
  }

  if (!cleanUnit) {
    return 'Add a pack or measurement unit, such as kg, piece, pack or litre.';
  }

  if (cleanUnit.length > 30) {
    return 'Pack or measurement units must be 30 characters or fewer.';
  }

  if (!letterPattern.test(cleanUnit)) {
    return 'Pack or measurement units must include a name, such as kg, piece or pack.';
  }

  return null;
}
