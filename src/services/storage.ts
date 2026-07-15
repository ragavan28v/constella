import { getGoogleAccessToken } from './firebase';

export type ProviderId = 'drive' | 'onedrive' | 'dropbox';

export interface StorageAccountInfo {
  provider: ProviderId;
  email?: string;
  name?: string;
}

export interface StorageNode {
  id: string;
  name: string;
  mimeType: string;
  parentId?: string;
  path?: string;
}

export interface StorageAdapter {
  connect(): Promise<StorageAccountInfo>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  getAccountInfo(): Promise<StorageAccountInfo>;
  createFolder(name: string, parentId?: string): Promise<StorageNode>;
  listFiles(parentId?: string): Promise<StorageNode[]>;
  readFile(fileId: string): Promise<string>;
  writeFile(name: string, content: string, parentId?: string): Promise<StorageNode>;
  updateFile(fileId: string, content: string, metadata?: Partial<{ name: string; parents: string[] }>): Promise<StorageNode>;
  deleteFile(fileId: string): Promise<void>;
  getMetadata(fileId: string): Promise<StorageNode>;
}

class GoogleDriveAdapter implements StorageAdapter {
  private accessToken: string | null = null;
  private connected = false;
  private tokenProvider: () => Promise<string | null>;

  constructor(tokenProvider: () => Promise<string | null>) {
    this.tokenProvider = tokenProvider;
  }

