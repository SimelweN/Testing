import axios from 'axios';

export interface LockerLocation {
  id: string;
  name: string;
  address: string;
  city: string;
  province: string;
  postal_code: string;
  latitude: number;
  longitude: number;
  opening_hours?: string;
  contact_number?: string;
  is_active: boolean;
  locker_capacity?: number;
  available_slots?: number;
}

export interface LockerSearchFilters {
  city?: string;
  province?: string;
  search_query?: string;
  latitude?: number;
  longitude?: number;
  radius_km?: number;
}

class LockerService {
  private baseURL = 'https://api.thecourierguy.co.za';
  private lockers: LockerLocation[] = [];
  private lastFetched: Date | null = null;
  private cacheExpiry = 1000 * 60 * 30; // 30 minutes cache

  /**
   * Fetch all lockers from Courier Guy API (currently using mock data due to CORS issues)
   */
  async fetchAllLockers(): Promise<LockerLocation[]> {
    try {
      // Use mock data directly due to CORS issues with external API
      console.log('🎭 Using mock locker data (external API blocked by CORS)');
      this.lockers = this.getMockLockers();
      this.lastFetched = new Date();
      console.log(`✅ Loaded ${this.lockers.length} mock lockers`);
      return this.lockers;

      /*
      // TODO: Enable when API access is configured through backend proxy
      console.log('🔄 Fetching lockers from Courier Guy API...');

      const response = await axios.get(`${this.baseURL}/pudo-lockers`, {
        timeout: 10000,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      });

      if (response.data && Array.isArray(response.data)) {
        this.lockers = this.processLockerData(response.data);
        this.lastFetched = new Date();
        console.log(`✅ Successfully fetched ${this.lockers.length} lockers`);
        return this.lockers;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        this.lockers = this.processLockerData(response.data.data);
        this.lastFetched = new Date();
        console.log(`✅ Successfully fetched ${this.lockers.length} lockers`);
        return this.lockers;
      } else {
        console.error('❌ Unexpected API response format:', response.data);
        throw new Error('Unexpected API response format');
      }
      */
    } catch (error) {
      console.error('��� Error fetching lockers:', error);

      // Return cached data if available
      if (this.lockers.length > 0) {
        console.log('📦 Using cached locker data');
        return this.lockers;
      }

      // Return mock data as fallback
      console.log('🎭 Using mock locker data as fallback');
      return this.getMockLockers();
    }
  }

  /**
   * Get lockers with optional caching
   */
  async getLockers(forceRefresh = false): Promise<LockerLocation[]> {
    const now = new Date();
    const shouldRefresh = forceRefresh || 
      !this.lastFetched || 
      (now.getTime() - this.lastFetched.getTime()) > this.cacheExpiry;

    if (shouldRefresh || this.lockers.length === 0) {
      return await this.fetchAllLockers();
    }

    console.log('📦 Using cached locker data');
    return this.lockers;
  }

  /**
   * Search lockers based on filters
   */
  async searchLockers(filters: LockerSearchFilters): Promise<LockerLocation[]> {
    const allLockers = await this.getLockers();
    let filteredLockers = [...allLockers];

    // Filter by search query (name, address, city)
    if (filters.search_query?.trim()) {
      const query = filters.search_query.toLowerCase().trim();
      filteredLockers = filteredLockers.filter(locker =>
        locker.name.toLowerCase().includes(query) ||
        locker.address.toLowerCase().includes(query) ||
        locker.city.toLowerCase().includes(query)
      );
    }

    // Filter by city
    if (filters.city?.trim()) {
      filteredLockers = filteredLockers.filter(locker =>
        locker.city.toLowerCase().includes(filters.city!.toLowerCase())
      );
    }

    // Filter by province
    if (filters.province?.trim()) {
      filteredLockers = filteredLockers.filter(locker =>
        locker.province.toLowerCase().includes(filters.province!.toLowerCase())
      );
    }

    // Filter by radius if coordinates provided
    if (filters.latitude && filters.longitude && filters.radius_km) {
      filteredLockers = filteredLockers.filter(locker => {
        const distance = this.calculateDistance(
          filters.latitude!,
          filters.longitude!,
          locker.latitude,
          locker.longitude
        );
        return distance <= filters.radius_km!;
      });

      // Sort by distance
      filteredLockers.sort((a, b) => {
        const distanceA = this.calculateDistance(
          filters.latitude!,
          filters.longitude!,
          a.latitude,
          a.longitude
        );
        const distanceB = this.calculateDistance(
          filters.latitude!,
          filters.longitude!,
          b.latitude,
          b.longitude
        );
        return distanceA - distanceB;
      });
    }

    console.log(`🔍 Search returned ${filteredLockers.length} lockers`);
    return filteredLockers;
  }

