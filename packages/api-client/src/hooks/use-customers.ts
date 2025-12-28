'use client';

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from '@tanstack/react-query';
import { apiGet, apiPost, apiPatch, apiDelete } from '../client';
import type {
  Customer,
  CreateCustomerInput,
  UpdateCustomerInput,
  CustomerListParams,
  PaginatedResponse,
  TimelineEvent,
} from '../types';

// Query Keys
export const customerKeys = {
  all: ['customers'] as const,
  lists: () => [...customerKeys.all, 'list'] as const,
  list: (params: CustomerListParams) => [...customerKeys.lists(), params] as const,
  details: () => [...customerKeys.all, 'detail'] as const,
  detail: (id: string) => [...customerKeys.details(), id] as const,
  timeline: (id: string) => [...customerKeys.detail(id), 'timeline'] as const,
  contacts: (id: string) => [...customerKeys.detail(id), 'contacts'] as const,
};

// Hooks

/**
 * Fetch paginated list of customers
 */
export function useCustomers(
  params: CustomerListParams = {},
  options?: Omit<UseQueryOptions<PaginatedResponse<Customer>>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: customerKeys.list(params),
    queryFn: () =>
      apiGet<PaginatedResponse<Customer>>('/customers', {
        page: params.page,
        limit: params.limit,
        search: params.search,
        level: params.level,
      }),
    ...options,
  });
}

/**
 * Fetch a single customer by ID
 */
export function useCustomer(
  id: string,
  options?: Omit<UseQueryOptions<Customer>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: customerKeys.detail(id),
    queryFn: () => apiGet<Customer>(`/customers/${id}`),
    enabled: !!id,
    ...options,
  });
}

/**
 * Fetch customer timeline
 */
export function useCustomerTimeline(
  id: string,
  options?: Omit<UseQueryOptions<{ data: TimelineEvent[] }>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: customerKeys.timeline(id),
    queryFn: () =>
      apiGet<{ data: TimelineEvent[] }>('/timeline', {
        targetType: 'customer',
        targetId: id,
      }),
    enabled: !!id,
    ...options,
  });
}

/**
 * Create a new customer
 */
export function useCreateCustomer(
  options?: UseMutationOptions<Customer, Error, CreateCustomerInput>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateCustomerInput) =>
      apiPost<Customer>('/customers', input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
    },
    ...options,
  });
}

/**
 * Update an existing customer
 */
export function useUpdateCustomer(
  options?: UseMutationOptions<Customer, Error, { id: string; data: UpdateCustomerInput }>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCustomerInput }) =>
      apiPatch<Customer>(`/customers/${id}`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: customerKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
    },
    ...options,
  });
}

/**
 * Delete a customer
 */
export function useDeleteCustomer(
  options?: UseMutationOptions<void, Error, string>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiDelete(`/customers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
    },
    ...options,
  });
}