  private async getToken(): Promise<string> {
    const token = await this.tokenProvider();
    if (!token) {
      throw new Error('Google Drive access token is not available.');
    }
    return token;
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    let token = await this.tokenProvider();
    if (!token) {
      throw new Error('Google Drive access token is not available.');
    }

    const doFetch = async (tok: string) => {
      const response = await fetch(`https://www.googleapis.com${path}`, {
        ...init,
        headers: {
          Authorization: `Bearer ${tok}`,
          'Content-Type': 'application/json',
          ...(init?.headers || {})
        }
      });
      return response;
    };

    let response = await doFetch(token);

    // If token was invalid/expired, try getting a fresh token once and retry
    if (response.status === 401) {
      // attempt to refresh token from provider and retry one time
      token = await this.tokenProvider();
      if (!token) {
        const errorText = await response.text();
        throw new Error(`Drive request failed: ${response.status} ${errorText}`);
      }
      response = await doFetch(token);
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Drive request failed: ${response.status} ${errorText}`);
    }

    return response.json() as Promise<T>;
  }

  private async requestText(path: string, init?: RequestInit): Promise<string> {
    const token = await this.getToken();
    const response = await fetch(`https://www.googleapis.com${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(init?.headers || {})
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Drive request failed: ${response.status} ${errorText}`);
    }

    return response.text();
  }

  async connect(): Promise<StorageAccountInfo> {
    this.accessToken = await this.getToken();
    const info = await this.getAccountInfo();
    this.connected = true;
    return info;
  }

  async disconnect(): Promise<void> {
    this.accessToken = null;
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected && Boolean(this.accessToken);
  }

  async getAccountInfo(): Promise<StorageAccountInfo> {
    const payload = await this.request<{ user?: { emailAddress?: string; displayName?: string } }>('/drive/v3/about?fields=user');
    return {
      provider: 'drive',
      email: payload.user?.emailAddress,
      name: payload.user?.displayName
    };
  }

  async createFolder(name: string, parentId?: string): Promise<StorageNode> {
    const payload = await this.request<{ id: string; name: string; mimeType: string }>(
      '/drive/v3/files',
      {
        method: 'POST',
        body: JSON.stringify({
          name,
          mimeType: 'application/vnd.google-apps.folder',
          parents: parentId ? [parentId] : []
        })
      }
    );

    return {
      id: payload.id,
      name: payload.name,
      mimeType: payload.mimeType,
      parentId
    };
  }

  async listFiles(parentId?: string): Promise<StorageNode[]> {
    const query = parentId ? `parents in '${parentId}' and trashed=false` : 'trashed=false';
    const payload = await this.request<{ files?: Array<{ id: string; name: string; mimeType: string; parents?: string[] }> }>(
      `/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,parents)`
    );

    return (payload.files || []).map(file => ({
      id: file.id,
      name: file.name,
      mimeType: file.mimeType,
      parentId: file.parents?.[0]
    }));
  }

  async readFile(fileId: string): Promise<string> {
    return this.requestText(`/drive/v3/files/${fileId}?alt=media`);
  }

  async writeFile(name: string, content: string, parentId?: string): Promise<StorageNode> {
    const metadata = {
      name,
      mimeType: 'application/json',
      parents: parentId ? [parentId] : []
    };

    const formData = new FormData();
    formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    formData.append('file', new Blob([content], { type: 'application/json' }));

    const token = await this.getToken();
    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Drive upload failed: ${response.status} ${errorText}`);
    }

    const payload = (await response.json()) as { id: string; name: string; mimeType: string };
    return {
      id: payload.id,
      name: payload.name,
      mimeType: payload.mimeType,
      parentId
    };
  }

  async updateFile(fileId: string, content: string, metadata?: Partial<{ name: string; parents: string[] }>): Promise<StorageNode> {
    // Drive API does not allow updating `parents` in the request body for updates.
    // Use addParents/removeParents query parameters instead.
    const token = await this.getToken();

    // Prepare metadata without parents for the body
    const bodyMetadata: any = metadata ? { ...metadata } : undefined;
    delete bodyMetadata?.parents;

    // If caller provided desired parents, compute add/remove lists
    let addParentsParam = '';
    let removeParentsParam = '';
    if (metadata?.parents) {
      // fetch current parents
      try {
        const current = await this.request<{ parents?: string[] }>(`/drive/v3/files/${fileId}?fields=parents`);
        const currentParents = current.parents || [];
        const desired = metadata.parents || [];
        const toAdd = desired.filter(p => !currentParents.includes(p));
        const toRemove = currentParents.filter(p => !desired.includes(p));
        if (toAdd.length) addParentsParam = `&addParents=${encodeURIComponent(toAdd.join(','))}`;
        if (toRemove.length) removeParentsParam = `&removeParents=${encodeURIComponent(toRemove.join(','))}`;
      } catch (err) {
        // If fetching current parents fails, continue without parent changes
        addParentsParam = '';
        removeParentsParam = '';
      }
    }

    const url = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart${addParentsParam}${removeParentsParam}`;

    const formData = new FormData();
    if (bodyMetadata) {
      formData.append('metadata', new Blob([JSON.stringify(bodyMetadata)], { type: 'application/json' }));
    }
    formData.append('file', new Blob([content], { type: 'application/json' }));

    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Drive update failed: ${response.status} ${errorText}`);
    }

    const payload = (await response.json()) as { id: string; name: string; mimeType: string; parents?: string[] };
    return {
      id: payload.id,
      name: payload.name,
      mimeType: payload.mimeType,
      parentId: payload.parents?.[0]
    };
  }

  async deleteFile(fileId: string): Promise<void> {
    await this.request<void>(`/drive/v3/files/${fileId}`, {
      method: 'DELETE'
    });
  }

  async getMetadata(fileId: string): Promise<StorageNode> {
    const payload = await this.request<{ id: string; name: string; mimeType: string; parents?: string[] }>('/drive/v3/files/' + fileId + '?fields=id,name,mimeType,parents');
    return {
      id: payload.id,
      name: payload.name,
      mimeType: payload.mimeType,
      parentId: payload.parents?.[0]
    };
  }
}

class CloudStorageEngine {
  private adapter: StorageAdapter | null = null;
  private rootFolderId: string | null = null;

  async connect(provider: ProviderId): Promise<StorageAccountInfo> {
    if (provider === 'drive') {
      this.adapter = new GoogleDriveAdapter(async () => getGoogleAccessToken());
    } else {
      throw new Error(`Provider ${provider} is not available yet in this milestone.`);
    }

    const info = await this.adapter.connect();
    return info;
  }

