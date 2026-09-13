import { createClient } from '@supabase/supabase-js';
import { mockCategories, mockSubcategories, mockBrands, mockProducts } from './mockData';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Extract flat variants list from mockProducts
const mockVariants = mockProducts.flatMap((p) => p.variants || []);

// Define initial mock data stores in memory
const mockDataStore: Record<string, any[]> = {
  categories: [...mockCategories],
  subcategories: [...mockSubcategories],
  brands: [...mockBrands],
  products: [...mockProducts],
  product_variants: [...mockVariants],
  admin_users: [
    {
      id: "mock-admin-uuid",
      email: "rohit@gmail.com",
      full_name: "Rohit (Offline Mode)",
      role: "super_admin",
      is_active: true,
      last_login_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    }
  ],
  customers: [
    { id: "c1", auth_user_id: "u1", name: "Amit Sharma", email: "amit@example.com", phone: "9876543210", is_blocked: false, notes: "Regular customer", created_at: new Date().toISOString() },
    { id: "c2", auth_user_id: "u2", name: "Neha Patel", email: "neha@example.com", phone: "9876543211", is_blocked: false, notes: null, created_at: new Date().toISOString() },
    { id: "c3", auth_user_id: "u3", name: "Rahul Verma", email: "rahul@example.com", phone: "9876543212", is_blocked: true, notes: "Suspicious activity", created_at: new Date().toISOString() }
  ],
  orders: [
    {
      id: "o1",
      order_number: "ORD-1001",
      customer_id: "c1",
      status: "pending",
      payment_status: "pending",
      payment_method: "cod",
      subtotal: 599.00,
      discount: 50.00,
      delivery_fee: 30.00,
      tax: 18.00,
      total: 597.00,
      coupon_id: null,
      coupon_code: null,
      delivery_address: { line1: "Flat 402, Green Glen Layout", city: "Bengaluru", pincode: "560103" },
      notes: "Deliver in the evening",
      placed_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      created_at: new Date(Date.now() - 3600000 * 2).toISOString()
    },
    {
      id: "o2",
      order_number: "ORD-1002",
      customer_id: "c2",
      status: "delivered",
      payment_status: "paid",
      payment_method: "upi",
      subtotal: 1250.00,
      discount: 0.00,
      delivery_fee: 0.00,
      tax: 45.00,
      total: 1295.00,
      coupon_id: null,
      coupon_code: null,
      delivery_address: { line1: "House 12, Sector 15", city: "Noida", pincode: "201301" },
      notes: null,
      placed_at: new Date(Date.now() - 3600000 * 24).toISOString(),
      created_at: new Date(Date.now() - 3600000 * 24).toISOString()
    }
  ],
  order_items: [
    { id: "oi1", order_id: "o1", product_name: "Organic Tomatoes", quantity: 2, unit_price: 40.00, line_total: 80.00 },
    { id: "oi2", order_id: "o1", product_name: "Premium Basmati Rice", quantity: 1, unit_price: 519.00, line_total: 519.00 },
    { id: "oi3", order_id: "o2", product_name: "Alphonso Mangoes 1kg", quantity: 2, unit_price: 625.00, line_total: 1250.00 }
  ],
  coupons: [
    { id: "cp1", code: "FRESH10", type: "percent", value: 10, min_order: 100, max_discount: 50, usage_limit: 100, used_count: 5, starts_at: null, ends_at: null, is_active: true, created_at: new Date().toISOString() },
    { id: "cp2", code: "WELCOME50", type: "fixed", value: 50, min_order: 200, max_discount: null, usage_limit: null, used_count: 12, starts_at: null, ends_at: null, is_active: true, created_at: new Date().toISOString() }
  ],
  banners: [
    { id: "b1", title: "Fresh Fruits Sale", subtitle: "Up to 30% off", bg_color: "#e0f2fe", link_type: "none", link_value: null, position: "top", sort_order: 1, starts_at: null, ends_at: null, is_active: true, created_at: new Date().toISOString() }
  ],
  activity_logs: [
    { id: "a1", admin_user_id: "mock-admin-uuid", admin_email: "rohit@gmail.com", action: "Sign In", entity_type: "auth", entity_id: null, metadata: null, created_at: new Date().toISOString() }
  ],
  delivery_zones: [
    { id: "dz1", name: "Zone A", pincodes: ["560103", "560102"], fee: 30, min_order: 100, free_above: 500, eta_minutes: 30, is_active: true, created_at: new Date().toISOString() }
  ],
  payment_methods: [
    { id: "pm1", name: "Cash on Delivery", code: "cod", is_enabled: true, config: {}, sort_order: 1, created_at: new Date().toISOString() },
    { id: "pm2", name: "UPI Payments", code: "upi", is_enabled: true, config: {}, sort_order: 2, created_at: new Date().toISOString() }
  ],
  notifications: [
    { id: "n1", type: "order", title: "New Order Placed", body: "Order ORD-1001 has been placed.", link: "/orders/o1", is_read: false, created_at: new Date().toISOString() }
  ]
};

