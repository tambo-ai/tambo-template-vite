interface LocationResult {
  stateName: string;
  stateAbbreviation: string;
  city: string;
}

const STATE_NAME_TO_ABBR: Record<string, string> = {
  "Alabama": "AL",
  "Alaska": "AK",
  "Arizona": "AZ",
  "Arkansas": "AR",
  "California": "CA",
  "Colorado": "CO",
  "Connecticut": "CT",
  "Delaware": "DE",
  "District of Columbia": "DC",
  "Florida": "FL",
  "Georgia": "GA",
  "Hawaii": "HI",
  "Idaho": "ID",
  "Illinois": "IL",
  "Indiana": "IN",
  "Iowa": "IA",
  "Kansas": "KS",
  "Kentucky": "KY",
  "Louisiana": "LA",
  "Maine": "ME",
  "Maryland": "MD",
  "Massachusetts": "MA",
  "Michigan": "MI",
  "Minnesota": "MN",
  "Mississippi": "MS",
  "Missouri": "MO",
  "Montana": "MT",
  "Nebraska": "NE",
  "Nevada": "NV",
  "New Hampshire": "NH",
  "New Jersey": "NJ",
  "New Mexico": "NM",
  "New York": "NY",
  "North Carolina": "NC",
  "North Dakota": "ND",
  "Ohio": "OH",
  "Oklahoma": "OK",
  "Oregon": "OR",
  "Pennsylvania": "PA",
  "Rhode Island": "RI",
  "South Carolina": "SC",
  "South Dakota": "SD",
  "Tennessee": "TN",
  "Texas": "TX",
  "Utah": "UT",
  "Vermont": "VT",
  "Virginia": "VA",
  "Washington": "WA",
  "West Virginia": "WV",
  "Wisconsin": "WI",
  "Wyoming": "WY",
};

export const getUserLocation = async (): Promise<LocationResult> => {
  try {
    const response = await fetch("https://get.geojs.io/v1/ip/geo.json");
    if (!response.ok) {
      throw new Error(`Geolocation API returned ${response.status}`);
    }

    const data = await response.json();
    const region: string = data.region ?? "";
    const city: string = data.city ?? "";

    const abbreviation = STATE_NAME_TO_ABBR[region];
    if (!abbreviation) {
      throw new Error(
        `Could not map region "${region}" to a US state. The user may be outside the US.`,
      );
    }

    return {
      stateName: region,
      stateAbbreviation: abbreviation,
      city,
    };
  } catch (error) {
    throw new Error(
      `Failed to detect location: ${error instanceof Error ? error.message : "Unknown error"}. Ask the user which state they live in instead.`,
    );
  }
};

export type { LocationResult };
