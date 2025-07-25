import { toast } from "sonner";

export interface LockerShipmentData {
  senderName: string;
  senderPhone: string;
  senderEmail: string;
  receiverName: string;
  receiverPhone: string;
  receiverEmail: string;
  receiverAddress: string;
  lockerId: string;
  orderId: string;
  weight?: number;
  size?: "S" | "M" | "L";
}

export interface LockerShipmentResponse {
  success: boolean;
  trackingNumber?: string;
  qrCodeUrl?: string;
  waybillUrl?: string;
  error?: string;
  reference?: string;
}

export interface Locker {
  id: string;
  name: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  operatingHours: string;
  latitude?: number;
  longitude?: number;
  status: "active" | "inactive" | "maintenance";
}

class LockerShippingService {
  private static readonly API_BASE_URL = "https://api.pudo.co.za";
  private static readonly API_KEY = import.meta.env.VITE_COURIER_GUY_LOCKER_API_KEY;

  /**
   * Get list of available lockers
   */
  static async getLockers(): Promise<Locker[]> {
    try {
      if (!this.API_KEY) {
        console.warn("Locker API key not configured, returning mock data");
        return this.getMockLockers();
      }

      console.log("🔍 Fetching lockers from Courier Guy API...");
      
      // In development, return mock data for now
      if (import.meta.env.DEV) {
        console.log("🧪 Development mode: Using mock locker data");
        return this.getMockLockers();
      }

      const response = await fetch(`${this.API_BASE_URL}/lockers`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "ApiKey": this.API_KEY,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("✅ Lockers fetched successfully:", data.lockers?.length || 0);
      
      return data.lockers || [];
    } catch (error) {
      console.error("❌ Error fetching lockers:", error);
      toast.error("Failed to load locker locations");
      // Return mock data as fallback
      return this.getMockLockers();
    }
  }

  /**
   * Create a locker-to-door shipment
   */
  static async createLockerShipment(shipmentData: LockerShipmentData): Promise<LockerShipmentResponse> {
    try {
      if (!this.API_KEY) {
        throw new Error("Locker API key not configured");
      }

      console.log("📦 Creating locker shipment:", shipmentData.orderId);

      // In development, return mock response
      if (import.meta.env.DEV) {
        console.log("🧪 Development mode: Using mock shipment response");
        return this.getMockShipmentResponse(shipmentData);
      }

      const requestBody = {
        sender: {
          name: shipmentData.senderName,
          phone: shipmentData.senderPhone,
          email: shipmentData.senderEmail,
        },
        receiver: {
          name: shipmentData.receiverName,
          phone: shipmentData.receiverPhone,
          email: shipmentData.receiverEmail,
          address: shipmentData.receiverAddress,
        },
        parcel: {
          weight: shipmentData.weight || 0.5,
          size: shipmentData.size || "S",
        },
        serviceType: "LockerToDoor",
        lockerId: shipmentData.lockerId,
        reference: shipmentData.orderId,
      };

      const response = await fetch(`${this.API_BASE_URL}/shipment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ApiKey": this.API_KEY,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log("✅ Locker shipment created successfully:", result);

      return {
        success: true,
        trackingNumber: result.trackingNumber,
        qrCodeUrl: result.qrCodeUrl,
        waybillUrl: result.waybillUrl,
        reference: result.reference,
      };
    } catch (error) {
      console.error("❌ Error creating locker shipment:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Track a locker shipment
   */
  static async trackShipment(trackingNumber: string): Promise<any> {
    try {
      if (!this.API_KEY) {
        throw new Error("Locker API key not configured");
      }

      console.log("📍 Tracking locker shipment:", trackingNumber);

      const response = await fetch(`${this.API_BASE_URL}/tracking/${trackingNumber}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "ApiKey": this.API_KEY,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const trackingData = await response.json();
      console.log("✅ Tracking data retrieved:", trackingData);
      
      return trackingData;
    } catch (error) {
      console.error("❌ Error tracking shipment:", error);
      throw error;
    }
  }

  /**
   * Get mock locker data for development/fallback
   */
  private static getMockLockers(): Locker[] {
    return [
      {
        id: "CG_SANDTON_001",
        name: "Sandton City Mall - Locker Hub",
        address: "83 Rivonia Road, Sandhurst",
        city: "Sandton",
        province: "Gauteng",
        postalCode: "2196",
        operatingHours: "9:00 AM - 9:00 PM",
        latitude: -26.1067,
        longitude: 28.0567,
        status: "active"
      },
      {
        id: "CG_CANALWALK_001",
        name: "Canal Walk Shopping Centre - Locker Point",
        address: "Century City Drive, Century City",
        city: "Cape Town",
        province: "Western Cape",
        postalCode: "7441",
        operatingHours: "9:00 AM - 9:00 PM",
        latitude: -33.8944,
        longitude: 18.5086,
        status: "active"
      },
      {
        id: "CG_GATEWAY_001",
        name: "Gateway Theatre of Shopping - Pickup Hub",
        address: "1 Palm Boulevard, Umhlanga Ridge",
        city: "Durban",
        province: "KwaZulu-Natal",
        postalCode: "4319",
        operatingHours: "9:00 AM - 9:00 PM",
        latitude: -29.7333,
        longitude: 31.0833,
        status: "active"
      },
      {
        id: "CG_MENLYN_001",
        name: "Menlyn Park Shopping Centre - Express Locker",
        address: "Atterbury Road & Lois Avenue, Menlyn",
        city: "Pretoria",
        province: "Gauteng",
        postalCode: "0181",
        operatingHours: "9:00 AM - 9:00 PM",
        latitude: -25.7833,
        longitude: 28.2667,
        status: "active"
      },
      {
        id: "CG_EASTGATE_001",
        name: "Eastgate Shopping Centre - Locker Zone",
        address: "43 Bradford Road, Bedfordview",
        city: "Johannesburg",
        province: "Gauteng",
        postalCode: "2008",
        operatingHours: "9:00 AM - 8:00 PM",
        latitude: -26.1833,
        longitude: 28.1167,
        status: "active"
      },
      {
        id: "CG_TYGER_001",
        name: "Tyger Valley Shopping Centre - Smart Locker",
        address: "Tyger Valley Centre, Willie van Schoor Avenue",
        city: "Cape Town",
        province: "Western Cape",
        postalCode: "7530",
        operatingHours: "9:00 AM - 9:00 PM",
        latitude: -33.8667,
        longitude: 18.6333,
        status: "active"
      }
    ];
  }

  /**
   * Get mock shipment response for development
   */
  private static getMockShipmentResponse(shipmentData: LockerShipmentData): LockerShipmentResponse {
    const mockTrackingNumber = `LTD${Date.now().toString().slice(-8)}`;
    
    return {
      success: true,
      trackingNumber: mockTrackingNumber,
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${mockTrackingNumber}`,
      waybillUrl: `/api/waybill/${mockTrackingNumber}.pdf`,
      reference: shipmentData.orderId,
    };
  }

  /**
   * Validate locker ID
   */
  static async validateLocker(lockerId: string): Promise<boolean> {
    try {
      const lockers = await this.getLockers();
      return lockers.some(locker => locker.id === lockerId && locker.status === "active");
    } catch (error) {
      console.error("Error validating locker:", error);
      return false;
    }
  }

  /**
   * Get locker details by ID
   */
  static async getLockerById(lockerId: string): Promise<Locker | null> {
    try {
      const lockers = await this.getLockers();
      return lockers.find(locker => locker.id === lockerId) || null;
    } catch (error) {
      console.error("Error getting locker by ID:", error);
      return null;
    }
  }
}

export default LockerShippingService;
