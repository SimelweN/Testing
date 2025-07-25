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
   * Generate comprehensive mock data representing Courier Guy's extensive locker network of thousands of locations across South Africa
   */
  private getMockLockers(): LockerLocation[] {
    const mockLockers: LockerLocation[] = [];

    // Helper functions
    const generateCapacity = () => {
      const capacity = Math.floor(Math.random() * 50) + 20; // 20-70 capacity
      const available = Math.floor(Math.random() * capacity);
      return { capacity, available };
    };

    const generatePhone = () => `0${Math.floor(Math.random() * 90000000 + 10000000)}`;
    const generatePostalCode = () => Math.floor(Math.random() * 9000 + 1000).toString();

    // Locker types and store names
    const storeTypes = [
      'Pick n Pay', 'Checkers', 'Woolworths', 'Spar', 'Shoprite', 'Clicks',
      'Dis-Chem', 'CNA', 'PEP', 'Ackermans', 'Mr Price', 'Jet', 'Edgars',
      'Game', 'Makro', 'Build It', 'Cashbuild', 'Lewis', 'Foschini', 'Truworths'
    ];

    const pharmacies = ['Clicks', 'Dis-Chem', 'Alpha Pharm', 'Medicare', 'Link Pharmacy'];
    const postOffices = ['Post Office', 'PostNet'];
    const petrolStations = ['Shell', 'BP', 'Caltex', 'Engen', 'Sasol', 'Total'];

    // Comprehensive city and town data by province
    const provinces = {
      'Gauteng': {
        cities: [
          // Major metros
          { name: 'Johannesburg', lat: -26.2041, lng: 28.0473, suburbs: [
            'Sandton', 'Rosebank', 'Hyde Park', 'Melrose', 'Randburg', 'Roodepoort',
            'Fourways', 'Northgate', 'Eastgate', 'Southgate', 'Cresta', 'Clearwater',
            'Sunninghill', 'Midrand', 'Alexandra', 'Soweto', 'Houghton', 'Parktown',
            'Braamfontein', 'Newtown', 'Hillbrow', 'Yeoville', 'Observatory', 'Doornfontein'
          ]},
          { name: 'Pretoria', lat: -25.7479, lng: 28.2293, suburbs: [
            'Menlyn', 'Brooklyn', 'Hatfield', 'Centurion', 'Wonderpark', 'The Grove',
            'Arcadia', 'Sunnyside', 'Waterkloof', 'Lynnwood', 'Garsfontein', 'Faerie Glen'
          ]},
          { name: 'Boksburg', lat: -26.2056, lng: 28.2608, suburbs: ['Eastrand', 'Benoni', 'Springs', 'Kempton Park'] },
          { name: 'Krugersdorp', lat: -26.0910, lng: 27.7718, suburbs: ['Cradlestone', 'Westgate'] },
          { name: 'Germiston', lat: -26.2309, lng: 28.1640, suburbs: ['Alberton', 'Edenvale'] },
          { name: 'Vanderbijlpark', lat: -26.7131, lng: 27.8378, suburbs: ['Vereeniging', 'Sasolburg'] }
        ]
      },
      'Western Cape': {
        cities: [
          { name: 'Cape Town', lat: -33.9249, lng: 18.4241, suburbs: [
            'Canal Walk', 'V&A Waterfront', 'Cavendish', 'Tyger Valley', 'Blue Route',
            'Bayside', 'Claremont', 'Kenilworth', 'Goodwood', 'Bellville', 'Parow',
            'Durbanville', 'Brackenfell', 'Kraaifontein', 'Kuils River', 'Strand',
            'Milnerton', 'Table View', 'Blouberg', 'Century City', 'Gardens', 'Sea Point',
            'Camps Bay', 'Hout Bay', 'Constantia', 'Wynberg', 'Rondebosch', 'Observatory'
          ]},
          { name: 'Stellenbosch', lat: -33.9321, lng: 18.8602, suburbs: ['Eikestad', 'Die Boord'] },
          { name: 'Paarl', lat: -33.7369, lng: 18.9584, suburbs: ['Paarl Mall', 'Wellington'] },
          { name: 'George', lat: -33.9631, lng: 22.4619, suburbs: ['Garden Route', 'Mossel Bay', 'Knysna'] },
          { name: 'Worcester', lat: -33.6467, lng: 19.4481, suburbs: ['Golden Grove'] },
          { name: 'Somerset West', lat: -34.0781, lng: 18.8419, suburbs: ['Somerset Mall', 'Strand'] },
          { name: 'Hermanus', lat: -34.4187, lng: 19.2345, suburbs: ['Onrus', 'Sandbaai'] },
          { name: 'Swellendam', lat: -34.0228, lng: 20.4411, suburbs: [] },
          { name: 'Oudtshoorn', lat: -33.5970, lng: 22.2046, suburbs: [] }
        ]
      },
      'KwaZulu-Natal': {
        cities: [
          { name: 'Durban', lat: -29.8587, lng: 31.0218, suburbs: [
            'Gateway', 'Pavilion', 'La Lucia', 'Musgrave', 'Westville', 'Chatsworth',
            'Pinetown', 'Hillcrest', 'Kloof', 'Amanzimtoti', 'Umlazi', 'Phoenix'
          ]},
          { name: 'Pietermaritzburg', lat: -29.6046, lng: 30.3794, suburbs: ['Liberty Midlands'] },
          { name: 'Newcastle', lat: -27.7574, lng: 29.9317, suburbs: ['Newcastle Mall'] },
          { name: 'Richards Bay', lat: -28.7830, lng: 32.0378, suburbs: ['Boardwalk'] },
          { name: 'Ballito', lat: -29.5392, lng: 31.2136, suburbs: ['Ballito Junction'] },
          { name: 'Empangeni', lat: -28.7624, lng: 31.8951, suburbs: [] },
          { name: 'Ladysmith', lat: -28.5574, lng: 29.7812, suburbs: [] },
          { name: 'Ulundi', lat: -28.3357, lng: 31.4158, suburbs: [] }
        ]
      },
      'Eastern Cape': {
        cities: [
          { name: 'Port Elizabeth', lat: -33.9608, lng: 25.6022, suburbs: ['Greenacres', 'Walmer Park', 'Baywest'] },
          { name: 'East London', lat: -32.9833, lng: 27.8711, suburbs: ['Hemingways', 'Vincent Park'] },
          { name: 'Grahamstown', lat: -33.3047, lng: 26.5328, suburbs: ['Pepper Grove'] },
          { name: 'King Williams Town', lat: -32.8833, lng: 27.4000, suburbs: ['Bhisho'] },
          { name: 'Uitenhage', lat: -33.7581, lng: 25.3970, suburbs: [] },
          { name: 'Queenstown', lat: -31.8977, lng: 26.8753, suburbs: [] },
          { name: 'Cradock', lat: -32.1641, lng: 25.6133, suburbs: [] }
        ]
      },
      'Mpumalanga': {
        cities: [
          { name: 'Nelspruit', lat: -25.4753, lng: 30.9699, suburbs: ['Riverside', 'Ilanga Mall'] },
          { name: 'Witbank', lat: -25.8738, lng: 29.2350, suburbs: ['Highveld Mall', 'Emalahleni'] },
          { name: 'Secunda', lat: -26.5504, lng: 29.1781, suburbs: [] },
          { name: 'Standerton', lat: -26.9333, lng: 29.2500, suburbs: [] },
          { name: 'Middelburg', lat: -25.7756, lng: 29.4644, suburbs: [] },
          { name: 'Ermelo', lat: -26.5278, lng: 29.9797, suburbs: [] }
        ]
      },
      'Limpopo': {
        cities: [
          { name: 'Polokwane', lat: -23.9045, lng: 29.4688, suburbs: ['Mall of the North', 'Savannah'] },
          { name: 'Tzaneen', lat: -23.8326, lng: 30.1640, suburbs: ['Lifestyle Centre'] },
          { name: 'Thohoyandou', lat: -22.9489, lng: 30.4844, suburbs: ['Thavhani Mall'] },
          { name: 'Makhado', lat: -23.0444, lng: 29.9053, suburbs: ['Louis Trichardt'] },
          { name: 'Musina', lat: -22.3448, lng: 30.0446, suburbs: [] },
          { name: 'Giyani', lat: -23.3026, lng: 30.7187, suburbs: [] }
        ]
      },
      'North West': {
        cities: [
          { name: 'Rustenburg', lat: -25.6670, lng: 27.2417, suburbs: ['Waterfall Mall', 'Rustenburg Mall'] },
          { name: 'Klerksdorp', lat: -26.8520, lng: 26.6624, suburbs: ['City Mall'] },
          { name: 'Potchefstroom', lat: -26.7136, lng: 27.0957, suburbs: ['Mooirivier Mall'] },
          { name: 'Mahikeng', lat: -25.8478, lng: 25.6402, suburbs: ['Mega City'] },
          { name: 'Brits', lat: -25.6344, lng: 27.7781, suburbs: [] },
          { name: 'Vryburg', lat: -26.9563, lng: 24.7284, suburbs: [] }
        ]
      },
      'Free State': {
        cities: [
          { name: 'Bloemfontein', lat: -29.0852, lng: 26.1596, suburbs: ['Mimosa Mall', 'Waterfront', 'Loch Logan'] },
          { name: 'Welkom', lat: -27.9770, lng: 26.7290, suburbs: ['Goldfields Mall'] },
          { name: 'Kroonstad', lat: -27.6506, lng: 27.2342, suburbs: [] },
          { name: 'Bethlehem', lat: -28.2333, lng: 28.3000, suburbs: [] },
          { name: 'Sasolburg', lat: -26.8129, lng: 27.8197, suburbs: [] },
          { name: 'Phuthaditjhaba', lat: -28.5226, lng: 28.8186, suburbs: [] }
        ]
      },
      'Northern Cape': {
        cities: [
          { name: 'Kimberley', lat: -28.7320, lng: 24.7620, suburbs: ['Diamond Pavilion'] },
          { name: 'Upington', lat: -28.4478, lng: 21.2561, suburbs: ['Kalahari Mall'] },
          { name: 'Springbok', lat: -29.6640, lng: 17.8856, suburbs: [] },
          { name: 'De Aar', lat: -30.6507, lng: 24.0123, suburbs: [] },
          { name: 'Kuruman', lat: -27.4598, lng: 23.4325, suburbs: [] }
        ]
      }
    };

    // Generate thousands of lockers
    Object.entries(provinces).forEach(([provinceName, provinceData]) => {
      provinceData.cities.forEach(city => {
        // Generate main city lockers
        const cityLockers = this.generateCityLockers(city.name, city.lat, city.lng, provinceName);
        mockLockers.push(...cityLockers);

        // Generate suburb lockers
        if (city.suburbs && city.suburbs.length > 0) {
          city.suburbs.forEach(suburb => {
            const suburbLockers = this.generateSuburbLockers(suburb, city.name, city.lat, city.lng, provinceName);
            mockLockers.push(...suburbLockers);
          });
        }
      });
    });

    console.log(`🎭 Generated ${mockLockers.length} comprehensive mock lockers across South Africa`);
    return mockLockers;
  }

  /**
   * Generate lockers for a specific city
   */
  private generateCityLockers(cityName: string, baseLat: number, baseLng: number, province: string): LockerLocation[] {
    const lockers: LockerLocation[] = [];
    const storeTypes = ['Pick n Pay', 'Checkers', 'Woolworths', 'Spar', 'Shoprite', 'Clicks', 'Dis-Chem'];
    const locations = ['Mall', 'Centre', 'Plaza', 'Square', 'Park', 'Junction', 'Corner', 'Shopping Centre'];

    // Generate 15-30 lockers per major city, 5-15 for smaller cities
    const numLockers = cityName === 'Johannesburg' || cityName === 'Cape Town' || cityName === 'Durban' ?
      Math.floor(Math.random() * 15) + 20 : Math.floor(Math.random() * 10) + 5;

    for (let i = 0; i < numLockers; i++) {
      const store = storeTypes[Math.floor(Math.random() * storeTypes.length)];
      const location = locations[Math.floor(Math.random() * locations.length)];
      const { capacity, available } = this.generateCapacityAndAvailability();

      // Add some randomness to coordinates within city bounds
      const latOffset = (Math.random() - 0.5) * 0.1; // ~10km radius
      const lngOffset = (Math.random() - 0.5) * 0.1;

      lockers.push({
        id: `${province.toLowerCase().replace(' ', '_')}_${cityName.toLowerCase()}_${i + 1}`,
        name: `${store} ${cityName} ${location}`,
        address: `${Math.floor(Math.random() * 999) + 1} ${this.getRandomStreetName()}, ${cityName}`,
        city: cityName,
        province,
        postal_code: this.generatePostalCode(),
        latitude: baseLat + latOffset,
        longitude: baseLng + lngOffset,
        opening_hours: this.getRandomOpeningHours(),
        contact_number: this.generatePhone(),
        is_active: Math.random() > 0.05, // 95% active
        locker_capacity: capacity,
        available_slots: available,
      });
    }

    return lockers;
  }

  /**
   * Generate lockers for suburbs/areas within cities
   */
  private generateSuburbLockers(suburbName: string, cityName: string, baseLat: number, baseLng: number, province: string): LockerLocation[] {
    const lockers: LockerLocation[] = [];
    const storeTypes = ['Pick n Pay', 'Checkers', 'Woolworths', 'Spar', 'Clicks', 'PEP', 'Ackermans'];

    // Generate 3-8 lockers per suburb
    const numLockers = Math.floor(Math.random() * 5) + 3;

    for (let i = 0; i < numLockers; i++) {
      const store = storeTypes[Math.floor(Math.random() * storeTypes.length)];
      const { capacity, available } = this.generateCapacityAndAvailability();

      // Suburb coordinates within city bounds
      const latOffset = (Math.random() - 0.5) * 0.05;
      const lngOffset = (Math.random() - 0.5) * 0.05;

      lockers.push({
        id: `${province.toLowerCase().replace(' ', '_')}_${cityName.toLowerCase()}_${suburbName.toLowerCase().replace(/\s+/g, '_')}_${i + 1}`,
        name: `${store} ${suburbName}`,
        address: `${suburbName} ${this.getRandomLocationName()}, ${cityName}`,
        city: cityName,
        province,
        postal_code: this.generatePostalCode(),
        latitude: baseLat + latOffset,
        longitude: baseLng + lngOffset,
        opening_hours: this.getRandomOpeningHours(),
        contact_number: this.generatePhone(),
        is_active: Math.random() > 0.03, // 97% active for suburbs
        locker_capacity: capacity,
        available_slots: available,
      });
    }

    return lockers;
  }

  /**
   * Helper methods
   */
  private generateCapacityAndAvailability() {
    const capacity = Math.floor(Math.random() * 50) + 20; // 20-70 capacity
    const available = Math.floor(Math.random() * capacity);
    return { capacity, available };
  }

  private generatePhone(): string {
    return `0${Math.floor(Math.random() * 90000000 + 10000000)}`;
  }

  private generatePostalCode(): string {
    return Math.floor(Math.random() * 9000 + 1000).toString();
  }

  private getRandomStreetName(): string {
    const streetNames = [
      'Main Road', 'Church Street', 'Market Street', 'High Street', 'Park Avenue',
      'Oak Street', 'Pine Road', 'Maple Drive', 'Cedar Lane', 'Elm Street',
      'Victoria Street', 'Queen Street', 'King Street', 'Prince Road', 'Duke Avenue',
      'Nelson Mandela Drive', 'OR Tambo Street', 'Jan Smuts Avenue', 'Hendrik Verwoerd Drive'
    ];
    return streetNames[Math.floor(Math.random() * streetNames.length)];
  }

  private getRandomLocationName(): string {
    const locations = [
      'Shopping Centre', 'Mall', 'Plaza', 'Square', 'Centre', 'Market', 'Corner Shop',
      'Pharmacy', 'Supermarket', 'Hypermarket', 'Store', 'Outlet'
    ];
    return locations[Math.floor(Math.random() * locations.length)];
  }

  private getRandomOpeningHours(): string {
    const hours = [
      'Mon-Sun: 8:00-20:00',
      'Mon-Fri: 8:00-18:00, Sat: 8:00-17:00, Sun: 9:00-16:00',
      'Mon-Sun: 7:00-21:00',
      'Mon-Fri: 9:00-17:00, Sat: 9:00-14:00, Sun: Closed',
      'Mon-Sun: 24 hours'
    ];
    return hours[Math.floor(Math.random() * hours.length)];
  }
}

// Export singleton instance
export const lockerService = new LockerService();
