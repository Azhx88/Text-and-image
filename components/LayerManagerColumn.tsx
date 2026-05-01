'use client';

import React, { useState } from 'react';
import { useLayerManager, Layer, TextLayer } from '@/context/useLayerManager';
import { PlusIcon, TextIcon, ImageIcon, PersonIcon } from '@radix-ui/react-icons';
import { EyeIcon, EyeOffIcon } from 'lucide-react';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates,
  verticalListSortingStrategy, useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import TextCustomizer from '@/components/editor/text-customizer';
import { Accordion } from '@/components/ui/accordion';

const LayerIcon = ({ type }: { type: Layer['type'] }) => {
  const cls = 'h-3.5 w-3.5 text-white/30';
  if (type === 'full')    return <ImageIcon className={cls} />;
  if (type === 'text')    return <TextIcon className={cls} />;
  if (type === 'subject') return <PersonIcon className={cls} />;
  return null;
};

function SortableLayerItem({ layer }: { layer: Layer }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: layer.id });
  const { activeLayer, setActiveLayer, toggleVisibility } = useLayerManager();
  const isActive = activeLayer === layer.id;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 10 : undefined }}
      {...attributes}
      onClick={() => setActiveLayer(layer.id)}
      className={[
        'flex items-center gap-2.5 px-3 py-2.5 cursor-pointer select-none transition-all duration-100 group border-l-2',
        isDragging ? 'opacity-40' : '',
        isActive
          ? 'border-violet-500 bg-violet-500/[0.08]'
          : 'border-transparent hover:bg-white/[0.04] hover:border-white/10',
      ].join(' ')}
    >
      <div {...listeners} className="flex-shrink-0 cursor-grab active:cursor-grabbing opacity-40 group-hover:opacity-70 transition-opacity">
        <LayerIcon type={layer.type} />
      </div>
      <span className={['flex-1 truncate text-xs font-medium', isActive ? 'text-violet-300' : 'text-white/60'].join(' ')}>
        {layer.name || (layer.type === 'text' ? (layer as TextLayer).text : '') || 'New Text'}
      </span>
      <button
        onMouseDown={e => e.stopPropagation()}
        onClick={e => { e.stopPropagation(); toggleVisibility(layer.id); }}
        className="opacity-25 hover:opacity-70 transition-opacity p-1 rounded"
      >
        {layer.visible
          ? <EyeIcon className="h-3.5 w-3.5 text-white" />
          : <EyeOffIcon className="h-3.5 w-3.5 text-white/40" />}
      </button>
    </div>
  );
}

export const LayerManagerColumn = () => {
  const { layers, setLayers, activeLayer, setActiveLayer, activeTextLayer, addNewTextSet, handleAttributeChange, duplicateTextSet, removeTextSet } = useLayerManager();
  const [accordionValue, setAccordionValue] = useState<string>(`item-${activeLayer || ''}`);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 10 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setLayers(items => {
        const oi = items.findIndex(i => i.id === active.id);
        const ni = items.findIndex(i => i.id === over.id);
        return arrayMove(items, oi, ni).map((item, idx) => ({ ...item, order: idx }));
      });
    }
  };

  const textLayers = layers.filter(l => l.type === 'text') as TextLayer[];

  return (
    <div className="h-full flex flex-col" style={{ background: '#0d0e14' }}>

      {/* ── Header ── */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-white/30">Layers</span>
        <button
          onClick={addNewTextSet}
          className="flex items-center gap-1.5 h-7 px-3 rounded-xl text-[11px] font-semibold btn-violet"
        >
          <PlusIcon className="h-3 w-3" />
          Add Text
        </button>
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto">
        {/* Layer list */}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={layers.map(l => l.id)} strategy={verticalListSortingStrategy}>
            <div className="pt-1">
              {layers.map(layer => <SortableLayerItem key={layer.id} layer={layer} />)}
            </div>
          </SortableContext>
        </DndContext>

        {/* Text layer quick-select */}
        {textLayers.length > 0 && (
          <div className="px-3 mt-4 pb-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/25 px-1 mb-2">Text Layers</p>
            <div className="flex flex-col gap-0.5">
              {textLayers.map(layer => (
                <button
                  key={layer.id}
                  onClick={() => setActiveLayer(layer.id)}
                  className={[
                    'w-full text-left px-2.5 py-2 rounded-xl text-xs font-medium truncate transition-all duration-100 border',
                    activeLayer === layer.id
                      ? 'bg-violet-500/10 border-violet-500/25 text-violet-300'
                      : 'border-transparent text-white/40 hover:bg-white/[0.04] hover:text-white/70',
                  ].join(' ')}
                >
                  {layer.name || layer.text || 'Untitled Text'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Active text layer controls */}
        {activeTextLayer && (
          <div className="px-3 mt-3 pb-6">
            <div className="h-px bg-white/[0.05] mb-3" />
            <Accordion type="single" collapsible value={accordionValue} onValueChange={setAccordionValue}>
              <TextCustomizer
                textSet={activeTextLayer}
                handleAttributeChange={(id, attribute, value) => handleAttributeChange(activeTextLayer.id, attribute, value)}
                removeTextSet={() => removeTextSet(activeTextLayer.id)}
                duplicateTextSet={() => duplicateTextSet(activeTextLayer)}
                userId="123"
              />
            </Accordion>
          </div>
        )}
      </div>
    </div>
  );
};
