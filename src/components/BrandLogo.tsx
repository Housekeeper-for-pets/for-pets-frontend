import { Link } from 'react-router-dom';

interface BrandLogoProps {
  compact?: boolean;
}

// 포펫츠 로고 텍스트를 브랜드 컬러로 분리해 보여줍니다.
function BrandLogo({ compact = false }: BrandLogoProps) {
  return (
    <Link to="/" className="inline-flex items-baseline gap-1">
      <span
        className={[
          'font-black tracking-tight text-[#2A2622]',
          compact ? 'text-lg' : 'text-2xl',
        ].join(' ')}
      >
        포
      </span>
      <span
        className={[
          'font-black tracking-tight text-[#D96F4F]',
          compact ? 'text-lg' : 'text-2xl',
        ].join(' ')}
      >
        펫
      </span>
      <span
        className={[
          'font-black tracking-tight text-[#2A2622]',
          compact ? 'text-lg' : 'text-2xl',
        ].join(' ')}
      >
        츠
      </span>
    </Link>
  );
}

export default BrandLogo;
