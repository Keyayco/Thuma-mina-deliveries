/**
 * Thuma Mina Deliveries — Frontend API Client
 * Connects to the Flask REST API on Render or localhost.
 * Supports JWT token caching in localStorage, Bearer authorization header injection,
 * and realistic client-side fallback simulation for local preview testing.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
const TOKEN_STORAGE_KEY = 'tmd_jwt_access_token';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone_number: string | null;
  role: 'customer' | 'vendor' | 'driver' | 'admin';
  created_at: string;
  addresses?: AddressRecord[];
  driver_profile?: {
    id: string;
    vehicle_type: string;
    is_online: boolean;
    current_orders_count: number;
  };
  vendor_memberships?: Array<{
    vendor_id: string;
    vendor_name: string | null;
    role: string;
  }>;
}

export interface AddressRecord {
  id: string;
  user_id: string;
  label: string;
  township_block: string;
  landmark_description: string;
  street_address: string | null;
  is_default: boolean;
  created_at: string;
}

export interface VendorRecord {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  phone: string;
  email: string | null;
  township_block: string;
  landmark_description: string;
  status: 'pending' | 'active' | 'suspended';
  prep_time_minutes: number;
  is_open: boolean;
  categories?: Array<{
    id: string;
    name: string;
    sort_order: number;
  }>;
}

export interface MenuItemRecord {
  id: string;
  vendor_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price_cents: number;
  image_url: string | null;
  is_available: boolean;
}

export interface HealthResponse {
  status: 'healthy' | 'degraded';
  service: string;
  region: string;
  database: {
    provider: string;
    connected: boolean;
    error: string | null;
  };
}

export interface AuthResponse {
  message: string;
  access_token: string;
  token_type: 'Bearer';
  user: UserProfile;
}

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem(TOKEN_STORAGE_KEY);
  }

  public getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem(TOKEN_STORAGE_KEY);
    }
    return this.token;
  }

  public setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = `${API_BASE_URL.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;

    let response: Response;
    try {
      response = await fetch(url, {
        ...options,
        headers,
      });
    } catch (networkErr: unknown) {
      // If network fetch fails entirely (e.g. backend server is not running or unreachable)
      if (import.meta.env.PROD) {
        console.error(`[TMD API Client] Production network error reaching ${url}:`, networkErr);
        throw new Error(`Unable to connect to Thuma Mina backend service at ${API_BASE_URL}. Please verify service status.`);
      }
      console.warn(`[TMD API Client] Dev server unreachable at ${url}, using local preview simulation:`, networkErr);
      return this.handleFallback<T>(endpoint, options, networkErr);
    }

    let data: any;
    try {
      data = await response.json();
    } catch {
      data = { error: `Server returned non-JSON response (status ${response.status})` };
    }

    if (!response.ok) {
      // When the real backend responds with 4xx or 5xx, throw the server's error message.
      // Do NOT fall back to simulation when the server explicitly rejected the request.
      const errorMsg = data?.error || data?.details || `HTTP error ${response.status}`;
      throw new Error(errorMsg);
    }

    return data as T;
  }

  /**
   * High-fidelity local simulation fallback ensuring full UI interactivity
   * even when remote Flask server URL is not yet bound.
   */
  private handleFallback<T>(endpoint: string, options: RequestInit, originalError: unknown): Promise<T> {
    const method = (options.method || 'GET').toUpperCase();
    const body = options.body ? JSON.parse(options.body as string) : {};

    // 1. Health check fallback
    if (endpoint === 'health' || endpoint === '/health') {
      return Promise.resolve({
        status: 'healthy',
        service: 'thuma-mina-backend (simulation mode)',
        region: 'eu-central-1 (Frankfurt)',
        database: {
          provider: 'Neon PostgreSQL',
          connected: true,
          error: null,
        }
      } as unknown as T);
    }

    // 2. Auth Login fallback
    if (endpoint === 'auth/login' && method === 'POST') {
      const email = body.email || 'customer@tmd.co.za';
      const role = email.includes('admin') ? 'admin' : email.includes('driver') ? 'driver' : email.includes('vendor') ? 'vendor' : 'customer';
      const fakeToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload_${Date.now()}`;
      this.setToken(fakeToken);
      return Promise.resolve({
        message: 'Authentication successful (Simulated)',
        access_token: fakeToken,
        token_type: 'Bearer',
        user: {
          id: 'simulated-user-001',
          email,
          full_name: body.email ? body.email.split('@')[0] : 'Soshanguve Resident',
          phone_number: '+27 82 555 0199',
          role,
          created_at: new Date().toISOString(),
          addresses: [
            {
              id: 'addr-sim-1',
              user_id: 'simulated-user-001',
              label: 'Home',
              township_block: 'Block L',
              landmark_description: 'Opposite Tsako Thabo High School, behind yellow tuckshop',
              street_address: 'Stand 1044',
              is_default: true,
              created_at: new Date().toISOString()
            }
          ]
        }
      } as unknown as T);
    }

    // 3. Auth Register fallback
    if (endpoint === 'auth/register' && method === 'POST') {
      const fakeToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload_${Date.now()}`;
      this.setToken(fakeToken);
      return Promise.resolve({
        message: 'User registered successfully (Simulated)',
        access_token: fakeToken,
        token_type: 'Bearer',
        user: {
          id: `sim-user-${Date.now()}`,
          email: body.email,
          full_name: body.full_name,
          phone_number: body.phone_number || null,
          role: body.role || 'customer',
          created_at: new Date().toISOString(),
          addresses: []
        }
      } as unknown as T);
    }

    // 4. Auth Me fallback
    if (endpoint === 'auth/me' && method === 'GET') {
      return Promise.resolve({
        user: {
          id: 'simulated-user-001',
          email: 'demo@tmd.co.za',
          full_name: 'Demo Soshanguve Customer',
          phone_number: '+27 82 555 0199',
          role: 'customer',
          created_at: new Date().toISOString(),
          addresses: [
            {
              id: 'addr-sim-1',
              user_id: 'simulated-user-001',
              label: 'Home',
              township_block: 'Block L',
              landmark_description: 'Opposite Tsako Thabo High School, behind yellow tuckshop',
              street_address: 'Stand 1044',
              is_default: true,
              created_at: new Date().toISOString()
            }
          ]
        }
      } as unknown as T);
    }

    // 5. Addresses fallback
    if (endpoint === 'users/addresses' && method === 'GET') {
      return Promise.resolve({
        addresses: [
          {
            id: 'addr-sim-1',
            user_id: 'simulated-user-001',
            label: 'Home',
            township_block: 'Block L',
            landmark_description: 'Opposite Tsako Thabo High School, behind yellow tuckshop',
            street_address: 'Stand 1044',
            is_default: true,
            created_at: new Date().toISOString()
          },
          {
            id: 'addr-sim-2',
            user_id: 'simulated-user-001',
            label: "Grandmother's House",
            township_block: 'Block BB',
            landmark_description: 'Next to Falala Community Hall, blue gate',
            street_address: 'House 88',
            is_default: false,
            created_at: new Date().toISOString()
          }
        ]
      } as unknown as T);
    }

    if (endpoint === 'users/addresses' && method === 'POST') {
      return Promise.resolve({
        message: 'Delivery address saved successfully (Simulated)',
        address: {
          id: `addr-sim-${Date.now()}`,
          user_id: 'simulated-user-001',
          label: body.label || 'Home',
          township_block: body.township_block,
          landmark_description: body.landmark_description,
          street_address: body.street_address || null,
          is_default: !!body.is_default,
          created_at: new Date().toISOString()
        }
      } as unknown as T);
    }

    throw originalError;
  }

  // --- SUB-APIS ---

  public auth = {
    register: (payload: { email: string; password: string; full_name: string; phone_number?: string; role?: string }) =>
      this.request<AuthResponse>('auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),

    login: (payload: { email: string; password: string }) =>
      this.request<AuthResponse>('auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),

    getMe: () =>
      this.request<{ user: UserProfile }>('auth/me', {
        method: 'GET',
      }),

    updateProfile: (payload: { full_name?: string; phone_number?: string }) =>
      this.request<{ message: string; user: UserProfile }>('auth/profile', {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),

    changePassword: (payload: { current_password: string; new_password: string }) =>
      this.request<{ message: string }>('auth/change-password', {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),

    verify: () =>
      this.request<{ valid: boolean; user_id: string; role: string; email: string }>('auth/verify', {
        method: 'POST',
      }),

    logout: () => {
      this.setToken(null);
    }
  };

  public addresses = {
    list: () =>
      this.request<{ addresses: AddressRecord[] }>('users/addresses', {
        method: 'GET',
      }),

    create: (payload: {
      township_block: string;
      landmark_description: string;
      label?: string;
      street_address?: string;
      is_default?: boolean;
    }) =>
      this.request<{ message: string; address: AddressRecord }>('users/addresses', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),

    update: (id: string, payload: Partial<AddressRecord>) =>
      this.request<{ message: string; address: AddressRecord }>(`users/addresses/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),

    delete: (id: string) =>
      this.request<{ message: string }>(`users/addresses/${id}`, {
        method: 'DELETE',
      }),

    setDefault: (id: string) =>
      this.request<{ message: string; address: AddressRecord }>(`users/addresses/${id}/default`, {
        method: 'PATCH',
      }),
  };

  public vendors = {
    list: (params?: { block?: string; is_open?: boolean }) => {
      const query = new URLSearchParams();
      if (params?.block) query.append('block', params.block);
      if (params?.is_open !== undefined) query.append('is_open', String(params.is_open));
      const qs = query.toString() ? `?${query.toString()}` : '';
      return this.request<{ count: number; vendors: VendorRecord[] }>(`vendors${qs}`, {
        method: 'GET',
      });
    },

    get: (idOrSlug: string) =>
      this.request<{ vendor: VendorRecord }>(`vendors/${idOrSlug}`, {
        method: 'GET',
      }),

    getMenu: (idOrSlug: string) =>
      this.request<{
        vendor: { id: string; name: string; is_open: boolean; prep_time_minutes: number };
        menu: Array<{
          id: string | null;
          vendor_id: string;
          name: string;
          sort_order: number;
          items: MenuItemRecord[];
        }>;
      }>(`vendors/${idOrSlug}/menu`, {
        method: 'GET',
      }),
  };

  public health = {
    check: () =>
      this.request<HealthResponse>('health', {
        method: 'GET',
      }),
  };
}

export const api = new ApiClient();
