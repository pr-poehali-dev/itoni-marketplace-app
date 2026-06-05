import { useState } from 'react';
import Icon from '@/components/ui/icon';

interface Props {
  src?: string | null;
  alt?: string;
  className?: string;
  iconSize?: number;
}

/**
 * Фото объявления. Если фото нет или оно не загрузилось —
 * показывает нейтральную заглушку с иконкой (без шаблонных картинок).
 */
export default function ListingImage({ src, alt = '', className = '', iconSize = 28 }: Props) {
  const [failed, setFailed] = useState(false);
  const show = src && !failed;

  if (!show) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
        <Icon name="ImageOff" size={iconSize} className="text-gray-300" />
      </div>
    );
  }

  return (
    <img
      src={src as string}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
