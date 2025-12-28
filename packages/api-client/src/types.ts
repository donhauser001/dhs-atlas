/**
 * API Types - Shared type definitions for API responses
 */

// Pagination
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}

// Customer
export interface Customer {
  id: string;
  enterpriseId: string;
  name: string;
  type: 'company' | 'individual';
  level: 'normal' | 'important' | 'vip';
  status: 'active' | 'inactive' | 'archived';
  industry?: string | null;
  address?: string | null;
  website?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerInput {
  name: string;
  type?: 'company' | 'individual';
  level?: 'normal' | 'important' | 'vip';
  industry?: string;
  address?: string;
  website?: string;
  notes?: string;
}

export interface UpdateCustomerInput {
  name?: string;
  type?: 'company' | 'individual';
  level?: 'normal' | 'important' | 'vip';
  status?: 'active' | 'inactive' | 'archived';
  industry?: string;
  address?: string;
  website?: string;
  notes?: string;
}

export interface CustomerListParams {
  page?: number;
  limit?: number;
  search?: string;
  level?: 'normal' | 'important' | 'vip';
}

// Service
export interface Service {
  id: string;
  enterpriseId: string;
  name: string;
  description?: string | null;
  serviceType: string;
  status: 'draft' | 'active' | 'archived';
  pricingModel: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateServiceInput {
  name: string;
  description?: string;
  serviceType: string;
  pricingModel?: Record<string, unknown>;
}

export interface UpdateServiceInput {
  name?: string;
  description?: string;
  status?: 'draft' | 'active' | 'archived';
  pricingModel?: Record<string, unknown>;
}

export interface ServiceListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'draft' | 'active' | 'archived';
}

// Order
export type OrderStatus = 'draft' | 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

export interface OrderItem {
  id: string;
  orderId: string;
  serviceId?: string | null;
  serviceName: string;
  quantity: string;
  unitPrice: string;
  amount: string;
}

export interface Order {
  id: string;
  enterpriseId: string;
  orderNo: string;
  customerId: string;
  quoteId?: string | null;
  status: OrderStatus;
  totalAmount: string;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  items?: OrderItem[];
}

export interface CreateOrderInput {
  customerId: string;
  notes?: string;
  items?: {
    serviceId?: string;
    serviceName: string;
    quantity?: string;
    unitPrice: string;
  }[];
}

export interface OrderListParams {
  page?: number;
  limit?: number;
  customerId?: string;
  status?: OrderStatus;
}

// Quote
export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'converted';

export interface QuoteItem {
  id: string;
  quoteId: string;
  serviceId?: string | null;
  serviceName: string;
  description?: string | null;
  quantity: string;
  unitPrice: string;
  amount: string;
}

export interface Quote {
  id: string;
  enterpriseId: string;
  quoteNo: string;
  customerId: string;
  status: QuoteStatus;
  totalAmount: string;
  validUntil?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  items?: QuoteItem[];
}

export interface CreateQuoteInput {
  customerId: string;
  validUntil?: string;
  notes?: string;
  items?: {
    serviceId?: string;
    serviceName: string;
    description?: string;
    quantity?: string;
    unitPrice: string;
  }[];
}

export interface QuoteListParams {
  page?: number;
  limit?: number;
  customerId?: string;
  status?: QuoteStatus;
}

// Project
export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';

export interface Project {
  id: string;
  enterpriseId: string;
  name: string;
  customerId: string;
  orderId?: string | null;
  status: ProjectStatus;
  startDate?: string | null;
  endDate?: string | null;
  phases?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectInput {
  name: string;
  customerId: string;
  orderId?: string;
  startDate?: string;
  endDate?: string;
}

export interface ProjectListParams {
  page?: number;
  limit?: number;
  customerId?: string;
  status?: ProjectStatus;
}

// Deliverable
export type DeliverableStatus = 'pending' | 'in_progress' | 'submitted' | 'approved' | 'rejected';

export interface Deliverable {
  id: string;
  enterpriseId: string;
  projectId: string;
  name: string;
  description?: string | null;
  status: DeliverableStatus;
  dueDate?: string | null;
  submittedAt?: string | null;
  approvedAt?: string | null;
  reviewNotes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDeliverableInput {
  projectId: string;
  name: string;
  description?: string;
  dueDate?: string;
}

export interface DeliverableListParams {
  page?: number;
  limit?: number;
  projectId?: string;
  status?: DeliverableStatus;
}

// Timeline Event
export interface TimelineEvent {
  id: string;
  enterpriseId: string;
  eventType: string;
  actorType: 'user' | 'system' | 'ai';
  actorId?: string | null;
  targetType: string;
  targetId: string;
  payload?: Record<string, unknown>;
  createdAt: string;
}

export interface TimelineParams {
  targetType?: string;
  targetId?: string;
  limit?: number;
}

// API Error
export interface ApiError {
  error: string;
  code: string;
}

