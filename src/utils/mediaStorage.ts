import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';

/**
 * Setlla Persistent Media Storage Utility
 * Uses Supabase Cloud Storage for high-speed cross-device video/photo CDN hosting,
 * with IndexedDB client backup and client-side canvas compression for crisp, lightweight image Data URLs.
 * 
 * Prevents ephemeral blob URL expirations, localStorage 5MB quota errors,
 * and broken media playback across page refreshes and different devices (mobile vs desktop).
 */

const DB_NAME = 'SetllaMediaDB';
const LEGACY_DB_NAME = 'DeltaRentMediaDB';
const DB_VERSION = 1;
const STORE_NAME = 'media_blobs';

export const FALLBACK_PROPERTY_IMAGES = [
  '/images/properties/warri_estate_exterior.jpg',
  '/images/properties/asaba_gra_exterior.jpg',
  '/images/properties/asaba_vacant_living.jpg',
  '/images/properties/vacant_luxury_bedroom.jpg',
  '/images/properties/vacant_luxury_kitchen.jpg',
  '/images/properties/sapele_duplex_exterior.jpg',
  '/images/properties/ughelli_bungalow_exterior.jpg',
  '/images/properties/abraka_delsu_lodge.jpg',
];

export const DEFAULT_FALLBACK_IMAGE = FALLBACK_PROPERTY_IMAGES[0];
// Self-hosted MP4 walkthrough video hosted directly within the application (100% reliable, zero CORS/403 errors)
export const DEFAULT_WALKTHROUGH_VIDEO = '/videos/property-walkthrough.mp4';
export const EXTERNAL_WALKTHROUGH_BACKUP = 'https://assets.codepen.io/6093409/river.mp4';

// Open or initialize the IndexedDB instance
function openDB(dbName = DB_NAME): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported in this environment'));
    }

    const request = window.indexedDB.open(dbName, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Stores a binary Blob in IndexedDB under a unique key
 */
export async function storeBlobInIDB(id: string, blob: Blob, meta?: { type: 'image' | 'video'; name?: string }): Promise<void> {
  try {
    const db = await openDB(DB_NAME);
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put({
        id,
        blob,
        type: meta?.type || (blob.type.startsWith('video/') ? 'video' : 'image'),
        name: meta?.name || id,
        createdAt: Date.now(),
      });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[Setlla Media] Could not store blob in IndexedDB:', err);
  }
}

/**
 * Retrieves a binary Blob from IndexedDB by key
 */
export async function getBlobFromIDB(id: string): Promise<Blob | null> {
  const queryDB = async (dbName: string): Promise<Blob | null> => {
    try {
      const db = await openDB(dbName);
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(id);
        req.onsuccess = () => {
          if (req.result && req.result.blob) {
            resolve(req.result.blob);
          } else {
            resolve(null);
          }
        };
        req.onerror = () => reject(req.error);
      });
    } catch {
      return null;
    }
  };

  try {
    const blob = await queryDB(DB_NAME);
    if (blob) return blob;
    return await queryDB(LEGACY_DB_NAME);
  } catch (err) {
    console.warn('[Setlla Media] Could not read blob from IndexedDB:', err);
    return null;
  }
}

/**
 * Compresses an uploaded image file on the client using HTML5 Canvas
 * Reduces a 5-10MB mobile camera photo into a ~150KB ultra-crisp JPEG Data URL.
 * Data URLs never expire and persist across reloads and storage.
 */
export function compressImageToDataUrl(
  file: File,
  maxWidth = 1280,
  maxHeight = 960,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          // Fallback to original reader result
          resolve(e.target?.result as string || DEFAULT_FALLBACK_IMAGE);
          return;
        }

        // Smooth image rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };

      img.onerror = () => {
        resolve(DEFAULT_FALLBACK_IMAGE);
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      resolve(DEFAULT_FALLBACK_IMAGE);
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Extracts a representative poster snapshot frame (JPEG Data URL) from a video file.
 */
export function captureVideoPoster(file: File): Promise<string> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    const objectUrl = URL.createObjectURL(file);
    let resolved = false;

    const cleanup = () => {
      URL.revokeObjectURL(objectUrl);
      video.remove();
    };

    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        cleanup();
        resolve(DEFAULT_FALLBACK_IMAGE);
      }
    }, 3000);

    video.src = objectUrl;
    video.muted = true;
    video.playsInline = true;
    video.currentTime = 0.5;

    video.onloadeddata = () => {
      // Seek slightly to avoid empty black first frame
      video.currentTime = Math.min(0.5, (video.duration || 1) / 2);
    };

    video.onseeked = () => {
      if (resolved) return;
      try {
        const canvas = document.createElement('canvas');
        canvas.width = Math.min(video.videoWidth || 640, 960);
        canvas.height = Math.min(video.videoHeight || 360, 540);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const posterUrl = canvas.toDataURL('image/jpeg', 0.8);
          resolved = true;
          clearTimeout(timeout);
          cleanup();
          resolve(posterUrl);
          return;
        }
      } catch (err) {
        console.warn('Failed capturing video poster frame', err);
      }
      resolved = true;
      clearTimeout(timeout);
      cleanup();
      resolve(DEFAULT_FALLBACK_IMAGE);
    };

    video.onerror = () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        cleanup();
        resolve(DEFAULT_FALLBACK_IMAGE);
      }
    };
  });
}

