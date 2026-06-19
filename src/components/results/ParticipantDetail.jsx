import React from 'react';
import { X, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ParticipantDetail({ response, index, study, onClose }) {
  const cards = study?.cards || [];
  const cardMap = Object.fromEntries(cards.map(c => [c.id, c.label]));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-card rounded-2xl border shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <div>
            <h2 className="font-semibold text-lg">
              {response.participant_name || `Participante ${index + 1}`}
            </h2>
            {response.created_date && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {format(new Date(response.created_date), "d MMM yyyy, HH:mm", { locale: es })}
              </p>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Groups */}
        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {(response.groups || []).length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Sin grupos registrados.</p>
          ) : (
            (response.groups || []).map((group, gi) => {
              const cardLabels = (group.card_ids || []).map(id => cardMap[id] || id);
              return (
                <div key={gi} className="bg-muted/40 rounded-xl p-4">
                  <p className="font-semibold text-sm mb-3">{group.category_name || `Grupo ${gi + 1}`}</p>
                  <div className="flex flex-wrap gap-2">
                    {cardLabels.map((label, ci) => (
                      <span
                        key={ci}
                        className="bg-card border rounded-lg px-3 py-1.5 text-xs font-medium shadow-sm"
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })
          )}

          {/* Comment */}
          {response.comment && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-2">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-4 h-4 text-amber-600" />
                <p className="text-sm font-semibold text-amber-800">Comentario</p>
              </div>
              <p className="text-sm text-amber-900">{response.comment}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}