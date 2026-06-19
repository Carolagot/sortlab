import React, { useState } from 'react';
import { Users, Clock, ChevronRight, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import ParticipantDetail from './ParticipantDetail';

export default function ParticipantsList({ responses, study }) {
  const [selected, setSelected] = useState(null);

  if (responses.length === 0) {
    return (
      <div className="bg-card rounded-2xl border p-8 text-center">
        <div className="w-14 h-14 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Users className="w-7 h-7 text-muted-foreground" />
        </div>
        <h3 className="font-semibold mb-1">Sin respuestas aún</h3>
        <p className="text-sm text-muted-foreground">Comparte el enlace del estudio para recibir respuestas.</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-card rounded-2xl border overflow-hidden">
        <div className="p-5 border-b">
          <h3 className="font-semibold">{responses.length} participante{responses.length !== 1 ? 's' : ''}</h3>
        </div>
        <div className="divide-y">
          {responses.map((response, index) => (
            <button
              key={response.id}
              className="w-full p-4 flex items-center justify-between hover:bg-muted/40 transition-colors text-left"
              onClick={() => setSelected({ response, index })}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary shrink-0">
                  {index + 1}
                </div>
                <div>
                  <p className="text-sm font-medium flex items-center gap-1.5">
                    {response.participant_name || `Participante ${index + 1}`}
                    {response.comment && (
                      <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {response.created_date ? format(new Date(response.created_date), "d MMM yyyy, HH:mm", { locale: es }) : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <span className="text-sm">{response.groups?.length || 0} grupos</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {selected && (
        <ParticipantDetail
          response={selected.response}
          index={selected.index}
          study={study}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}