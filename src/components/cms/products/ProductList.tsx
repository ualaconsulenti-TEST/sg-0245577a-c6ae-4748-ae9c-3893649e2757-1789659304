import { Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
}: ProductListProps) {
  const visibleProducts = showArchived ? products : products.filter((product) => product.status !== "archiviato");

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">Elenco prodotti</h2>
          <p className="mt-1 text-sm text-slate-600">Gli archiviati sono nascosti dall'elenco principale.</p>
        </div>
        <Button type="button" variant="outline" onClick={onToggleArchived}>
          {showArchived ? "Nascondi archiviati" : "Mostra archiviati"}
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-fuchsia-200">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] text-left text-sm">
            <thead className="bg-fuchsia-50 text-xs uppercase tracking-[0.16em] text-slate-600">
              <tr>
                <th className="px-4 py-3 font-semibold">Nome</th>
                <th className="px-4 py-3 font-semibold">Etichetta promozionale</th>
                <th className="px-4 py-3 font-semibold">Stato</th>
                <th className="px-4 py-3 font-semibold">Prezzo</th>
                <th className="px-4 py-3 font-semibold">Sconto</th>
                <th className="px-4 py-3 font-semibold">Promo</th>
                <th className="px-4 py-3 font-semibold">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-fuchsia-100 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    Caricamento prodotti...
                  </td>
                </tr>
              ) : visibleProducts.length > 0 ? (
                visibleProducts.map((product) => (
                  <tr key={product.id} className="align-top text-slate-700">
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
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" size="sm" variant="outline" aria-label="Anteprima prodotto" onClick={() => onPreview(product)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button type="button" size="sm" variant="outline" onClick={() => onEdit(product)}>
                          Modifica
                        </Button>
                        <Button type="button" size="sm" variant="outline" onClick={() => onDuplicate(product)}>
                          Duplica
                        </Button>
                        {product.status === "pubblicato" ? (
                          <Button type="button" size="sm" variant="outline" onClick={() => onPause(product.id)}>
                            Metti in pausa
                          </Button>
                        ) : null}
                        {product.status === "in_pausa" ? (
                          <Button type="button" size="sm" variant="outline" onClick={() => onReactivate(product.id)}>
                            Riattiva
                          </Button>
                        ) : null}
                        {product.status === "archiviato" ? (
                          <>
                            <Button type="button" size="sm" variant="outline" onClick={() => onReactivate(product.id)}>
                              Riattiva
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="border-slate-950 bg-slate-950 text-white hover:bg-slate-800 hover:text-white"
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
                            className="border-red-200 text-red-700 hover:bg-red-50"
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
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
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