export interface ProcessedMedia {
  id: string;
  type: 'image' | 'video';
  url: string;
  poster?: string;
  caption: string;
}

/**
 * Uploads media file (video or photo) directly to Supabase Storage bucket 'property-media'
 * If the bucket is available, returns the permanent public CDN streaming URL.
 */
export async function uploadMediaToSupabaseStorage(file: File | Blob, defaultName?: string): Promise<string | null> {
  const client = getSupabaseClient();
  if (!client || !isSupabaseConfigured()) return null;

  try {
    const rawName = (file instanceof File ? file.name : defaultName) || `media-${Date.now()}.mp4`;
    const ext = rawName.split('.').pop() || (file.type.startsWith('video/') ? 'mp4' : 'jpg');
    const cleanFileName = rawName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `listings/${Date.now()}-${Math.random().toString(36).substring(2, 7)}-${cleanFileName}`;

    const { data, error } = await client.storage.from('property-media').upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: file.type || (ext === 'mp4' ? 'video/mp4' : 'image/jpeg'),
    });

    if (error) {
      console.warn('[Setlla Supabase Storage] Upload notice:', error.message);
      return null;
    }

    if (data?.path) {
      const { data: pubData } = client.storage.from('property-media').getPublicUrl(data.path);
      if (pubData && pubData.publicUrl) {
        console.log('[Setlla Supabase Storage] Successfully uploaded to cloud CDN:', pubData.publicUrl);
        return pubData.publicUrl;
      }
    }
  } catch (err) {
    console.warn('[Setlla Supabase Storage] Upload exception:', err);
  }
  return null;
}

/**
 * Main ingestion handler for uploaded files:
 * 1. For images: compress to lightweight base64 Data URL and back up in IndexedDB + cloud storage if available.
 * 2. For videos: capture crisp poster snapshot frame, upload to Supabase cloud CDN if available, and back up in IndexedDB.
 */
export async function processUploadedFile(file: File, index: number): Promise<ProcessedMedia> {
  const isVideo = file.type.startsWith('video/');
  const id = `media-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 7)}`;
  const caption = file.name.replace(/\.[^/.]+$/, '');

  // Attempt upload to Supabase Storage for universal cross-device playback
  const cloudUrl = await uploadMediaToSupabaseStorage(file);

  if (isVideo) {
    // Generate poster snapshot frame first
    const poster = await captureVideoPoster(file);
    // Store video in IndexedDB for instant local playback
    await storeBlobInIDB(id, file, { type: 'video', name: file.name });
    // Live object URL for current session or cloud streaming URL
    const localUrl = URL.createObjectURL(file);

    return {
      id,
      type: 'video',
      url: cloudUrl || localUrl,
      poster,
      caption,
    };
  } else {
    // Compress image to lightweight Data URL (persists in DB, loads fast on all screens)
    const dataUrl = await compressImageToDataUrl(file);
    // Store in IndexedDB
    await storeBlobInIDB(id, file, { type: 'image', name: file.name });

    return {
      id,
      type: 'image',
      url: cloudUrl || dataUrl,
      caption,
    };
  }
}

/**
 * Ensures media item URLs are valid and active.
 * Guarantees videos always resolve to a playable video stream and never to an image Data URL.
 */
export async function rehydrateMediaItem(item: { id?: string; type: 'image' | 'video'; url: string; poster?: string }): Promise<string> {
  // If it's a video: ensure it is not an image data URL or mixkit
  if (item.type === 'video') {
    if (!item.url || item.url.startsWith('data:image/') || item.url.includes('mixkit.co')) {
      return DEFAULT_WALKTHROUGH_VIDEO;
    }
  }

  // If it's already an external / asset path, it's valid
  if (item.url.startsWith('/') || item.url.startsWith('http://') || item.url.startsWith('https://')) {
    return item.url;
  }

  // If it's a data: URL for an image
  if (item.type === 'image' && item.url.startsWith('data:image/')) {
    return item.url;
  }

  // If it's a blob URL (which may be dead from a previous session):
  if (item.url.startsWith('blob:') && item.id) {
    const blob = await getBlobFromIDB(item.id);
    if (blob) {
      return URL.createObjectURL(blob);
    }
  }

  // Fallback
  if (item.type === 'video') {
    return DEFAULT_WALKTHROUGH_VIDEO;
  }
  return DEFAULT_FALLBACK_IMAGE;
}
