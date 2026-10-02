'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ProductBottleImage, type ProductVisualType } from './ProductBottleImage';

export function ProductThumbnail({ url, type, alt, illustrationLabel = 'Ảnh minh họa' }: {
  url?: string | null; type: ProductVisualType; alt: string; illustrationLabel?: string;
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  if (url && url !== failedUrl) return <Image src={url} alt={alt} width={600} height={450} unoptimized
    className="h-full w-full object-contain" onError={() => setFailedUrl(url)} />;
  return <><ProductBottleImage type={type} alt={alt} /><span className="photo-illustrate-tag">{illustrationLabel}</span></>;
}