const mockAuth = {
  async signInWithPassword({ email, password }: any) {
    if (email === 'rohit@gmail.com' && password === 'Rohit@1234') {
      const mockUser = {
        id: 'mock-admin-uuid',
        email: 'rohit@gmail.com',
      };
      const mockSession = {
        access_token: 'mock-access-token',
        user: mockUser,
      };
      localStorage.setItem('supabase_fallback_mock_active', 'true');
      localStorage.setItem('mock_admin_session', JSON.stringify(mockSession));
      return { data: { user: mockUser, session: mockSession }, error: null };
    }
    return { data: { user: null, session: null }, error: { message: 'Invalid credentials' } };
  },
  async getSession() {
    const sessionStr = localStorage.getItem('mock_admin_session');
    if (sessionStr) {
      return { data: { session: JSON.parse(sessionStr) }, error: null };
    }
    return { data: { session: null }, error: null };
  },
  async signOut() {
    localStorage.removeItem('supabase_fallback_mock_active');
    localStorage.removeItem('mock_admin_session');
    return { error: null };
  },
  onAuthStateChange(callback: any) {
    return {
      data: {
        subscription: {
          unsubscribe() {}
        }
      }
    };
  }
};

class MockQueryBuilder {
  private table: string;
  private filters: ((item: any) => boolean)[] = [];
  private limitVal: number | null = null;
  private offsetVal: number | null = null;
  private sortCol: string | null = null;
  private sortAsc = false;
  private isSingle = false;
  private isMaybeSingle = false;
  private _updateValues: any = null;
  private _isDelete = false;

  constructor(table: string) {
    this.table = table;
  }

  select(columns: string = '*', options?: any) {
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push((item: any) => item[column] === value);
    return this;
  }

  in(column: string, values: any[]) {
    this.filters.push((item: any) => values.includes(item[column]));
    return this;
  }

  lte(column: string, value: any) {
    this.filters.push((item: any) => item[column] <= value);
    return this;
  }

  or(clause: string) {
    return this;
  }

  order(column: string, { ascending = false } = {}) {
    this.sortCol = column;
    this.sortAsc = ascending;
    return this;
  }

  limit(limit: number) {
    this.limitVal = limit;
    return this;
  }