  /**
   * Get lockers near a specific location
   */
  async getNearbyLockers(
    latitude: number, 
    longitude: number, 
    radiusKm: number = 10
  ): Promise<Array<LockerLocation & { distance: number }>> {
    const allLockers = await this.getLockers();
    
    const nearbyLockers = allLockers
      .map(locker => ({
        ...locker,
        distance: this.calculateDistance(latitude, longitude, locker.latitude, locker.longitude)
      }))
      .filter(locker => locker.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance);

    console.log(`📍 Found ${nearbyLockers.length} lockers within ${radiusKm}km`);
    return nearbyLockers;
  }

  /**
   * Get unique cities where lockers are available
   */
  async getAvailableCities(): Promise<string[]> {
    const lockers = await this.getLockers();
    const cities = [...new Set(lockers.map(locker => locker.city))].sort();
    return cities;
  }

  /**
   * Get unique provinces where lockers are available
   */
  async getAvailableProvinces(): Promise<string[]> {
    const lockers = await this.getLockers();
    const provinces = [...new Set(lockers.map(locker => locker.province))].sort();
    return provinces;
  }

  /**
   * Process raw locker data from API
   */
  private processLockerData(rawData: any[]): LockerLocation[] {
    return rawData
      .map(item => {
        try {
          return {
            id: item.id || item.locker_id || `locker_${Date.now()}_${Math.random()}`,
            name: item.name || item.location_name || 'Unknown Locker',
            address: item.address || item.street_address || '',
            city: item.city || item.town || '',
            province: item.province || item.state || '',
            postal_code: item.postal_code || item.zip_code || '',
            latitude: parseFloat(item.latitude || item.lat || 0),
            longitude: parseFloat(item.longitude || item.lng || 0),
            opening_hours: item.opening_hours || item.hours || '',
            contact_number: item.contact_number || item.phone || '',
            is_active: item.is_active !== false && item.status !== 'inactive',
            locker_capacity: item.locker_capacity || item.capacity || 0,
            available_slots: item.available_slots || item.capacity || 0,
          };
        } catch (error) {
          console.warn('⚠️ Error processing locker item:', item, error);
          return null;
        }
      })
      .filter((locker): locker is LockerLocation => 
        locker !== null && 
        locker.latitude !== 0 && 
        locker.longitude !== 0 &&
        locker.is_active
      );
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Fallback mock data for development/testing
   */
  private getMockLockers(): LockerLocation[] {
    return [
      // Gauteng Province
      {
        id: 'mock_1',
        name: 'Pick n Pay Sandton City',
        address: '83 Rivonia Road, Sandton',
        city: 'Sandton',
        province: 'Gauteng',
        postal_code: '2196',
        latitude: -26.1076,
        longitude: 28.0567,
        opening_hours: 'Mon-Sun: 8:00-20:00',
        contact_number: '011 784 7000',
        is_active: true,
        locker_capacity: 50,
        available_slots: 23,
      },
      {
        id: 'mock_2',
        name: 'Checkers Rosebank',
        address: 'Rosebank Mall, 50 Bath Avenue',
        city: 'Johannesburg',
        province: 'Gauteng',
        postal_code: '2196',
        latitude: -26.1440,
        longitude: 28.0407,
        opening_hours: 'Mon-Sun: 7:00-21:00',
        contact_number: '011 447 5000',
        is_active: true,
        locker_capacity: 30,
        available_slots: 12,
      },
      {
        id: 'mock_3',
        name: 'Woolworths Menlyn',
        address: 'Menlyn Park Shopping Centre, Pretoria',
        city: 'Pretoria',
        province: 'Gauteng',
        postal_code: '0181',
        latitude: -25.7852,
        longitude: 28.2761,
        opening_hours: 'Mon-Sun: 9:00-21:00',
        contact_number: '012 348 4000',
        is_active: true,
        locker_capacity: 45,
        available_slots: 18,
      },
      // Western Cape Province
      {
        id: 'mock_4',
        name: 'Woolworths Canal Walk',
        address: 'Canal Walk Shopping Centre, Century City',
        city: 'Cape Town',
        province: 'Western Cape',
        postal_code: '7441',
        latitude: -33.8876,
        longitude: 18.5104,
        opening_hours: 'Mon-Sun: 9:00-21:00',
        contact_number: '021 555 1234',
        is_active: true,
        locker_capacity: 40,
        available_slots: 15,
      },
      {
        id: 'mock_5',
        name: 'Pick n Pay V&A Waterfront',
        address: 'Victoria & Alfred Waterfront',
        city: 'Cape Town',
        province: 'Western Cape',
        postal_code: '8001',
        latitude: -33.9022,
        longitude: 18.4186,
        opening_hours: 'Mon-Sun: 9:00-21:00',
        contact_number: '021 408 7600',
        is_active: true,
        locker_capacity: 35,
        available_slots: 22,
      },
      {
        id: 'mock_6',
        name: 'Checkers Stellenbosch',
        address: 'Eikestad Mall, Andringa Street',
        city: 'Stellenbosch',
        province: 'Western Cape',
        postal_code: '7600',
        latitude: -33.9321,
        longitude: 18.8602,
        opening_hours: 'Mon-Sat: 8:00-20:00, Sun: 9:00-18:00',
        contact_number: '021 887 9200',
        is_active: true,
        locker_capacity: 25,
        available_slots: 9,
      },
      // KwaZulu-Natal Province
      {
        id: 'mock_7',
        name: 'Gateway Theatre of Shopping',
        address: '1 Palm Boulevard, Umhlanga Ridge',
        city: 'Durban',
        province: 'KwaZulu-Natal',
        postal_code: '4319',
        latitude: -29.7294,
        longitude: 31.0785,
        opening_hours: 'Mon-Sun: 9:00-21:00',
        contact_number: '031 566 0000',
        is_active: true,
        locker_capacity: 35,
        available_slots: 8,
      },
      {
        id: 'mock_8',
        name: 'Woolworths Pavilion',
        address: 'Pavilion Shopping Centre, Westville',
        city: 'Durban',
        province: 'KwaZulu-Natal',
        postal_code: '3629',
        latitude: -29.8258,
        longitude: 30.9186,
        opening_hours: 'Mon-Sun: 9:00-21:00',
        contact_number: '031 265 0300',
        is_active: true,
        locker_capacity: 28,
        available_slots: 14,
      },
      {
        id: 'mock_9',
        name: 'Pick n Pay Pietermaritzburg',
        address: 'Liberty Midlands Mall, Pietermaritzburg',
        city: 'Pietermaritzburg',
        province: 'KwaZulu-Natal',
        postal_code: '3201',
        latitude: -29.6046,
        longitude: 30.3794,
        opening_hours: 'Mon-Sun: 8:00-20:00',
        contact_number: '033 346 1000',
        is_active: true,
        locker_capacity: 20,
        available_slots: 7,
      },
    ];
  }
}

// Export singleton instance
export const lockerService = new LockerService();
