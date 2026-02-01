import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Import after mocking
import { templatesApi } from '@/lib/api';

describe('templatesApi', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('create', () => {
    it('creates a new template', async () => {
      const mockTemplate = {
        id: 'template-1',
        name: 'Test Template',
        text: 'Test prompt',
        attributes: { style: 'electronic' },
      };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockTemplate),
      });

      const result = await templatesApi.create({
        name: 'Test Template',
        text: 'Test prompt',
        attributes: { style: 'electronic' },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/templates',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
      expect(result).toEqual(mockTemplate);
    });
  });

  describe('get', () => {
    it('gets a template by id', async () => {
      const mockTemplate = { id: 'template-1', name: 'Test Template' };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockTemplate),
      });

      const result = await templatesApi.get('template-1');

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/templates/template-1',
        expect.any(Object)
      );
      expect(result).toEqual(mockTemplate);
    });
  });

  describe('list', () => {
    it('lists templates with default params', async () => {
      const mockResponse = { items: [], total: 0, page: 1, limit: 20 };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await templatesApi.list();

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/templates',
        expect.any(Object)
      );
      expect(result).toEqual(mockResponse);
    });

    it('lists templates with category filter', async () => {
      const mockResponse = { items: [], total: 0, page: 1, limit: 20 };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await templatesApi.list({ category: 'electronic' });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/templates?category=electronic',
        expect.any(Object)
      );
    });

    it('lists templates with system filter', async () => {
      const mockResponse = { items: [], total: 0, page: 1, limit: 20 };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await templatesApi.list({ is_system: true });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/templates?is_system=true',
        expect.any(Object)
      );
    });

    it('lists templates with pagination', async () => {
      const mockResponse = { items: [], total: 0, page: 2, limit: 10 };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await templatesApi.list({ page: 2, limit: 10 });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/templates?page=2&limit=10',
        expect.any(Object)
      );
    });
  });

  describe('update', () => {
    it('updates a template', async () => {
      const mockTemplate = { id: 'template-1', name: 'Updated Template' };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockTemplate),
      });

      const result = await templatesApi.update('template-1', { name: 'Updated Template' });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/templates/template-1',
        expect.objectContaining({
          method: 'PUT',
        })
      );
      expect(result).toEqual(mockTemplate);
    });
  });

  describe('delete', () => {
    it('deletes a template', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 204,
        json: () => Promise.resolve({}),
      });

      await templatesApi.delete('template-1');

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/templates/template-1',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });

  describe('listCategories', () => {
    it('lists all categories', async () => {
      const mockCategories = ['electronic', 'jazz', 'classical'];
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockCategories),
      });

      const result = await templatesApi.listCategories();

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/templates/categories/list',
        expect.any(Object)
      );
      expect(result).toEqual(mockCategories);
    });
  });
});
