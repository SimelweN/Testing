import { supabase } from "@/lib/supabase";

interface Address {
  street: string;
  city: string;
  province: string;
  postal_code: string;
  country: string;
}

interface ParcelDetails {
  weight: number;
  length: number;
  width: number;
  height: number;
  value: number;
}

interface QuoteRequest {
  from: Address;
  to: Address;
  parcel: ParcelDetails;
}

interface CourierQuote {
  id: string;
  provider: "courier-guy" | "fastway";
  service_name: string;
  service_code: string;
  price: number;
  estimated_days: string;
  description: string;
  features: string[];
}

export class RealCourierPricing {
  // 🚛 Get Courier Guy quotes
  static async getCourierGuyQuotes(
    request: QuoteRequest,
  ): Promise<CourierQuote[]> {
    try {
      // 📡 Call Edge Function with real addresses
      const { data, error } = await supabase.functions.invoke(
        "courier-guy-quote",
        {
          body: {
            pickup_address: request.from, // ← Real seller address
            delivery_address: request.to, // ← Real buyer address
            parcel_details: request.parcel, // ← Real package details
          },
        },
      );

      if (!error && data?.success && data.quotes) {
        return data.quotes.map((quote: any) => ({
          id: `courier-guy-${quote.service_code}`,
          provider: "courier-guy" as const,
          service_name: `Courier Guy - ${quote.service_name}`,
          service_code: quote.service_code,
          price: quote.price, // ← Real price from API
          estimated_days: `${quote.estimated_days} day${quote.estimated_days !== 1 ? "s" : ""}`,
          description: quote.description || "Reliable door-to-door delivery",
          features: [
            "Tracking included",
            "Door-to-door delivery",
            "Proof of delivery",
          ],
        }));
      }
    } catch (error) {
      console.warn("Courier Guy API unavailable, using rate table:", error);
    }

    // 🔄 Fallback to rate table if API fails
    return this.getCourierGuyRateTable(request);
  }

  // 🚛 Get Fastway quotes
  static async getFastwayQuotes(
    request: QuoteRequest,
  ): Promise<CourierQuote[]> {
    try {
      // 📡 Call Edge Function with real addresses
      const { data, error } = await supabase.functions.invoke("fastway-quote", {
        body: {
          pickup_address: request.from,
          delivery_address: request.to,
          parcel_details: request.parcel,
        },
      });

      if (!error && data?.success && data.quotes) {
        return data.quotes.map((quote: any) => ({
          id: `fastway-${quote.service_code}`,
          provider: "fastway" as const,
          service_name: `Fastway - ${quote.service_name}`,
          service_code: quote.service_code,
          price: quote.price,
          estimated_days: `${quote.estimated_days} day${quote.estimated_days !== 1 ? "s" : ""}`,
          description: quote.description || "Fast and reliable delivery",
          features: [
            "Tracking included",
            "Insurance covered",
            "Signature on delivery",
          ],
        }));
      }
    } catch (error) {
      console.warn("Fastway API unavailable, using rate table:", error);
    }

    // 🔄 Fallback to rate table if API fails
    return this.getFastwayRateTable(request);
  }

  // 📊 Smart rate calculation based on provinces and weight
  private static calculateCourierGuyRates(
    fromProvince: string,
    toProvince: string,
    weight: number,
  ) {
    let baseStandard = 60;
    let baseExpress = 85;

    const majorProvinces = ["Gauteng", "Western Cape", "KwaZulu-Natal"];
    const fromMajor = majorProvinces.includes(fromProvince);
    const toMajor = majorProvinces.includes(toProvince);

    if (fromProvince === toProvince) {
      // 🏠 Intra-provincial rates (same province)
      baseStandard = fromMajor ? 45 : 55;
      baseExpress = fromMajor ? 65 : 75;
    } else if (fromMajor && toMajor) {
      // 🌟 Major to major province
      baseStandard = 75;
      baseExpress = 95;
    } else if (fromMajor || toMajor) {
      // 📍 Major to minor or vice versa
      baseStandard = 85;
      baseExpress = 110;
    } else {
      // 🚛 Minor to minor province
      baseStandard = 95;
      baseExpress = 125;
    }

    // ⚖️ Weight multiplier (rates increase with weight)
    const weightMultiplier = Math.max(1, weight / 2);

    return {
      standard: Math.round(baseStandard * weightMultiplier),
      express: Math.round(baseExpress * weightMultiplier),
    };
  }

