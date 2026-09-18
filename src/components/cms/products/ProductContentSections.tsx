import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ProductBenefitDraft, ProductFaqDraft, ProductFormValues, ProductHighlightDraft } from "@/types/uala-cms";

interface ProductContentSectionsProps {
  form: ProductFormValues;
  onChange: (form: ProductFormValues) => void;
}

function withPositions<T extends { position: number }>(items: T[]): T[] {
  return items.map((item, index) => ({ ...item, position: index }));
}

function moveItem<T extends { position: number }>(items: T[], index: number, direction: -1 | 1): T[] {
  const nextIndex = index + direction;

  if (nextIndex < 0 || nextIndex >= items.length) {
    return items;
  }

  const nextItems = [...items];
  const currentItem = nextItems[index];
  nextItems[index] = nextItems[nextIndex];
  nextItems[nextIndex] = currentItem;

  return withPositions(nextItems);
}

export function ProductContentSections({ form, onChange }: ProductContentSectionsProps) {
  function updateForm(nextValues: Partial<ProductFormValues>): void {
    onChange({ ...form, ...nextValues });
  }

  function addBenefit(): void {
    updateForm({ benefits: [...form.benefits, { text: "", position: form.benefits.length }] });
  }

  function updateBenefit(index: number, text: string): void {
    updateForm({ benefits: form.benefits.map((benefit, benefitIndex) => (benefitIndex === index ? { ...benefit, text } : benefit)) });
  }

  function removeBenefit(index: number): void {
    updateForm({ benefits: withPositions(form.benefits.filter((_, benefitIndex) => benefitIndex !== index)) });
  }

  function moveBenefit(index: number, direction: -1 | 1): void {
    updateForm({ benefits: moveItem(form.benefits, index, direction) });
  }

  function addHighlight(): void {
    updateForm({ highlights: [...form.highlights, { icon: "✨", title: "", description: "", position: form.highlights.length }] });
  }

  function updateHighlight(index: number, values: Partial<ProductHighlightDraft>): void {
    updateForm({ highlights: form.highlights.map((highlight, highlightIndex) => (highlightIndex === index ? { ...highlight, ...values } : highlight)) });
  }

  function removeHighlight(index: number): void {
    updateForm({ highlights: withPositions(form.highlights.filter((_, highlightIndex) => highlightIndex !== index)) });
  }

  function moveHighlight(index: number, direction: -1 | 1): void {
    updateForm({ highlights: moveItem(form.highlights, index, direction) });
  }

  function addFaq(): void {
    updateForm({ faqs: [...form.faqs, { question: "", answer: "", position: form.faqs.length }] });
  }

  function updateFaq(index: number, values: Partial<ProductFaqDraft>): void {
    updateForm({ faqs: form.faqs.map((faq, faqIndex) => (faqIndex === index ? { ...faq, ...values } : faq)) });
  }

  function removeFaq(index: number): void {
    updateForm({ faqs: withPositions(form.faqs.filter((_, faqIndex) => faqIndex !== index)) });
  }

  function moveFaq(index: number, direction: -1 | 1): void {
    updateForm({ faqs: moveItem(form.faqs, index, direction) });
  }

  return (
    <>
      <section className="space-y-4 rounded-2xl border border-fuchsia-100 p-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <h3 className="font-semibold text-slate-950">Cosa riceve il cliente</h3>
          <Button type="button" size="sm" variant="outline" onClick={addBenefit}>
            Aggiungi
          </Button>
        </div>
        <div className="space-y-3">
          {form.benefits.map((benefit, index) => (
            <div key={benefit.id || `benefit-${index}`} className="space-y-2 rounded-xl border border-fuchsia-100 p-3">
              <Label htmlFor={`benefit-${index}`}>Elemento elenco puntato</Label>
              <Input id={`benefit-${index}`} value={benefit.text} onChange={(event) => updateBenefit(index, event.target.value)} />
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" variant="outline" onClick={() => moveBenefit(index, -1)} disabled={index === 0}>
                  Su
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => moveBenefit(index, 1)} disabled={index === form.benefits.length - 1}>
                  Giù
                </Button>
                <Button type="button" size="sm" variant="outline" className="border-red-200 text-red-700" onClick={() => removeBenefit(index)}>
                  Elimina
                </Button>
              </div>
            </div>
          ))}
          {form.benefits.length === 0 ? <p className="text-sm text-slate-500">Nessun elemento inserito.</p> : null}
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-fuchsia-100 p-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <h3 className="font-semibold text-slate-950">Perché farlo</h3>
          <Button type="button" size="sm" variant="outline" onClick={addHighlight}>
            Aggiungi
          </Button>
        </div>
        <div className="space-y-3">
          {form.highlights.map((highlight, index) => (
            <div key={highlight.id || `highlight-${index}`} className="space-y-3 rounded-xl border border-fuchsia-100 p-3">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor={`highlight-icon-${index}`}>Icona</Label>
                  <Input id={`highlight-icon-${index}`} value={highlight.icon} onChange={(event) => updateHighlight(index, { icon: event.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`highlight-title-${index}`}>Titolo</Label>
                  <Input id={`highlight-title-${index}`} value={highlight.title} onChange={(event) => updateHighlight(index, { title: event.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`highlight-description-${index}`}>Descrizione</Label>
                  <Input id={`highlight-description-${index}`} value={highlight.description} onChange={(event) => updateHighlight(index, { description: event.target.value })} />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" variant="outline" onClick={() => moveHighlight(index, -1)} disabled={index === 0}>
                  Su
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => moveHighlight(index, 1)} disabled={index === form.highlights.length - 1}>
                  Giù
                </Button>
                <Button type="button" size="sm" variant="outline" className="border-red-200 text-red-700" onClick={() => removeHighlight(index)}>
                  Elimina
                </Button>
              </div>
            </div>
          ))}
          {form.highlights.length === 0 ? <p className="text-sm text-slate-500">Nessuna scheda inserita.</p> : null}
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-fuchsia-100 p-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <h3 className="font-semibold text-slate-950">Domande frequenti (FAQ)</h3>
          <Button type="button" size="sm" variant="outline" onClick={addFaq}>
            Aggiungi
          </Button>
        </div>
        <div className="space-y-3">
          {form.faqs.map((faq, index) => (
            <div key={faq.id || `faq-${index}`} className="space-y-3 rounded-xl border border-fuchsia-100 p-3">
              <div className="space-y-2">
                <Label htmlFor={`faq-question-${index}`}>Domanda</Label>
                <Input id={`faq-question-${index}`} value={faq.question} onChange={(event) => updateFaq(index, { question: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`faq-answer-${index}`}>Risposta</Label>
                <Textarea id={`faq-answer-${index}`} rows={3} value={faq.answer} onChange={(event) => updateFaq(index, { answer: event.target.value })} />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" variant="outline" onClick={() => moveFaq(index, -1)} disabled={index === 0}>
                  Su
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => moveFaq(index, 1)} disabled={index === form.faqs.length - 1}>
                  Giù
                </Button>
                <Button type="button" size="sm" variant="outline" className="border-red-200 text-red-700" onClick={() => removeFaq(index)}>
                  Elimina
                </Button>
              </div>
            </div>
          ))}
          {form.faqs.length === 0 ? <p className="text-sm text-slate-500">Nessuna FAQ inserita.</p> : null}
        </div>
      </section>
    </>
  );
}