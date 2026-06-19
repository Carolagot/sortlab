import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Plus, X, Loader2, ArrowLeft, ArrowRight } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';

export default function CreateStudy() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    title: '',
    description: '',
    instructions: '',
    type: 'open',
    categories: [],
    cards: [],
  });
  const [newCategory, setNewCategory] = useState('');
  const [cardInput, setCardInput] = useState('');

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const shareId = Math.random().toString(36).substring(2, 10);
      return base44.entities.Study.create({
        ...data,
        share_id: shareId,
        status: 'active',
        cards: data.cards.map((label, i) => ({ id: `card-${i}`, label })),
        categories: data.categories.map((name, i) => ({ id: `cat-${i}`, name })),
      });
    },
    onSuccess: (result) => navigate(`/studies/${result.id}`),
  });

  const addCategory = () => {
    if (newCategory.trim()) {
      setForm(f => ({ ...f, categories: [...f.categories, newCategory.trim()] }));
      setNewCategory('');
    }
  };

  const removeCategory = (index) => {
    setForm(f => ({ ...f, categories: f.categories.filter((_, i) => i !== index) }));
  };

  const handleBulkCards = () => {
    const newCards = cardInput
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean)
      .filter(c => !form.cards.includes(c));
    setForm(f => ({ ...f, cards: [...f.cards, ...newCards] }));
    setCardInput('');
  };

  const removeCard = (index) => {
    setForm(f => ({ ...f, cards: f.cards.filter((_, i) => i !== index) }));
  };

  const canProceed = () => {
    if (step === 1) return form.title.trim().length > 0;
    if (step === 2 && (form.type === 'closed' || form.type === 'hybrid')) return form.categories.length > 0;
    if (step === 2 && form.type === 'open') return true;
    if (step === 3) return form.cards.length >= 2;
    return true;
  };

  const handleSubmit = () => {
    createMutation.mutate(form);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={() => navigate('/')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 text-sm">
        <ArrowLeft className="w-4 h-4" />
        Volver al dashboard
      </button>

      <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight mb-2">Nuevo Estudio</h1>
      <p className="text-muted-foreground mb-8">Configura tu estudio de Card Sorting paso a paso</p>

      {/* Progress Steps */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
              step >= s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              {s}
            </div>
            <span className={`text-sm hidden sm:inline ${step >= s ? 'font-medium' : 'text-muted-foreground'}`}>
              {s === 1 ? 'Información' : s === 2 ? 'Categorías' : 'Tarjetas'}
            </span>
            {s < 3 && <div className={`flex-1 h-0.5 ${step > s ? 'bg-primary' : 'bg-border'}`} />}
          </div>
        ))}
      </div>

      {/* Step 1: Basic Info */}
      {step === 1 && (
        <div className="bg-card rounded-2xl border p-6 sm:p-8 space-y-6">
          <div className="space-y-2">
            <Label>Nombre del estudio *</Label>
            <Input
              placeholder="Ej: Navegación del portal de clientes"
              value={form.title}
              onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
              className="h-12"
            />
          </div>
          <div className="space-y-2">
            <Label>Descripción</Label>
            <Textarea
              placeholder="Describe brevemente el objetivo del estudio o cuál es la idea del proyecto para que los participantes comprendan mejor el contexto de la propuesta"
              value={form.description}
              onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>Instrucciones para participantes</Label>
            <Textarea
              placeholder={`Ej: Organiza las tarjetas en los grupos que tengan más sentido para ti...\n\n(Según el tipo de Card Sorting que elijas, explicale a los participantes si deberán arrastrar las tarjetas a las categorías ya creadas o si podrán/deberán crear ellos mismos las categorías correspondientes)`}
              value={form.instructions}
              onChange={(e) => setForm(f => ({ ...f, instructions: e.target.value }))}
              rows={3}
            />
          </div>
          <div className="space-y-3">
            <Label>Tipo de Card Sort *</Label>
            <RadioGroup
              value={form.type}
              onValueChange={(value) => setForm(f => ({ ...f, type: value }))}
              className="grid gap-3"
            >
              {[
                { value: 'open', label: 'Abierto (Open)', desc: 'Los participantes crean sus propias categorías' },
                { value: 'closed', label: 'Cerrado (Closed)', desc: 'Las categorías están predefinidas por ti' },
                { value: 'hybrid', label: 'Híbrido (Hybrid)', desc: 'Categorías predefinidas + los participantes pueden crear nuevas' },
              ].map(opt => (
                <label key={opt.value} className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  form.type === opt.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
                }`}>
                  <RadioGroupItem value={opt.value} className="mt-0.5" />
                  <div>
                    <p className="font-medium">{opt.label}</p>
                    <p className="text-sm text-muted-foreground">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </RadioGroup>
          </div>
        </div>
      )}

      {/* Step 2: Categories */}
      {step === 2 && (
        <div className="bg-card rounded-2xl border p-6 sm:p-8 space-y-6">
          {form.type === 'open' ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Estudio Abierto</h3>
              <p className="text-muted-foreground max-w-sm mx-auto">
                Los participantes crearán sus propias categorías. No necesitas definir ninguna categoría previa.
              </p>
            </div>
          ) : (
            <>
              <div>
                <Label className="mb-2 block">
                  Categorías {form.type === 'closed' ? '(obligatorias)' : '(iniciales)'}
                </Label>
                <p className="text-sm text-muted-foreground mb-4">
                  {form.type === 'closed'
                    ? 'Los participantes solo podrán usar estas categorías.'
                    : 'Los participantes verán estas categorías y podrán crear nuevas.'}
                </p>
                <div className="flex gap-2">
                  <Input
                    placeholder="Nombre de la categoría"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCategory())}
                    className="h-11"
                  />
                  <Button onClick={addCategory} size="icon" className="h-11 w-11 shrink-0">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {form.categories.map((cat, i) => (
                  <div key={i} className="flex items-center gap-1.5 bg-muted px-3 py-1.5 rounded-lg">
                    <span className="text-sm font-medium">{cat}</span>
                    <button onClick={() => removeCategory(i)} className="text-muted-foreground hover:text-destructive">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {form.categories.length === 0 && (form.type !== 'open') && (
                  <p className="text-sm text-muted-foreground italic">Agrega al menos una categoría</p>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Step 3: Cards */}
      {step === 3 && (
        <div className="bg-card rounded-2xl border p-6 sm:p-8 space-y-6">
          <div>
            <Label className="mb-2 block">Tarjetas *</Label>
            <p className="text-sm text-muted-foreground mb-4">
              Agrega las tarjetas que los participantes deberán clasificar. Puedes pegar múltiples tarjetas (una por línea).
            </p>
            <div className="space-y-3">
              <Textarea
                placeholder="Pega múltiples tarjetas (una por línea)&#10;Ej:&#10;Productos financieros&#10;Tarjetas de crédito&#10;Préstamos personales"
                value={cardInput}
                onChange={(e) => setCardInput(e.target.value)}
                rows={5}
              />
              <Button variant="outline" onClick={handleBulkCards} disabled={!cardInput.trim()}>
                <Plus className="w-4 h-4 mr-2" />
                Agregar tarjetas
              </Button>
            </div>
          </div>

          {form.cards.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-3">{form.cards.length} tarjeta{form.cards.length !== 1 ? 's' : ''} agregada{form.cards.length !== 1 ? 's' : ''}</p>
              <div className="flex flex-wrap gap-2">
                {form.cards.map((card, i) => (
                  <div key={i} className="flex items-center gap-1.5 bg-primary/5 border border-primary/20 px-3 py-1.5 rounded-lg">
                    <span className="text-sm">{card}</span>
                    <button onClick={() => removeCard(i)} className="text-muted-foreground hover:text-destructive">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <Button
          variant="ghost"
          onClick={() => setStep(s => s - 1)}
          disabled={step === 1}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Anterior
        </Button>

        {step < 3 ? (
          <Button
            onClick={() => setStep(s => s + 1)}
            disabled={!canProceed()}
            className="gap-2"
          >
            Siguiente
            <ArrowRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={!canProceed() || createMutation.isPending}
            className="gap-2"
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creando...
              </>
            ) : (
              'Crear Estudio'
            )}
          </Button>
        )}
      </div>
    </div>
  );
}