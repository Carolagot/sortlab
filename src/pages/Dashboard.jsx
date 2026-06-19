import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Plus, Users, BarChart3, Clock, MoreHorizontal, ExternalLink, Trash2, Loader2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const typeLabels = { open: 'Abierto', closed: 'Cerrado', hybrid: 'Híbrido' };
const typeColors = {
  open: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  closed: 'bg-blue-50 text-blue-700 border-blue-200',
  hybrid: 'bg-violet-50 text-violet-700 border-violet-200',
};
const statusLabels = { draft: 'Borrador', active: 'Activo', closed: 'Cerrado' };
const statusColors = {
  draft: 'bg-amber-50 text-amber-700 border-amber-200',
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  closed: 'bg-slate-100 text-slate-600 border-slate-200',
};

export default function Dashboard() {
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState(null);
  const [editStudy, setEditStudy] = useState(null);
  const [editValues, setEditValues] = useState({ title: '', description: '', instructions: '' });

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const { data: studies = [], isLoading } = useQuery({
    queryKey: ['studies', currentUser?.id],
    queryFn: () => base44.entities.Study.filter({ created_by_id: currentUser.id }, '-created_date'),
    enabled: !!currentUser,
  });

  const studyIds = studies.map(s => s.id);

  const { data: responses = [] } = useQuery({
    queryKey: ['all-responses', currentUser?.id, studyIds.join(',')],
    queryFn: async () => {
      if (studyIds.length === 0) return [];
      const all = await base44.entities.ParticipantResponse.list();
      return all.filter(r => studyIds.includes(r.study_id));
    },
    enabled: !!currentUser && studies.length >= 0,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Study.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['studies'] }),
  });

  const editMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Study.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studies'] });
      setEditStudy(null);
    },
  });

  const getResponseCount = (studyId) => responses.filter(r => r.study_id === studyId).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">Mis Estudios</h1>
          <p className="text-muted-foreground mt-1">Gestiona tus estudios de Card Sorting</p>
        </div>
        <Link to="/studies/new">
          <Button className="gap-2 shadow-sm">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nuevo Estudio</span>
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{studies.length}</p>
              <p className="text-sm text-muted-foreground">Estudios</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl border p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{responses.length}</p>
              <p className="text-sm text-muted-foreground">Respuestas</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl border p-5 col-span-2 sm:col-span-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{studies.filter(s => s.status === 'active').length}</p>
              <p className="text-sm text-muted-foreground">Activos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Study List */}
      {studies.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-2xl border border-dashed">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-8 h-8 text-primary" />
          </div>
          <h3 className="font-semibold text-lg mb-2">Crea tu primer estudio</h3>
          <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
            Configura un Card Sort, comparte el enlace con participantes y analiza los resultados.
          </p>
          <Link to="/studies/new">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Nuevo Estudio
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {studies.map((study) => (
            <div key={study.id} className="bg-card rounded-xl border p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <Link to={`/studies/${study.id}`} className="font-semibold text-lg hover:text-primary transition-colors truncate">
                      {study.title}
                    </Link>
                    <Badge variant="outline" className={typeColors[study.type]}>
                      {typeLabels[study.type]}
                    </Badge>
                    <Badge variant="outline" className={statusColors[study.status || 'draft']}>
                      {statusLabels[study.status || 'draft']}
                    </Badge>
                  </div>
                  {study.description && (
                    <p className="text-sm text-muted-foreground line-clamp-1 mb-3">{study.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      {getResponseCount(study.id)} participantes
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {study.created_date ? format(new Date(study.created_date), "d MMM yyyy", { locale: es }) : ''}
                    </span>
                    <span>{study.cards?.length || 0} tarjetas</span>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="shrink-0">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                   <DropdownMenuItem asChild>
                     <Link to={`/studies/${study.id}`} className="flex items-center gap-2">
                       <BarChart3 className="w-4 h-4" />
                       Ver resultados
                     </Link>
                   </DropdownMenuItem>
                   <DropdownMenuItem onClick={() => { setEditStudy(study); setEditValues({ title: study.title, description: study.description || '', instructions: study.instructions || '' }); }}>
                     <Pencil className="w-4 h-4 mr-2" />
                     Editar
                   </DropdownMenuItem>
                   {study.share_id && (
                     <DropdownMenuItem onClick={() => navigator.clipboard.writeText(`${window.location.origin}/s/${study.share_id}`)}>
                       <ExternalLink className="w-4 h-4 mr-2" />
                       Copiar enlace
                     </DropdownMenuItem>
                   )}
                   <DropdownMenuItem
                     className="text-destructive"
                     onClick={() => deleteMutation.mutate(study.id)}
                   >
                     <Trash2 className="w-4 h-4 mr-2" />
                     Eliminar
                   </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Edit Dialog */}
      <Dialog open={!!editStudy} onOpenChange={(open) => !open && setEditStudy(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar estudio</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nombre *</Label>
              <Input
                value={editValues.title}
                onChange={(e) => setEditValues(v => ({ ...v, title: e.target.value }))}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label>Descripción</Label>
              <Textarea
                value={editValues.description}
                onChange={(e) => setEditValues(v => ({ ...v, description: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Instrucciones para participantes</Label>
              <Textarea
                value={editValues.instructions}
                onChange={(e) => setEditValues(v => ({ ...v, instructions: e.target.value }))}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditStudy(null)}>Cancelar</Button>
            <Button
              disabled={!editValues.title.trim() || editMutation.isPending}
              onClick={() => editMutation.mutate({ id: editStudy.id, data: { title: editValues.title.trim(), description: editValues.description, instructions: editValues.instructions } })}
            >
              {editMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}