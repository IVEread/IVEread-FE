import { getApiBaseUrl, request } from '@/services/api-client';

type UploadImageResponse = {
  url: string;
};

type UploadImageInput = {
  uri: string;
  name?: string | null;
  mimeType?: string | null;
};

const getUploadOrigin = () => {
  const baseUrl = getApiBaseUrl();
  const match = baseUrl.match(/^https?:\/\/[^/]+/i);
  return match ? match[0] : baseUrl;
};

const normalizeUploadUrl = (url: string) => {
  if (/^https?:\/\//i.test(url)) {
    return url;
  }
  const origin = getUploadOrigin();
  const prefix = url.startsWith('/') ? '' : '/';
  return `${origin}${prefix}${url}`;
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
