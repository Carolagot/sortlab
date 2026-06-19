import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Loader2, FlaskConical, UserCircle2, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import CardSortingBoard from '@/components/participant/CardSortingBoard';

export default function ParticipantStudy() {
  const { shareId } = useParams();
  const [step, setStep] = useState('welcome'); // 'welcome' | 'identity' | 'sorting' | 'comment'
  const [participantName, setParticipantName] = useState('');
  const [pendingGroups, setPendingGroups] = useState(null);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { data: study, isLoading, error } = useQuery({
    queryKey: ['public-study', shareId],
    queryFn: async () => {
      const studies = await base44.entities.Study.filter({ share_id: shareId });
      return studies[0];
    },
    enabled: !!shareId,
  });

  const handleSortingDone = (groups) => {
    setPendingGroups(groups);
    setStep('comment');
  };

  const handleSubmit = async (finalComment) => {
    setSubmitting(true);
    await base44.entities.ParticipantResponse.create({
      study_id: study.id,
      groups: pendingGroups,
      participant_name: participantName || 'Anónimo',
      comment: finalComment || '',
      completed: true,
    });
    setSubmitting(false);
    setSubmitted(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !study) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-bold mb-2">Estudio no encontrado</h2>
          <p className="text-muted-foreground">El enlace no es válido o el estudio ha sido eliminado.</p>
        </div>
      </div>
    );
  }

  if (study.status === 'closed') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-bold mb-2">Estudio cerrado</h2>
          <p className="text-muted-foreground">Este estudio ya no acepta respuestas.</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="font-display text-2xl font-bold mb-3">¡Gracias por participar!</h2>
          <p className="text-muted-foreground">Tu respuesta ha sido registrada exitosamente.</p>
        </div>
      </div>
    );
  }

  if (step === 'welcome') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-lg text-center">
          <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
            <FlaskConical className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold mb-3">{study.title}</h1>
          {study.description && <p className="text-muted-foreground mb-4">{study.description}</p>}
          {study.instructions && (
            <div className="bg-muted/50 rounded-xl p-4 mb-6 text-left">
              <p className="text-sm font-medium mb-1">Instrucciones:</p>
              <p className="text-sm text-muted-foreground">{study.instructions}</p>
            </div>
          )}
          <Button size="lg" onClick={() => setStep('identity')} className="px-8 h-12 font-semibold">
            Comenzar
          </Button>
        </div>
      </div>
    );
  }

  if (step === 'identity') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <UserCircle2 className="w-7 h-7 text-primary" />
          </div>
          <h2 className="font-display text-xl sm:text-2xl font-bold mb-2">¿Cómo querés participar?</h2>
          <p className="text-muted-foreground mb-8 text-sm">
            Podés ingresar tu nombre o participar de forma anónima.
          </p>
          <div className="space-y-3">
            <Input
              placeholder="Nombre y apellido"
              value={participantName}
              onChange={(e) => setParticipantName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && participantName.trim() && setStep('sorting')}
              className="h-11 text-center"
              autoFocus
            />
            <Button
              size="lg"
              className="w-full h-11 font-semibold"
              disabled={!participantName.trim()}
              onClick={() => setStep('sorting')}
            >
              Continuar con mi nombre
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full h-11 font-semibold"
              onClick={() => { setParticipantName(''); setStep('sorting'); }}
            >
              Participar anónimamente
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'comment') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <MessageSquare className="w-7 h-7 text-primary" />
          </div>
          <h2 className="font-display text-xl sm:text-2xl font-bold mb-2">¡Casi listo!</h2>
          <p className="text-muted-foreground mb-6 text-sm">
            ¿Tenés algún comentario o sugerencia? Es completamente opcional.
          </p>
          <Textarea
            placeholder="Escribe tu comentario aquí..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            className="mb-4 text-left"
          />
          <div className="space-y-2">
            <Button
              size="lg"
              className="w-full h-11 font-semibold"
              disabled={submitting}
              onClick={() => handleSubmit(comment)}
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enviar respuesta'}
            </Button>
            <Button
              size="lg"
              variant="ghost"
              className="w-full h-11 text-muted-foreground"
              disabled={submitting}
              onClick={() => handleSubmit('')}
            >
              Omitir y enviar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <CardSortingBoard study={study} onSubmit={handleSortingDone} submitting={submitting} />
  );
}