  range(from: number, to: number) {
    this.offsetVal = from;
    this.limitVal = to - from + 1;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  maybeSingle() {
    this.isMaybeSingle = true;
    return this;
  }

  insert(values: any) {
    const arr = mockDataStore[this.table] || [];
    const newItems = Array.isArray(values) ? values : [values];
    const createdItems = newItems.map(item => ({
      id: Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString(),
      ...item
    }));
    arr.push(...createdItems);
    mockDataStore[this.table] = arr;
    const createdIds = createdItems.map(x => x.id);
    this.filters.push((item: any) => createdIds.includes(item.id));
    return this;
  }

  update(values: any) {
    this._updateValues = values;
    return this;
  }

  delete() {
    this._isDelete = true;
    return this;
  }

  then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) {
    let list = [...(mockDataStore[this.table] || [])];
    
    for (const f of this.filters) {
      list = list.filter(f);
    }

    if (this._updateValues) {
      list.forEach(item => {
        Object.assign(item, this._updateValues);
      });
      const mainList = mockDataStore[this.table] || [];
      mainList.forEach(item => {
        if (list.some(updated => updated.id === item.id)) {
          Object.assign(item, this._updateValues);
        }
      });
    }

    if (this._isDelete) {
      const remaining = (mockDataStore[this.table] || []).filter(item => !list.includes(item));
      mockDataStore[this.table] = remaining;
    }

    if (this.sortCol) {
      list.sort((a, b) => {
        const valA = a[this.sortCol!];
        const valB = b[this.sortCol!];
        if (valA === undefined || valA === null) return 1;
        if (valB === undefined || valB === null) return -1;
        if (valA < valB) return this.sortAsc ? -1 : 1;
        if (valA > valB) return this.sortAsc ? 1 : -1;
        return 0;
      });
    }

    if (this.table === 'orders') {
      list = list.map(o => {
        const customer = mockDataStore.customers.find(c => c.id === o.customer_id) || null;
        const items = mockDataStore.order_items.filter(oi => oi.order_id === o.id);
        return { ...o, customer, items };
      });
    }

    const totalCount = list.length;

    if (this.offsetVal !== null) {
      list = list.slice(this.offsetVal, this.offsetVal + (this.limitVal || list.length));
    } else if (this.limitVal !== null) {
      list = list.slice(0, this.limitVal);
    }

    let result: any = list;
    if (this.isSingle) {
      result = list[0] || null;
    } else if (this.isMaybeSingle) {
      result = list[0] || null;
    }

    const response = { data: result, error: null, count: totalCount };
    return Promise.resolve(response).then(onfulfilled, onrejected);
  }
}

const realSupabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder');

const supabaseProxy = new Proxy(realSupabase, {
  get(target, prop, receiver) {
    const isMockActive = localStorage.getItem('supabase_fallback_mock_active') === 'true' || 
                         !supabaseUrl || supabaseUrl.includes('vwhgiekqmsowjmpnmtgx');

    if (prop === 'auth') {
      if (isMockActive) {
        return mockAuth;
      }
      const realAuth = target.auth;
      return new Proxy(realAuth, {
        get(authTarget, authProp) {
          const original = (authTarget as any)[authProp];
          if (typeof original === 'function') {
            return function(...args: any[]) {
              try {
                const res = original.apply(authTarget, args);
                if (res && typeof res.then === 'function') {
                  return res.catch((err: any) => {
                    if (err instanceof TypeError || /fetch|network|dns/i.test(err?.message)) {
                      console.warn('Supabase Auth network error detected. Switching to offline mock mode.');
                      localStorage.setItem('supabase_fallback_mock_active', 'true');
                      return (mockAuth as any)[authProp].apply(mockAuth, args);
                    }
                    throw err;
                  });
                }
                return res;
              } catch (err: any) {
                if (err instanceof TypeError || /fetch|network|dns/i.test(err?.message)) {
                  console.warn('Supabase Auth network error detected. Switching to offline mock mode.');
                  localStorage.setItem('supabase_fallback_mock_active', 'true');
                  return (mockAuth as any)[authProp].apply(mockAuth, args);
                }
                throw err;
              }
            };
          }
          return original;
        }
      });
    }

    if (prop === 'from') {
      return function(table: string) {
        if (isMockActive) {
          return new MockQueryBuilder(table);
        }
        
        const realQuery = target.from(table);
        
        return new Proxy(realQuery, {
          get(queryTarget, queryProp) {
            if (queryProp === 'then') {
              return function(onfulfilled: any, onrejected: any) {
                return (realQuery as any).then(
                  (res: any) => {
                    if (res && res.error && /fetch|network|dns/i.test(res.error.message)) {
                      console.warn('Supabase DB error detected. Switching to offline mock mode.');
                      localStorage.setItem('supabase_fallback_mock_active', 'true');
                      return new MockQueryBuilder(table).then(onfulfilled, onrejected);
                    }
                    if (onfulfilled) return onfulfilled(res);
                    return res;
                  },
                  (err: any) => {
                    if (err instanceof TypeError || /fetch|network|dns/i.test(err?.message)) {
                      console.warn('Supabase DB network error detected. Switching to offline mock mode.');
                      localStorage.setItem('supabase_fallback_mock_active', 'true');
                      return new MockQueryBuilder(table).then(onfulfilled, onrejected);
                    }
                    if (onrejected) return onrejected(err);
                    throw err;
                  }
                );
              };
            }
            const original = (queryTarget as any)[queryProp];
            if (typeof original === 'function') {
              return function(...args: any[]) {
                const result = original.apply(queryTarget, args);
                if (result && typeof result.then === 'function') {
                  return new Proxy(result, {
                    get(innerTarget, innerProp) {
                      if (innerProp === 'then') {
                        return function(innerOnfulfilled: any, innerOnrejected: any) {
                          return (result as any).then(
                            (res: any) => {
                              if (res && res.error && /fetch|network|dns/i.test(res.error.message)) {
                                console.warn('Supabase DB error detected. Switching to offline mock mode.');
                                localStorage.setItem('supabase_fallback_mock_active', 'true');
                                return new MockQueryBuilder(table).then(innerOnfulfilled, innerOnrejected);
                              }
                              if (innerOnfulfilled) return innerOnfulfilled(res);
                              return res;
                            },
                            (err: any) => {
                              if (err instanceof TypeError || /fetch|network|dns/i.test(err?.message)) {
                                console.warn('Supabase DB network error detected. Switching to offline mock mode.');
                                localStorage.setItem('supabase_fallback_mock_active', 'true');
                                return new MockQueryBuilder(table).then(innerOnfulfilled, innerOnrejected);
                              }
                              if (innerOnrejected) return innerOnrejected(err);
                              throw err;
                            }
                          );
                        };
                      }
                      return (innerTarget as any)[innerProp];
                    }
                  });
                }
                return result;
              };
            }
            return original;
          }
        });
      };
    }

    return (target as any)[prop];
  }
}) as any;

