export interface RegistryBackend {
  get(key: string): Promise<string | null>;
  put(key: string, body: string, contentType?: string): Promise<void>;
}
