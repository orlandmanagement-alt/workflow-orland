/**
 * Infrastructure Service
 * Handles equipment catalog, rental, and procurement operations
 */

import { api } from '@/lib/api';
import { AxiosError } from 'axios';

export interface InfraItem {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  currency: string;
  unit: string;
  image_url?: string;
  availability: number;
  vendor_id: string;
  vendor_name: string;
  specs?: Record<string, any>;
}

export interface CartItem {
  item_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface InfraOrder {
  id: string;
  project_id: string;
  items: CartItem[];
  total_amount: number;
  status: 'draft' | 'pending' | 'confirmed' | 'delivered' | 'cancelled';
  delivery_date?: string;
  notes?: string;
  created_at: string;
}

export interface InfraApiResponse {
  status: 'success' | 'error';
  data?: any;
  error?: string;
  message?: string;
}

class InfraService {
  /**
   * Get infrastructure catalog
   */
  async getCatalog(filters?: {
    category?: string;
    vendor?: string;
    limit?: number;
    offset?: number;
  }): Promise<InfraItem[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.category) params.set('category', filters.category);
      if (filters?.vendor) params.set('vendor', filters.vendor);
      if (filters?.limit) params.set('limit', filters.limit.toString());
      if (filters?.offset) params.set('offset', filters.offset.toString());

      const response = await api.get<InfraApiResponse>(`/infra/catalog?${params}`, {
        withCredentials: true,
      });

      if (response.data?.status === 'success' && response.data?.data) {
        return response.data.data;
      }

