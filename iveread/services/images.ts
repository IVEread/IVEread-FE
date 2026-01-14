import { getApiBaseUrl, request } from '@/services/api-client';

type UploadImageResponse = {
  url: string;
};

type UploadImageInput = {
  uri: string;
  name?: string | null;
  mimeType?: string | null;
};

const isLocalhost = (hostname: string) =>
  hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0';

export const normalizeUploadUrl = (url: string) => {
  const baseUrl = getApiBaseUrl();
  try {
    const base = new URL(baseUrl);
    const resolved = new URL(url, baseUrl);
    const isRelative = !/^https?:\/\//i.test(url);
    const shouldNormalizeHost =
      isRelative || isLocalhost(resolved.hostname) || resolved.hostname === base.hostname;
    if (shouldNormalizeHost) {
      resolved.protocol = base.protocol;
      resolved.hostname = base.hostname;
      resolved.port = '';
    }
    return resolved.toString();
  } catch {
    return url;
  }
};

const getFileName = (uri: string, fallbackMimeType?: string | null) => {
  const lastSegment = uri.split('/').pop();
  if (lastSegment && lastSegment.includes('.')) {
    return lastSegment;
  }
  const extension = fallbackMimeType?.split('/')[1];
  if (extension) {
    return `upload-${Date.now()}.${extension}`;
  }
  return `upload-${Date.now()}.jpg`;
};

export async function uploadImage({ uri, name, mimeType }: UploadImageInput): Promise<string> {
  const formData = new FormData();
  const safeMimeType = mimeType && mimeType.startsWith('image/') ? mimeType : 'image/jpeg';
  const fileName = (name ?? getFileName(uri, safeMimeType)).replace(/\s+/g, '_');

  formData.append(
    'image',
    {
      uri,
      name: fileName,
      type: safeMimeType,
    } as any,
  );

  const response = await request<UploadImageResponse>('/api/images', {
    method: 'POST',
    body: formData,
  });

  if (!response?.url) {
    throw new Error('Upload response missing url.');
  }

  return normalizeUploadUrl(response.url);
}
