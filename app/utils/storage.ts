// Utilitaire de stockage personnalisé pour améliorer la persistance des sessions
export class CustomStorage {
  private static instance: CustomStorage;
  private storage: Storage | null = null;
  private isReady: boolean = false;

  constructor() {
    this.initializeStorage();
  }

  private async initializeStorage() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        this.storage = window.localStorage;
        this.isReady = true;
        
        // Test de sanité initial
        const isHealthy = await this.isStorageHealthy();
        if (!isHealthy) {
          console.warn('Storage initialization: Storage is not healthy');
        }
      } else {
        console.warn('Storage initialization: localStorage not available');
      }
    } catch (error) {
      console.error('Storage initialization failed:', error);
    }
  }

  static getInstance(): CustomStorage {
    if (!CustomStorage.instance) {
      CustomStorage.instance = new CustomStorage();
    }
    return CustomStorage.instance;
  }

  async getItem(key: string): Promise<string | null> {
    try {
      if (!this.storage || !this.isReady) {
        console.warn('Storage not ready for getItem:', key);
        return null;
      }
      
      const item = this.storage.getItem(key);
      if (item) {
        // Vérifier si l'item est valide JSON pour les clés d'auth
        if (key.includes('auth') || key.includes('session')) {
          try {
            JSON.parse(item);
            return item;
          } catch {
            console.warn('Invalid JSON in storage for key:', key);
            // Nettoyer l'item corrompu
            this.storage.removeItem(key);
            return null;
          }
        }
        return item;
      }
      return null;
    } catch (error) {
      console.warn('Error getting item from storage:', error);
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      if (!this.storage || !this.isReady) {
        console.warn('Storage not ready for setItem:', key);
        return;
      }
      
      // Vérifier que la valeur est valide pour les clés d'auth
      if (key.includes('auth') || key.includes('session')) {
        try {
          JSON.parse(value);
        } catch {
          console.error('Attempting to store invalid JSON for key:', key);
          return;
        }
      }
      
      this.storage.setItem(key, value);
      
      // Vérification immédiate
      const saved = this.storage.getItem(key);
      if (saved !== value) {
        console.warn('Storage verification failed for key:', key);
        throw new Error('Storage verification failed');
      }
    } catch (error) {
      console.error('Error setting item in storage:', error);
      throw error;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      if (!this.storage || !this.isReady) {
        console.warn('Storage not ready for removeItem:', key);
        return;
      }
      this.storage.removeItem(key);
    } catch (error) {
      console.warn('Error removing item from storage:', error);
    }
  }

  // Méthode pour vérifier la sanité du stockage
  async isStorageHealthy(): Promise<boolean> {
    try {
      if (!this.storage) return false;
      
      const testKey = 'yesdate-storage-health-test';
      const testValue = JSON.stringify({ test: 'value', timestamp: Date.now() });
      
      // Test d'écriture
      this.storage.setItem(testKey, testValue);
      
      // Test de lecture
      const retrieved = this.storage.getItem(testKey);
      
      // Test de suppression
      this.storage.removeItem(testKey);
      
      // Vérifier que la valeur récupérée est correcte
      const isValid = retrieved === testValue;
      
      if (!isValid) {
        console.warn('Storage health check failed: value mismatch');
      }
      
      return isValid;
    } catch (error) {
      console.error('Storage health check failed:', error);
      return false;
    }
  }

  // Méthode pour nettoyer les sessions expirées
  async cleanExpiredSessions(): Promise<void> {
    try {
      if (!this.storage || !this.isReady) return;
      
      const authKey = 'yesdate-auth-token';
      const authData = this.storage.getItem(authKey);
      
      if (authData) {
        try {
          const parsed = JSON.parse(authData);
          const expiresAt = parsed.expires_at;
          
          if (expiresAt && new Date(expiresAt * 1000) < new Date()) {
            console.log('Cleaning expired session');
            this.storage.removeItem(authKey);
          }
        } catch (error) {
          console.warn('Error parsing auth data for cleanup, removing corrupted data:', error);
          this.storage.removeItem(authKey);
        }
      }
    } catch (error) {
      console.warn('Error cleaning expired sessions:', error);
    }
  }

  // Méthode pour obtenir le statut du stockage
  getStorageStatus(): { isReady: boolean; isHealthy: Promise<boolean> } {
    return {
      isReady: this.isReady,
      isHealthy: this.isStorageHealthy()
    };
  }

  // Méthode pour forcer la réinitialisation du stockage
  async reinitialize(): Promise<void> {
    this.isReady = false;
    await this.initializeStorage();
  }
}

export const customStorage = CustomStorage.getInstance();