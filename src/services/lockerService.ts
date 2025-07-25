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
      console.error('❌ Error fetching lockers:', error);

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
   * Comprehensive mock data representing Courier Guy's extensive locker network across South Africa
   */
  private getMockLockers(): LockerLocation[] {
    const mockLockers: LockerLocation[] = [];

    // Helper function to generate random capacity and availability
    const generateCapacity = () => {
      const capacity = Math.floor(Math.random() * 50) + 20; // 20-70 capacity
      const available = Math.floor(Math.random() * capacity);
      return { capacity, available };
    };

    // Gauteng Province (Major economic hub - most lockers)
    const gautengLockers = [
      // Johannesburg
      { name: 'Pick n Pay Sandton City', address: '83 Rivonia Road, Sandton', city: 'Sandton', lat: -26.1076, lng: 28.0567 },
      { name: 'Checkers Rosebank', address: 'Rosebank Mall, 50 Bath Avenue', city: 'Johannesburg', lat: -26.1440, lng: 28.0407 },
      { name: 'Woolworths Hyde Park', address: 'Hyde Park Shopping Centre', city: 'Johannesburg', lat: -26.1175, lng: 28.0238 },
      { name: 'Pick n Pay Melrose Arch', address: 'Melrose Arch Shopping Centre', city: 'Johannesburg', lat: -26.1352, lng: 28.0677 },
      { name: 'Checkers Eastgate', address: 'Eastgate Shopping Centre', city: 'Johannesburg', lat: -26.1877, lng: 28.1349 },
      { name: 'Woolworths Fourways', address: 'Fourways Mall', city: 'Johannesburg', lat: -25.9889, lng: 28.0103 },
      { name: 'Pick n Pay Cresta', address: 'Cresta Shopping Centre', city: 'Johannesburg', lat: -26.1089, lng: 27.9616 },
      { name: 'Checkers Northgate', address: 'Northgate Shopping Centre', city: 'Johannesburg', lat: -26.0461, lng: 28.0227 },
      { name: 'Woolworths Southgate', address: 'Southgate Shopping Centre', city: 'Johannesburg', lat: -26.2686, lng: 27.9786 },
      { name: 'Pick n Pay Clearwater', address: 'Clearwater Mall', city: 'Johannesburg', lat: -26.0378, lng: 27.8893 },

      // Pretoria
      { name: 'Woolworths Menlyn', address: 'Menlyn Park Shopping Centre', city: 'Pretoria', lat: -25.7852, lng: 28.2761 },
      { name: 'Pick n Pay Brooklyn', address: 'Brooklyn Mall', city: 'Pretoria', lat: -25.7648, lng: 28.2364 },
      { name: 'Checkers Centurion', address: 'Centurion Mall', city: 'Centurion', lat: -25.8547, lng: 28.1883 },
      { name: 'Woolworths Wonderpark', address: 'Wonderpark Shopping Centre', city: 'Pretoria', lat: -25.7129, lng: 28.2233 },
      { name: 'Pick n Pay The Grove', address: 'The Grove Mall', city: 'Pretoria', lat: -25.7129, lng: 28.2233 },
      { name: 'Checkers Hatfield', address: 'Hatfield Plaza', city: 'Pretoria', lat: -25.7479, lng: 28.2293 },

      // East Rand
      { name: 'Pick n Pay Eastrand Mall', address: 'Eastrand Mall', city: 'Boksburg', lat: -26.2056, lng: 28.2608 },
      { name: 'Checkers Benoni', address: 'Lakeside Mall', city: 'Benoni', lat: -26.1784, lng: 28.3207 },
      { name: 'Woolworths Springs', address: 'Springs Mall', city: 'Springs', lat: -26.2500, lng: 28.4500 },

      // West Rand
      { name: 'Pick n Pay Westgate', address: 'Westgate Shopping Centre', city: 'Roodepoort', lat: -26.1089, lng: 27.9616 },
      { name: 'Checkers Krugersdorp', address: 'Cradlestone Mall', city: 'Krugersdorp', lat: -26.1018, lng: 27.7718 },
    ];

    // Western Cape Province (Second largest economic center)
    const westernCapeLockers = [
      // Cape Town Metro
      { name: 'Woolworths Canal Walk', address: 'Canal Walk Shopping Centre', city: 'Cape Town', lat: -33.8876, lng: 18.5104 },
      { name: 'Pick n Pay V&A Waterfront', address: 'Victoria & Alfred Waterfront', city: 'Cape Town', lat: -33.9022, lng: 18.4186 },
      { name: 'Checkers Cavendish', address: 'Cavendish Square', city: 'Cape Town', lat: -33.9648, lng: 18.4641 },
      { name: 'Woolworths Tyger Valley', address: 'Tyger Valley Shopping Centre', city: 'Cape Town', lat: -33.9144, lng: 18.6276 },
      { name: 'Pick n Pay Blue Route', address: 'Blue Route Mall', city: 'Cape Town', lat: -34.0522, lng: 18.4556 },
      { name: 'Checkers Bayside', address: 'Bayside Shopping Centre', city: 'Cape Town', lat: -33.8625, lng: 18.5083 },
      { name: 'Woolworths Claremont', address: 'Cavendish Square', city: 'Cape Town', lat: -33.9648, lng: 18.4641 },
      { name: 'Pick n Pay Kenilworth', address: 'Kenilworth Centre', city: 'Cape Town', lat: -33.9709, lng: 18.4697 },
      { name: 'Checkers Goodwood', address: 'Goodwood Centre', city: 'Cape Town', lat: -33.8959, lng: 18.5398 },
      { name: 'Woolworths Somerset West', address: 'Somerset Mall', city: 'Somerset West', lat: -34.0781, lng: 18.8419 },

      // Other Western Cape Cities
      { name: 'Checkers Stellenbosch', address: 'Eikestad Mall', city: 'Stellenbosch', lat: -33.9321, lng: 18.8602 },
      { name: 'Pick n Pay Paarl', address: 'Paarl Mall', city: 'Paarl', lat: -33.7369, lng: 18.9584 },
      { name: 'Woolworths George', address: 'Garden Route Mall', city: 'George', lat: -33.9631, lng: 22.4619 },
      { name: 'Checkers Mossel Bay', address: 'Langeberg Mall', city: 'Mossel Bay', lat: -34.1820, lng: 22.1460 },
      { name: 'Pick n Pay Worcester', address: 'Golden Grove Centre', city: 'Worcester', lat: -33.6467, lng: 19.4481 },
    ];

    // KwaZulu-Natal Province
    const kznLockers = [
      // Durban Metro
      { name: 'Gateway Theatre of Shopping', address: '1 Palm Boulevard', city: 'Durban', lat: -29.7294, lng: 31.0785 },
      { name: 'Woolworths Pavilion', address: 'Pavilion Shopping Centre', city: 'Durban', lat: -29.8258, lng: 30.9186 },
      { name: 'Pick n Pay La Lucia', address: 'La Lucia Mall', city: 'Durban', lat: -29.7647, lng: 31.0892 },
      { name: 'Checkers Musgrave', address: 'Musgrave Centre', city: 'Durban', lat: -29.8471, lng: 30.9970 },
      { name: 'Woolworths Westville', address: 'Westville Mall', city: 'Durban', lat: -29.8258, lng: 30.9186 },
      { name: 'Pick n Pay Chatsworth', address: 'Chatsworth Centre', city: 'Durban', lat: -29.9594, lng: 30.8577 },

      // Other KZN Cities
      { name: 'Pick n Pay Pietermaritzburg', address: 'Liberty Midlands Mall', city: 'Pietermaritzburg', lat: -29.6046, lng: 30.3794 },
      { name: 'Checkers Newcastle', address: 'Newcastle Mall', city: 'Newcastle', lat: -27.7574, lng: 29.9317 },
      { name: 'Woolworths Richards Bay', address: 'Boardwalk Mall', city: 'Richards Bay', lat: -28.7830, lng: 32.0378 },
      { name: 'Pick n Pay Ballito', address: 'Ballito Junction', city: 'Ballito', lat: -29.5392, lng: 31.2136 },
    ];

    // Eastern Cape Province
    const easternCapeLockers = [
      { name: 'Pick n Pay Port Elizabeth', address: 'Greenacres Shopping Centre', city: 'Port Elizabeth', lat: -33.9648, lng: 25.5999 },
      { name: 'Woolworths East London', address: 'Hemingways Mall', city: 'East London', lat: -32.9833, lng: 27.8711 },
      { name: 'Checkers Grahamstown', address: 'Pepper Grove Mall', city: 'Grahamstown', lat: -33.3047, lng: 26.5328 },
      { name: 'Pick n Pay King Williams Town', address: 'Bhisho Centre', city: 'King Williams Town', lat: -32.8833, lng: 27.4000 },
      { name: 'Woolworths Uitenhage', address: 'Caledon Square', city: 'Uitenhage', lat: -33.7581, lng: 25.3970 },
    ];

    // Mpumalanga Province
    const mpumalangaLockers = [
      { name: 'Pick n Pay Nelspruit', address: 'Riverside Mall', city: 'Nelspruit', lat: -25.4753, lng: 30.9699 },
      { name: 'Checkers Witbank', address: 'Highveld Mall', city: 'Witbank', lat: -25.8738, lng: 29.2350 },
      { name: 'Woolworths Secunda', address: 'Secunda Mall', city: 'Secunda', lat: -26.5504, lng: 29.1781 },
      { name: 'Pick n Pay Standerton', address: 'Standerton Plaza', city: 'Standerton', lat: -26.9333, lng: 29.2500 },
    ];

    // Limpopo Province
    const limpopoLockers = [
      { name: 'Pick n Pay Polokwane', address: 'Mall of the North', city: 'Polokwane', lat: -23.9045, lng: 29.4688 },
      { name: 'Checkers Tzaneen', address: 'Tzaneen Lifestyle Centre', city: 'Tzaneen', lat: -23.8326, lng: 30.1640 },
      { name: 'Woolworths Thohoyandou', address: 'Thavhani Mall', city: 'Thohoyandou', lat: -22.9489, lng: 30.4844 },
      { name: 'Pick n Pay Makhado', address: 'Makhado Crossing', city: 'Makhado', lat: -23.0444, lng: 29.9053 },
    ];

    // North West Province
    const northWestLockers = [
      { name: 'Pick n Pay Rustenburg', address: 'Waterfall Mall', city: 'Rustenburg', lat: -25.6670, lng: 27.2417 },
      { name: 'Checkers Klerksdorp', address: 'City Mall', city: 'Klerksdorp', lat: -26.8520, lng: 26.6624 },
      { name: 'Woolworths Potchefstroom', address: 'Mooirivier Mall', city: 'Potchefstroom', lat: -26.7136, lng: 27.0957 },
      { name: 'Pick n Pay Mahikeng', address: 'Mega City', city: 'Mahikeng', lat: -25.8478, lng: 25.6402 },
    ];

    // Free State Province
    const freeStateLockers = [
      { name: 'Pick n Pay Bloemfontein', address: 'Mimosa Mall', city: 'Bloemfontein', lat: -29.0852, lng: 26.1596 },
      { name: 'Checkers Welkom', address: 'Goldfields Mall', city: 'Welkom', lat: -27.9770, lng: 26.7290 },
      { name: 'Woolworths Kroonstad', address: 'Kroonstad Mall', city: 'Kroonstad', lat: -27.6506, lng: 27.2342 },
      { name: 'Pick n Pay Bethlehem', address: 'Bethlehem Plaza', city: 'Bethlehem', lat: -28.2333, lng: 28.3000 },
    ];

    // Northern Cape Province
    const northernCapeLockers = [
      { name: 'Pick n Pay Kimberley', address: 'Diamond Pavilion', city: 'Kimberley', lat: -28.7320, lng: 24.7620 },
      { name: 'Checkers Upington', address: 'Kalahari Mall', city: 'Upington', lat: -28.4478, lng: 21.2561 },
      { name: 'Woolworths Springbok', address: 'Namaqualand Mall', city: 'Springbok', lat: -29.6640, lng: 17.8856 },
    ];

    // Combine all provinces
    const allProvinceData = [
      { lockers: gautengLockers, province: 'Gauteng' },
      { lockers: westernCapeLockers, province: 'Western Cape' },
      { lockers: kznLockers, province: 'KwaZulu-Natal' },
      { lockers: easternCapeLockers, province: 'Eastern Cape' },
      { lockers: mpumalangaLockers, province: 'Mpumalanga' },
      { lockers: limpopoLockers, province: 'Limpopo' },
      { lockers: northWestLockers, province: 'North West' },
      { lockers: freeStateLockers, province: 'Free State' },
      { lockers: northernCapeLockers, province: 'Northern Cape' },
    ];

    // Generate mock locker data for all provinces
    allProvinceData.forEach(({ lockers, province }) => {
      lockers.forEach((locker, index) => {
        const { capacity, available } = generateCapacity();
        const id = `locker_${province.toLowerCase().replace(' ', '_')}_${index + 1}`;

        mockLockers.push({
          id,
          name: locker.name,
          address: locker.address,
          city: locker.city,
          province,
          postal_code: Math.floor(Math.random() * 9000 + 1000).toString(),
          latitude: locker.lat,
          longitude: locker.lng,
          opening_hours: 'Mon-Sun: 8:00-20:00',
          contact_number: `0${Math.floor(Math.random() * 90000000 + 10000000)}`,
          is_active: Math.random() > 0.05, // 95% active
          locker_capacity: capacity,
          available_slots: available,
        });
      });
    });

    console.log(`🎭 Generated ${mockLockers.length} mock lockers across all 9 provinces`);
    return mockLockers;
  }
}

// Export singleton instance
export const lockerService = new LockerService();
