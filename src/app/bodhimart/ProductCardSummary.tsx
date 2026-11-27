import { Package, Tag } from 'lucide-react';
import { Copy } from './language';

type Summary = {
  weight: number | string | null;
  brand: string | null;
  description: string | null;
};

export function ProductCardSummary({ product }: { product: Summary }) {
  const weight = Number(product.weight);
  const brand = product.brand?.trim();
  const description = product.description?.trim();
  if (!(weight > 0) && !brand && !description) return null;

  return (
    <div className="mt-1 space-y-1 text-xs text-[#526355]">
      {(weight > 0 || brand) && (
        <div className="flex min-w-0 items-center gap-x-2">
          {weight > 0 && (
            <span className="inline-flex shrink-0 items-center gap-1">
              <Package size={12} aria-hidden="true" />
              <span className="sr-only"><Copy en="Pack weight" hi="पैक का वज़न" /> </span>
              {weight.toLocaleString('en-IN')} <Copy en="kg" hi="किग्रा" />
            </span>
          )}
          {brand && (
            <span className="inline-flex min-w-0 items-center gap-1" title={brand}>
              <Tag size={12} className="shrink-0" aria-hidden="true" />
              <span className="sr-only"><Copy en="Brand" hi="ब्रांड" /> </span>
              <span className="truncate">{brand}</span>
            </span>
          )}
        </div>
      )}
      {description && <p className="line-clamp-1 break-words">{description}</p>}
    </div>
  );
}