  // 📊 Courier Guy fallback rate table
  private static getCourierGuyRateTable(request: QuoteRequest): CourierQuote[] {
    const rates = this.calculateCourierGuyRates(
      request.from.province,
      request.to.province,
      request.parcel.weight,
    );

    return [
      {
        id: "courier-guy-standard",
        provider: "courier-guy",
        service_name: "Courier Guy - Standard",
        service_code: "STD",
        price: rates.standard,
        estimated_days: "2-3 days",
        description: "Reliable standard delivery service",
        features: [
          "Tracking included",
          "Door-to-door delivery",
          "Proof of delivery",
        ],
      },
      {
        id: "courier-guy-express",
        provider: "courier-guy",
        service_name: "Courier Guy - Express",
        service_code: "EXP",
        price: rates.express,
        estimated_days: "1-2 days",
        description: "Fast express delivery service",
        features: [
          "Priority handling",
          "Tracking included",
          "Door-to-door delivery",
        ],
      },
    ];
  }

  // 📊 Fastway fallback rate table
  private static getFastwayRateTable(request: QuoteRequest): CourierQuote[] {
    const rates = this.calculateFastwayRates(
      request.from.province,
      request.to.province,
      request.parcel.weight,
    );

    return [
      {
        id: "fastway-standard",
        provider: "fastway",
        service_name: "Fastway - Standard",
        service_code: "STD",
        price: rates.standard,
        estimated_days: "2-4 days",
        description: "Reliable standard delivery",
        features: [
          "Tracking included",
          "Insurance covered",
          "Proof of delivery",
        ],
      },
      {
        id: "fastway-express",
        provider: "fastway",
        service_name: "Fastway - Express",
        service_code: "EXP",
        price: rates.express,
        estimated_days: "1-2 days",
        description: "Express delivery service",
        features: [
          "Priority handling",
          "Tracking included",
          "Insurance covered",
        ],
      },
    ];
  }

  private static calculateFastwayRates(
    fromProvince: string,
    toProvince: string,
    weight: number,
  ) {
    // Similar calculation to Courier Guy but with different base rates
    let baseStandard = 65;
    let baseExpress = 90;

    const majorProvinces = ["Gauteng", "Western Cape", "KwaZulu-Natal"];
    const fromMajor = majorProvinces.includes(fromProvince);
    const toMajor = majorProvinces.includes(toProvince);

    if (fromProvince === toProvince) {
      baseStandard = fromMajor ? 50 : 60;
      baseExpress = fromMajor ? 70 : 80;
    } else if (fromMajor && toMajor) {
      baseStandard = 80;
      baseExpress = 100;
    } else if (fromMajor || toMajor) {
      baseStandard = 90;
      baseExpress = 115;
    } else {
      baseStandard = 100;
      baseExpress = 130;
    }

    const weightMultiplier = Math.max(1, weight / 2);

    return {
      standard: Math.round(baseStandard * weightMultiplier),
      express: Math.round(baseExpress * weightMultiplier),
    };
  }

  // 🌍 Determine delivery zone based on addresses
  static determineDeliveryZone(
    from: Address,
    to: Address,
  ): "local" | "provincial" | "national" {
    const isLocal = to.province === from.province && to.city === from.city;
    const isProvincial = to.province === from.province && !isLocal;
    const isNational = to.province !== from.province;

    if (isLocal) return "local";
    if (isProvincial) return "provincial";
    return "national";
  }
}

export type { CourierQuote, QuoteRequest, Address, ParcelDetails };
