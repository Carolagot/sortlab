import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Copy, Users, ExternalLink, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import ParticipantsList from '@/components/results/ParticipantsList';
import SimilarityMatrix from '@/components/results/SimilarityMatrix';
import Dendrogram from '@/components/results/Dendrogram';

const typeLabels = { open: 'Abierto', closed: 'Cerrado', hybrid: 'Híbrido' };
const statusLabels = { draft: 'Borrador', active: 'Activo', closed: 'Cerrado' };

export default function StudyDetail() {
  const { studyId } = useParams();
  const [copied, setCopied] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const { data: study, isLoading } = useQuery({
    queryKey: ['study', studyId],
    queryFn: async () => {
      const studies = await base44.entities.Study.filter({ id: studyId });
      return studies[0];
    },
  });

  const { data: responses = [] } = useQuery({
    queryKey: ['responses', studyId],
    queryFn: () => base44.entities.ParticipantResponse.filter({ study_id: studyId }),
    enabled: !!studyId,
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (newStatus) => base44.entities.Study.update(studyId, { status: newStatus }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['study', studyId] }),
  });

  const shareUrl = study?.share_id ? `${window.location.origin}/s/${study.share_id}` : '';

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success('Enlace copiado', { description: 'El enlace del estudio se copió al portapapeles.' });
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!study) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Estudio no encontrado</p>
        <Link to="/" className="text-primary hover:underline mt-2 inline-block">Volver al dashboard</Link>
      </div>
    );
  }

  // Access guard: only the creator can view the study detail
  if (currentUser && study.created_by_id && study.created_by_id !== currentUser.id) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">No tienes acceso a este estudio.</p>
        <Link to="/" className="text-primary hover:underline mt-2 inline-block">Volver al dashboard</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm">
        <ArrowLeft className="w-4 h-4" />
        Volver
      </Link>

      {/* Header */}
      <div className="bg-card rounded-2xl border p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <h1 className="font-display text-2xl font-bold">{study.title}</h1>
              <Badge variant="outline">{typeLabels[study.type]}</Badge>
              <Badge variant="outline">{statusLabels[study.status || 'draft']}</Badge>
            </div>
            {study.description && <p className="text-muted-foreground">{study.description}</p>}
            <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
              <span>{study.cards?.length || 0} tarjetas</span>
              {study.type !== 'open' && <span>{study.categories?.length || 0} categorías</span>}
              <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{responses.length} respuestas</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleStatusMutation.mutate(study.status === 'active' ? 'closed' : 'active')}
            >
              {study.status === 'active' ? 'Cerrar estudio' : 'Activar estudio'}
            </Button>
          </div>
        </div>

        {/* Share Link */}
        {shareUrl && (
          <div className="mt-5 p-4 bg-muted/50 rounded-xl flex items-center gap-3">
            <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0" />
            <code className="text-sm flex-1 truncate">{shareUrl}</code>
            <Button variant="outline" size="sm" onClick={copyLink} className="shrink-0 gap-1.5">
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copiado' : 'Copiar'}
            </Button>
          </div>
        )}
      </div>

      {/* Results Tabs */}
      <Tabs defaultValue="participants" className="space-y-4">
        <TabsList className="bg-card border">
          <TabsTrigger value="participants">Participantes</TabsTrigger>
          <TabsTrigger value="matrix">Matriz de Similitud</TabsTrigger>
          <TabsTrigger value="dendrogram">Dendrograma</TabsTrigger>
        </TabsList>

        <TabsContent value="participants">
          <ParticipantsList responses={responses} study={study} />
        </TabsContent>

        <TabsContent value="matrix">
          <SimilarityMatrix responses={responses} study={study} />
        </TabsContent>

        <TabsContent value="dendrogram">
          <Dendrogram responses={responses} study={study} />
        </TabsContent>
      </Tabs>
    </div>
  );
}