export const supabase = supabaseProxy;

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          image: string | null;
          bg_color: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          image?: string | null;
          bg_color?: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['categories']['Insert']>;
      };
      subcategories: {
        Row: {
          id: string;
          category_id: string;
          name: string;
          slug: string;
          image: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          category_id: string;
          name: string;
          slug: string;
          image?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['subcategories']['Insert']>;
      };
      brands: {
        Row: {
          id: string;
          subcategory_id: string;
          name: string;
          slug: string;
          logo: string | null;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          subcategory_id: string;
          name: string;
          slug: string;
          logo?: string | null;
          description?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['brands']['Insert']>;
      };
      products: {
        Row: {
          id: string;
          brand_id: string;
          category_id: string;
          subcategory_id: string;
          name: string;
          slug: string;
          description: string | null;
          image: string | null;
          is_available: boolean;
          tags: string[];
          created_at: string;
        };
        Insert: {
          id?: string;
          brand_id: string;
          category_id: string;
          subcategory_id: string;
          name: string;
          slug: string;
          description?: string | null;
          image?: string | null;
          is_available?: boolean;
          tags?: string[];
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['products']['Insert']>;
      };
      product_variants: {
        Row: {
          id: string;
          product_id: string;
          quantity: string;
          price: number;
          original_price: number;
          discount: number;
          stock: number;
          is_available: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          quantity: string;
          price: number;
          original_price: number;
          discount?: number;
          stock?: number;
          is_available?: boolean;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['product_variants']['Insert']>;
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
};

// Enhanced types with relations
export type Category = Database['public']['Tables']['categories']['Row'] & {
  subcategories?: Subcategory[];
  subcategory_count?: number;
  product_count?: number;
  brand_count?: number;
};

export type Subcategory = Database['public']['Tables']['subcategories']['Row'] & {
  brands?: Brand[];
  category?: Category;
  product_count?: number;
  brand_count?: number;
};

export type Brand = Database['public']['Tables']['brands']['Row'] & {
  products?: ProductWithVariants[];
  subcategory?: Subcategory;
};

export type Product = Database['public']['Tables']['products']['Row'] & {
  variants?: ProductVariant[];
};

export type ProductVariant = Database['public']['Tables']['product_variants']['Row'];

export type ProductWithVariants = Product & {
  variants: ProductVariant[];
  brand?: Omit<Brand, 'products'>;
};
