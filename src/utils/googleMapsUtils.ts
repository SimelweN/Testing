/**
 * Extract province from Google Maps place object
 * @param place - Google Maps place object from autocomplete
 * @returns Province name or null
 */
export function extractProvince(
  place: google.maps.places.PlaceResult,
): string | null {
  const components = place?.address_components || [];

  const provinceComponent = components.find((comp) =>
    comp.types.includes("administrative_area_level_1"),
  );

  return provinceComponent?.long_name || null;
}

/**
 * Extract city from Google Maps place object
 * @param place - Google Maps place object from autocomplete
 * @returns City name or null
 */
export function extractCity(
  place: google.maps.places.PlaceResult,
): string | null {
  const components = place?.address_components || [];

  const cityComponent = components.find(
    (comp) =>
      comp.types.includes("locality") ||
      comp.types.includes("administrative_area_level_2"),
  );

  return cityComponent?.long_name || null;
}

/**
 * Extract postal code from Google Maps place object
 * @param place - Google Maps place object from autocomplete
 * @returns Postal code or null
 */
export function extractPostalCode(
  place: google.maps.places.PlaceResult,
): string | null {
  const components = place?.address_components || [];

  const postalComponent = components.find((comp) =>
    comp.types.includes("postal_code"),
  );

  return postalComponent?.long_name || null;
}

/**
 * Extract complete address components from Google Maps place object
 * @param place - Google Maps place object from autocomplete
 * @returns Object with address components
 */
export function extractAddressComponents(
  place: google.maps.places.PlaceResult,
) {
  return {
    formatted_address: place.formatted_address || "",
    province: extractProvince(place),
    city: extractCity(place),
    postal_code: extractPostalCode(place),
    coordinates: place.geometry
      ? {
          lat: place.geometry.location?.lat() || 0,
          lng: place.geometry.location?.lng() || 0,
        }
      : null,
  };
}
