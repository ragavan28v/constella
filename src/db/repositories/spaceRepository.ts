import type { Space } from '../../types';
import {
  getAllSpaces,
  getSpaceById,
  createSpace,
  updateSpace,
  deleteSpace
} from '../../services/cloudRepository';

export const spaceRepository = {
  async getAll(): Promise<Space[]> {
    return getAllSpaces();
  },

  async getById(id: string): Promise<Space | undefined> {
    return getSpaceById(id);
  },

  async create(space: Space): Promise<string> {
    return createSpace(space);
  },

  async update(id: string, changes: Partial<Space>): Promise<number> {
    return updateSpace(id, changes);
  },

  async delete(id: string): Promise<void> {
    return deleteSpace(id);
  }
};
