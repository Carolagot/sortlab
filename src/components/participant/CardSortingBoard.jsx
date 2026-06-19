import React, { useState, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, X, GripVertical, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function CardSortingBoard({ study, onSubmit, submitting }) {
  const canCreateCategories = study.type === 'open' || study.type === 'hybrid';

  const initialCategories = (study.type !== 'open' && study.categories)
    ? study.categories.map(c => ({ id: c.id, name: c.name, cardIds: [] }))
    : [];

  const [categories, setCategories] = useState(initialCategories);
  const [unsortedCards, setUnsortedCards] = useState(study.cards?.map(c => c.id) || []);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  const cardMap = {};
  (study.cards || []).forEach(c => { cardMap[c.id] = c; });

  const totalCards = study.cards?.length || 0;
  const sortedCount = totalCards - unsortedCards.length;
  const allSorted = unsortedCards.length === 0 && totalCards > 0;

  const addCategory = () => {
    const name = newCategoryName.trim();
    if (!name) return;
    const id = `user-cat-${Date.now()}`;
    setCategories(prev => [...prev, { id, name, cardIds: [] }]);
    setNewCategoryName('');
  };

  const removeCategory = (catId) => {
    const cat = categories.find(c => c.id === catId);
    if (cat) {
      setUnsortedCards(prev => [...prev, ...cat.cardIds]);
      setCategories(prev => prev.filter(c => c.id !== catId));
    }
  };

  const startRename = (cat) => {
    setEditingId(cat.id);
    setEditName(cat.name);
  };

  const finishRename = () => {
    if (editName.trim() && editingId) {
      setCategories(prev => prev.map(c => c.id === editingId ? { ...c, name: editName.trim() } : c));
    }
    setEditingId(null);
  };

  const onDragEnd = useCallback((result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const cardId = draggableId;

    // Remove from source
    if (source.droppableId === 'unsorted') {
      setUnsortedCards(prev => prev.filter(id => id !== cardId));
    } else {
      setCategories(prev => prev.map(c =>
        c.id === source.droppableId ? { ...c, cardIds: c.cardIds.filter(id => id !== cardId) } : c
      ));
    }

    // Add to destination
    if (destination.droppableId === 'unsorted') {
      setUnsortedCards(prev => {
        const newArr = [...prev];
        newArr.splice(destination.index, 0, cardId);
        return newArr;
      });
    } else {
      setCategories(prev => prev.map(c => {
        if (c.id !== destination.droppableId) return c;
        const newCardIds = [...c.cardIds];
        newCardIds.splice(destination.index, 0, cardId);
        return { ...c, cardIds: newCardIds };
      }));
    }
  }, []);

  const handleSubmit = () => {
    const groups = categories.map(c => ({
      category_name: c.name,
      card_ids: c.cardIds,
    }));
    onSubmit(groups);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <div className="sticky top-0 z-40 bg-card/90 backdrop-blur-xl border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="font-semibold text-sm sm:text-base truncate">{study.title}</h1>
            <p className="text-xs text-muted-foreground">
              {sortedCount} de {totalCards} tarjetas clasificadas
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Progress bar */}
            <div className="hidden sm:block w-32 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${totalCards > 0 ? (sortedCount / totalCards) * 100 : 0}%` }}
              />
            </div>
            <Button
              onClick={handleSubmit}
              disabled={!allSorted || submitting}
              size="sm"
              className="gap-1.5"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              Enviar respuestas
            </Button>
          </div>
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col lg:flex-row gap-6">
          {/* Unsorted Cards */}
          <div className="lg:w-72 shrink-0">
            <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">
              Tarjetas sin clasificar ({unsortedCards.length})
            </h2>
            <Droppable droppableId="unsorted">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`min-h-[120px] rounded-xl border-2 border-dashed p-3 space-y-2 transition-colors ${
                    snapshot.isDraggingOver ? 'border-primary/40 bg-primary/5' : 'border-border bg-muted/30'
                  }`}
                >
                  {unsortedCards.map((cardId, index) => (
                    <Draggable key={cardId} draggableId={cardId} index={index}>
                      {(prov, snap) => (
                        <div
                          ref={prov.innerRef}
                          {...prov.draggableProps}
                          {...prov.dragHandleProps}
                          className={`flex items-center gap-2 bg-card rounded-lg border px-3 py-2.5 text-sm font-medium shadow-sm transition-shadow ${
                            snap.isDragging ? 'shadow-lg ring-2 ring-primary/20' : 'hover:shadow-md'
                          }`}
                        >
                          <GripVertical className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          {cardMap[cardId]?.label || cardId}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                  {unsortedCards.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      ¡Todas las tarjetas clasificadas!
                    </p>
                  )}
                </div>
              )}
            </Droppable>
          </div>

          {/* Categories */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Categorías ({categories.length})
              </h2>
            </div>

            {canCreateCategories && (
              <div className="flex gap-2 mb-4">
                <Input
                  placeholder="Nombre de nueva categoría"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCategory()}
                  className="h-10"
                />
                <Button onClick={addCategory} variant="outline" size="sm" className="h-10 gap-1.5 shrink-0">
                  <Plus className="w-4 h-4" />
                  Agregar
                </Button>
              </div>
            )}

            {categories.length === 0 && (
              <div className="border-2 border-dashed rounded-xl p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  {canCreateCategories
                    ? 'Crea una categoría para empezar a organizar las tarjetas.'
                    : 'No hay categorías definidas.'}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {categories.map((cat) => (
                <Droppable key={cat.id} droppableId={cat.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`rounded-xl border-2 transition-colors min-h-[140px] ${
                        snapshot.isDraggingOver ? 'border-primary/40 bg-primary/5' : 'border-border bg-card'
                      }`}
                    >
                      {/* Category Header */}
                      <div className="flex items-center justify-between px-3 py-2.5 border-b bg-muted/30 rounded-t-xl">
                        {editingId === cat.id ? (
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onBlur={finishRename}
                            onKeyDown={(e) => e.key === 'Enter' && finishRename()}
                            autoFocus
                            className="h-7 text-sm"
                          />
                        ) : (
                          <button
                            onClick={() => canCreateCategories && startRename(cat)}
                            className="text-sm font-semibold truncate text-left"
                          >
                            {cat.name}
                          </button>
                        )}
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground">{cat.cardIds.length}</span>
                          {canCreateCategories && (
                            <button onClick={() => removeCategory(cat.id)} className="text-muted-foreground hover:text-destructive p-0.5">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Cards in Category */}
                      <div className="p-2 space-y-1.5 min-h-[80px]">
                        {cat.cardIds.map((cardId, index) => (
                          <Draggable key={cardId} draggableId={cardId} index={index}>
                            {(prov, snap) => (
                              <div
                                ref={prov.innerRef}
                                {...prov.draggableProps}
                                {...prov.dragHandleProps}
                                className={`flex items-center gap-2 bg-background rounded-lg border px-3 py-2 text-sm shadow-sm transition-shadow ${
                                  snap.isDragging ? 'shadow-lg ring-2 ring-primary/20' : ''
                                }`}
                              >
                                <GripVertical className="w-3 h-3 text-muted-foreground shrink-0" />
                                {cardMap[cardId]?.label || cardId}
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    </div>
                  )}
                </Droppable>
              ))}
            </div>
          </div>
        </div>
      </DragDropContext>
    </div>
  );
}