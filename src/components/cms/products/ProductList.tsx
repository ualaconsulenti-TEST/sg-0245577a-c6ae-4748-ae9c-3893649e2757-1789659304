import { useEffect, useMemo, useState } from "react";
import { Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { ProductRow, ProductStatus } from "@/types/uala-cms";
import { formatCurrency, formatDate, isFutureDate } from "./productUtils";

interface ProductListProps {
  products: ProductRow[];
  isLoading: boolean;
  showArchived: boolean;
  onToggleArchived: () => void;
  onPreview: (product: ProductRow) => void;
  onEdit: (product: ProductRow) => void;
  onDuplicate: (product: ProductRow) => void;
  onArchive: (productId: string) => void;
  onPause: (productId: string) => void;
  onReactivate: (productId: string) => void;
  onPermanentDelete: (productId: string) => void;
  onBulkDelete: (productIds: string[]) => Promise<void> | void;
}

const statusClassNames: Record<ProductStatus, string> = {
  bozza: "border-slate-200 bg-slate-100 text-slate-700",
  pubblicato: "border-emerald-200 bg-emerald-50 text-emerald-800",
  in_pausa: "border-amber-200 bg-amber-50 text-amber-800",
  archiviato: "border-zinc-300 bg-zinc-100 text-zinc-700",
};

function StatusBadge({ status }: { status: ProductStatus }) {
  return (
    <Badge variant="outline" className={statusClassNames[status]}>
      {status === "in_pausa" ? "in pausa" : status}
    </Badge>
  );
}

function PriceValue({ value, ivaInclusa }: { value: ProductRow["price"]; ivaInclusa: boolean }) {
  const formattedValue = formatCurrency(value);

  if (formattedValue === "—") {
    return <span>—</span>;
  }

  return (
    <span className="inline-flex flex-col gap-1">
      <span>{formattedValue}</span>
      <span className="text-xs font-medium text-slate-500">{ivaInclusa ? "IVA inclusa" : "+ IVA"}</span>
    </span>
  );
}

export function ProductList({
  products,
  isLoading,
  showArchived,
  onToggleArchived,
  onPreview,
  onEdit,
  onDuplicate,
  onArchive,
  onPause,
  onReactivate,
  onPermanentDelete,
  onBulkDelete,
}: ProductListProps) {
  const visibleProducts = useMemo(() => {
    return showArchived ? products : products.filter((product) => product.status !== "archiviato");
  }, [products, showArchived]);
  const visibleProductIds = useMemo(() => new Set(visibleProducts.map((product) => product.id)), [visibleProducts]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const selectedCount = selectedProductIds.length;

  useEffect(() => {
    setSelectedProductIds((currentIds) => currentIds.filter((productId) => visibleProductIds.has(productId)));
  }, [visibleProductIds]);

  function updateSelectedProduct(productId: string, checked: boolean): void {
    setSelectedProductIds((currentIds) => {
      if (checked) {
        return currentIds.includes(productId) ? currentIds : [...currentIds, productId];
      }

      return currentIds.filter((currentId) => currentId !== productId);
    });
  }

  async function deleteSelectedProducts(): Promise<void> {
    if (selectedCount === 0) {
      return;
    }

    if (!window.confirm(`Vuoi eliminare definitivamente ${selectedCount} prodotti selezionati?`)) {
      return;
    }

    const productIds = [...selectedProductIds];
    setSelectedProductIds([]);
    await onBulkDelete(productIds);
  }

  return (
    <div className="min-w-0 max-w-full space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">Elenco prodotti</h2>
          <p className="mt-1 text-sm text-slate-600">Gli archiviati sono nascosti dall'elenco principale.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {selectedCount > 0 ? (
            <Button type="button" variant="outline" className="w-full border-red-200 text-red-700 hover:bg-red-50 sm:w-auto" onClick={() => void deleteSelectedProducts()}>
              Elimina selezionati ({selectedCount})
            </Button>
          ) : null}
          <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={onToggleArchived}>
            {showArchived ? "Nascondi archiviati" : "Mostra archiviati"}
          </Button>
        </div>
      </div>

      <div className="max-w-full overflow-hidden rounded-2xl border border-fuchsia-200">
        <div className="w-full overflow-x-auto overscroll-x-contain">
          <table className="w-full min-w-[1120px] text-left text-sm">
            <thead className="bg-fuchsia-50 text-xs uppercase tracking-[0.16em] text-slate-600">
              <tr>
                <th className="w-12 px-4 py-3 font-semibold">
                  <span className="sr-only">Seleziona</span>
                </th>
                <th className="px-4 py-3 font-semibold">Nome</th>
                <th className="px-4 py-3 font-semibold">Etichetta promozionale</th>
                <th className="px-4 py-3 font-semibold">Stato</th>
                <th className="px-4 py-3 font-semibold">Prezzo</th>
                <th className="px-4 py-3 font-semibold">Sconto</th>
                <th className="px-4 py-3 font-semibold">Promo</th>
                <th className="min-w-[260px] px-4 py-3 font-semibold">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-fuchsia-100 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    Caricamento prodotti...
                  </td>
                </tr>
              ) : visibleProducts.length > 0 ? (
                visibleProducts.map((product) => (
                  <tr key={product.id} className="align-top text-slate-700">
                    <td className="px-4 py-4">
                      <Checkbox
                        checked={selectedProductIds.includes(product.id)}
                        aria-label={`Seleziona ${product.name || "prodotto"}`}
                        onCheckedChange={(checked) => updateSelectedProduct(product.id, checked === true)}
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-slate-950">{product.name || "—"}</p>
                        {product.in_evidenza ? (
                          <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
                            In evidenza
                          </Badge>
                        ) : null}
                      </div>
                      <p className="mt-1 text-xs text-slate-500">{product.category || "Senza categoria"}</p>
                    </td>
                    <td className="px-4 py-4">{product.badge ? <Badge className="bg-primary text-white">{product.badge}</Badge> : "—"}</td>
                    <td className="px-4 py-4">
                      <StatusBadge status={product.status} />
                    </td>
                    <td className="px-4 py-4">
                      <PriceValue value={product.price} ivaInclusa={product.iva_inclusa} />
                    </td>
                    <td className="px-4 py-4">
                      <PriceValue value={product.discount_price} ivaInclusa={product.iva_inclusa} />
                    </td>
                    <td className="px-4 py-4">
                      {isFutureDate(product.promo_scade_il) ? <span className="text-sm font-medium text-primary">Promo fino al {formatDate(product.promo_scade_il)}</span> : "—"}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex min-w-[240px] flex-col items-start gap-2 sm:flex-row sm:flex-wrap">
                        <Button type="button" size="sm" variant="outline" className="w-full justify-center sm:w-auto" aria-label="Anteprima prodotto" onClick={() => onPreview(product)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button type="button" size="sm" variant="outline" className="w-full justify-center sm:w-auto" onClick={() => onEdit(product)}>
                          Modifica
                        </Button>
                        <Button type="button" size="sm" variant="outline" className="w-full justify-center sm:w-auto" onClick={() => onDuplicate(product)}>
                          Duplica
                        </Button>
                        {product.status === "pubblicato" ? (
                          <Button type="button" size="sm" variant="outline" className="w-full justify-center sm:w-auto" onClick={() => onPause(product.id)}>
                            Metti in pausa
                          </Button>
                        ) : null}
                        {product.status === "in_pausa" ? (
                          <Button type="button" size="sm" variant="outline" className="w-full justify-center sm:w-auto" onClick={() => onReactivate(product.id)}>
                            Riattiva
                          </Button>
                        ) : null}
                        {product.status === "archiviato" ? (
                          <>
                            <Button type="button" size="sm" variant="outline" className="w-full justify-center sm:w-auto" onClick={() => onReactivate(product.id)}>
                              Riattiva
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="w-full justify-center whitespace-nowrap border-slate-950 bg-slate-950 text-white hover:bg-slate-800 hover:text-white sm:w-auto"
                              onClick={() => {
                                const confirmation = window.prompt("Scrivi \"elimina\" per eliminare definitivamente questo prodotto.");

                                if (confirmation === "elimina") {
                                  onPermanentDelete(product.id);
                                }
                              }}
                            >
                              Elimina definitivamente
                            </Button>
                          </>
                        ) : (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="w-full justify-center border-red-200 text-red-700 hover:bg-red-50 sm:w-auto"
                            onClick={() => {
                              if (window.confirm("Vuoi eliminare questo prodotto dall'elenco principale?")) {
                                onArchive(product.id);
                              }
                            }}
                          >
                            Elimina
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    Nessun prodotto da mostrare.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}