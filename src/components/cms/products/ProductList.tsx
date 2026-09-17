import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ProductRow, ProductStatus } from "@/types/uala-cms";
import { formatCurrency, formatDate, isFutureDate } from "./productUtils";

interface ProductListProps {
  products: ProductRow[];
  isLoading: boolean;
  showArchived: boolean;
  onToggleArchived: () => void;
  onEdit: (product: ProductRow) => void;
  onArchive: (productId: string) => void;
  onPause: (productId: string) => void;
  onReactivate: (productId: string) => void;
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

export function ProductList({
  products,
  isLoading,
  showArchived,
  onToggleArchived,
  onEdit,
  onArchive,
  onPause,
  onReactivate,
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
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-fuchsia-50 text-xs uppercase tracking-[0.16em] text-slate-600">
              <tr>
                <th className="px-4 py-3 font-semibold">Nome</th>
                <th className="px-4 py-3 font-semibold">Badge</th>
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
                      <p className="font-medium text-slate-950">{product.name || "—"}</p>
                      <p className="mt-1 text-xs text-slate-500">{product.category || "Senza categoria"}</p>
                    </td>
                    <td className="px-4 py-4">{product.badge ? <Badge className="bg-primary text-white">{product.badge}</Badge> : "—"}</td>
                    <td className="px-4 py-4">
                      <StatusBadge status={product.status} />
                    </td>
                    <td className="px-4 py-4">{formatCurrency(product.price)}</td>
                    <td className="px-4 py-4">{formatCurrency(product.discount_price)}</td>
                    <td className="px-4 py-4">
                      {isFutureDate(product.promo_scade_il) ? (
                        <span className="text-sm font-medium text-primary">Promo fino al {formatDate(product.promo_scade_il)}</span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" size="sm" variant="outline" onClick={() => onEdit(product)}>
                          Modifica
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