  async disconnect(): Promise<void> {
    if (!this.adapter) return;
    await this.adapter.disconnect();
    this.adapter = null;
    this.rootFolderId = null;
  }

  isConnected(): boolean {
    return Boolean(this.adapter?.isConnected());
  }

  async initializeUniverse(universeName: string): Promise<{ rootFolderId: string | null }> {
    if (!this.adapter) {
      throw new Error('No storage adapter connected.');
    }

    const root = await this.ensureFolder('Constella');
    this.rootFolderId = root.id;

    await this.writeJsonFile('manifest.json', {
      schemaVersion: 1,
      universeId: 'constella-universe',
      universeName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      spaces: []
    }, root.id);

    await this.writeJsonFile('settings/settings.json', {
      provider: 'drive',
      connectedAt: new Date().toISOString(),
      appMode: 'cloud-first'
    }, root.id);

    return { rootFolderId: this.rootFolderId };
  }

  async readJsonFile(relativePath: string, parentId?: string): Promise<unknown> {
    if (!this.adapter) {
      throw new Error('No storage adapter connected.');
    }

    const pathSegments = relativePath.split('/').filter(Boolean);
    const fileName = pathSegments.pop();

    if (!fileName) {
      throw new Error('A file name is required.');
    }

    const targetParentId = await this.ensureFolderPath(pathSegments, parentId);
    const file = await this.findChildFile(fileName, targetParentId);
    if (!file) {
      throw new Error(`File not found: ${relativePath}`);
    }

    const content = await this.adapter.readFile(file.id);
    return JSON.parse(content);
  }

  async writeJsonFile(relativePath: string, payload: unknown, parentId?: string): Promise<StorageNode> {
    if (!this.adapter) {
      throw new Error('No storage adapter connected.');
    }

    const pathSegments = relativePath.split('/').filter(Boolean);
    const fileName = pathSegments.pop();

    if (!fileName) {
      throw new Error('A file name is required.');
    }

    const targetParentId = await this.ensureFolderPath(pathSegments, parentId);
    const existingFile = await this.findChildFile(fileName, targetParentId);
    const content = JSON.stringify(payload, null, 2);

    if (existingFile) {
      return this.adapter.updateFile(existingFile.id, content, { name: fileName, parents: targetParentId ? [targetParentId] : [] });
    }

    return this.adapter.writeFile(fileName, content, targetParentId);
  }

  async ensureFolderPath(pathSegments: string[], parentId?: string): Promise<string> {
    if (!this.adapter) {
      throw new Error('No storage adapter connected.');
    }

    let currentParentId = parentId ?? this.rootFolderId ?? undefined;
    for (const segment of pathSegments) {
      const folder = await this.ensureFolder(segment, currentParentId);
      currentParentId = folder.id;
    }
    return currentParentId ?? this.rootFolderId ?? '';
  }

  async ensureFolder(name: string, parentId?: string): Promise<StorageNode> {
    if (!this.adapter) {
      throw new Error('No storage adapter connected.');
    }

    const existing = await this.findChildFolder(name, parentId);
    if (existing) {
      return existing;
    }

    return this.adapter.createFolder(name, parentId);
  }

  private async findChildFolder(name: string, parentId?: string): Promise<StorageNode | null> {
    if (!this.adapter) {
      return null;
    }

    const children = await this.adapter.listFiles(parentId);
    return children.find(file => file.name === name && file.mimeType === 'application/vnd.google-apps.folder') || null;
  }

  private async findChildFile(name: string, parentId?: string): Promise<StorageNode | null> {
    if (!this.adapter) {
      return null;
    }

    const children = await this.adapter.listFiles(parentId);
    return children.find(file => file.name === name && file.mimeType === 'application/json') || null;
  }
}

export const cloudStorageEngine = new CloudStorageEngine();