      return [];
    } catch (err) {
      console.error('Failed to fetch infra catalog:', err);
      return [];
    }
  }

  /**
   * Get single item details
   */
  async getItem(itemId: string): Promise<InfraItem | null> {
    try {
      const response = await api.get<InfraApiResponse>(`/infra/items/${itemId}`, {
        withCredentials: true,
      });

      if (response.data?.status === 'success' && response.data?.data) {
        return response.data.data;
      }

      return null;
    } catch (err) {
      console.error('Failed to fetch infra item:', err);
      return null;
    }
  }

  /**
   * Create a new infra order (from cart)
   */
  async createOrder(
    projectId: string,
    items: CartItem[],
    notes?: string
  ): Promise<InfraApiResponse> {
    try {
      const response = await api.post<InfraApiResponse>(
        `/infra/orders`,
        {
          project_id: projectId,
          items,
          notes,
          status: 'pending',
          created_at: new Date().toISOString(),
        },
        { withCredentials: true }
      );

      return response.data;
    } catch (err) {
      const errorResponse: InfraApiResponse = {
        status: 'error',
        error: (err as AxiosError).message || 'Failed to create order',
      };
      return errorResponse;
    }
  }

  /**
   * Get user's infra orders
   */
  async getMyOrders(projectId?: string): Promise<InfraOrder[]> {
    try {
      const params = new URLSearchParams();
      if (projectId) params.set('project_id', projectId);

      const response = await api.get<InfraApiResponse>(`/infra/orders?${params}`, {
        withCredentials: true,
      });

      if (response.data?.status === 'success' && response.data?.data) {
        return response.data.data;
      }

      return [];
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      return [];
    }
  }

  /**
   * Get order details
   */
  async getOrder(orderId: string): Promise<InfraOrder | null> {
    try {
      const response = await api.get<InfraApiResponse>(`/infra/orders/${orderId}`, {
        withCredentials: true,
      });

      if (response.data?.status === 'success' && response.data?.data) {
        return response.data.data;
      }

      return null;
    } catch (err) {
      console.error('Failed to fetch order:', err);
      return null;
    }
  }

  /**
   * Update order
   */
  async updateOrder(
    orderId: string,
    updates: Partial<InfraOrder>
  ): Promise<InfraApiResponse> {
    try {
      const response = await api.patch<InfraApiResponse>(
        `/infra/orders/${orderId}`,
        updates,
        { withCredentials: true }
      );

      return response.data;
    } catch (err) {
      const errorResponse: InfraApiResponse = {
        status: 'error',
        error: (err as AxiosError).message || 'Failed to update order',
      };
      return errorResponse;
    }
  }

  /**
   * Cancel order
   */
  async cancelOrder(orderId: string, reason?: string): Promise<InfraApiResponse> {
    try {
      const response = await api.patch<InfraApiResponse>(
        `/infra/orders/${orderId}`,
        {
          status: 'cancelled',
          cancellation_reason: reason,
          cancelled_at: new Date().toISOString(),
        },
        { withCredentials: true }
      );

      return response.data;
    } catch (err) {
      const errorResponse: InfraApiResponse = {
        status: 'error',
        error: (err as AxiosError).message || 'Failed to cancel order',
      };
      return errorResponse;
    }
  }

  /**
   * Get vendor list
   */
  async getVendors(category?: string): Promise<any[]> {
    try {
      const params = new URLSearchParams();
      if (category) params.set('category', category);

      const response = await api.get<InfraApiResponse>(`/infra/vendors?${params}`, {
        withCredentials: true,
      });

      if (response.data?.status === 'success' && response.data?.data) {
        return response.data.data;
      }

      return [];
    } catch (err) {
      console.error('Failed to fetch vendors:', err);
      return [];
    }
  }

  /**
   * Get infrastruktur categories
   */
  async getCategories(): Promise<string[]> {
    try {
      const response = await api.get<InfraApiResponse>(`/infra/categories`, {
        withCredentials: true,
      });

      if (response.data?.status === 'success' && response.data?.data) {
        return response.data.data;
      }

      return [
        'Stage & Podium',
        'Audio Visual',
        'Lighting',
        'Furniture',
        'Decoration',
        'Supplies',
      ];
    } catch (err) {
      console.error('Failed to fetch categories:', err);
      return [];
    }
  }

  /**
   * Local cart management (localStorage)
   */
  private getCartKey(projectId: string): string {
    return `infra_cart_${projectId}`;
  }

  /**
   * Get cart from localStorage
   */
  getCart(projectId: string): CartItem[] {
    try {
      const key = this.getCartKey(projectId);
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : [];
    } catch (err) {
      console.error('Failed to get cart:', err);
      return [];
    }
  }

  /**
   * Save cart to localStorage
   */
  saveCart(projectId: string, items: CartItem[]): void {
    try {
      const key = this.getCartKey(projectId);
      localStorage.setItem(key, JSON.stringify(items));
    } catch (err) {
      console.error('Failed to save cart:', err);
    }
  }

  /**
   * Add item to cart
   */
  addToCart(projectId: string, item: CartItem): CartItem[] {
    const cart = this.getCart(projectId);
    const existing = cart.find((c) => c.item_id === item.item_id);

    if (existing) {
      existing.quantity += item.quantity;
      existing.subtotal = existing.quantity * existing.unit_price;
    } else {
      cart.push(item);
    }

    this.saveCart(projectId, cart);
    return cart;
  }

  /**
   * Remove item from cart
   */
  removeFromCart(projectId: string, itemId: string): CartItem[] {
    const cart = this.getCart(projectId).filter((c) => c.item_id !== itemId);
    this.saveCart(projectId, cart);
    return cart;
  }

  /**
   * Update item quantity
   */
  updateCartItem(
    projectId: string,
    itemId: string,
    quantity: number
  ): CartItem[] {
    const cart = this.getCart(projectId);
    const item = cart.find((c) => c.item_id === itemId);

    if (item) {
      item.quantity = quantity;
      item.subtotal = quantity * item.unit_price;
      this.saveCart(projectId, cart);
    }

    return cart;
  }

  /**
   * Clear cart
   */
  clearCart(projectId: string): void {
    const key = this.getCartKey(projectId);
    localStorage.removeItem(key);
  }

  /**
   * Get cart total
   */
  getCartTotal(projectId: string): number {
    const cart = this.getCart(projectId);
    return cart.reduce((sum, item) => sum + item.subtotal, 0);
  }
}

export const infraService = new InfraService();
