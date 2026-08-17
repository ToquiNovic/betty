'use client';

import React from 'react';
import { ProjectFilters, ProjectDifficulty } from '@/types/project';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, X, Sparkles } from 'lucide-react';

interface ProjectFiltersProps {
  filters: ProjectFilters;
  onChange: (filters: ProjectFilters) => void;
  availableTags?: string[];
}

export function ProjectFiltersBar({ filters, onChange, availableTags = [] }: ProjectFiltersProps) {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...filters, search: e.target.value });
  };

  const handleDifficultyChange = (val: string | null) => {
    onChange({
      ...filters,
      difficulty: (val as ProjectDifficulty | 'all') || 'all',
    });
  };

  const handleBoardChange = (val: string | null) => {
    onChange({
      ...filters,
      boardType: val === 'all' || !val ? undefined : val,
    });
  };

  const handleTagToggle = (tag: string) => {
    if (filters.tag === tag) {
      onChange({ ...filters, tag: undefined });
    } else {
      onChange({ ...filters, tag });
    }
  };

  const clearFilters = () => {
    onChange({
      difficulty: 'all',
      boardType: undefined,
      tag: undefined,
      search: '',
    });
  };

  const hasActiveFilters =
    (filters.difficulty && filters.difficulty !== 'all') ||
    !!filters.boardType ||
    !!filters.tag ||
    !!filters.search;

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar proyectos por nombre o descripción..."
            value={filters.search || ''}
            onChange={handleSearchChange}
            className="pl-9 h-9 text-sm"
          />
          {filters.search && (
            <button
              onClick={() => onChange({ ...filters, search: '' })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Difficulty Select */}
        <div className="w-full sm:w-37.5">
          <Select
            value={filters.difficulty || 'all'}
            onValueChange={handleDifficultyChange}
          >
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="Dificultad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las dif.</SelectItem>
              <SelectItem value="beginner">Principiante</SelectItem>
              <SelectItem value="intermediate">Intermedio</SelectItem>
              <SelectItem value="advanced">Avanzado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Board Select */}
        <div className="w-full sm:w-37.5">
          <Select
            value={filters.boardType || 'all'}
            onValueChange={handleBoardChange}
          >
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="Placa / Chip" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las placas</SelectItem>
              <SelectItem value="ESP32">ESP32</SelectItem>
              <SelectItem value="ESP8266">ESP8266</SelectItem>
              <SelectItem value="ESP32-S3">ESP32-S3</SelectItem>
              <SelectItem value="ESP32-C3">ESP32-C3</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Reset button */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-9 px-2 text-xs text-muted-foreground hover:text-foreground shrink-0"
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Limpiar
          </Button>
        )}
      </div>

      {/* Tags Carousel/Pills */}
      {availableTags.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          <span className="text-muted-foreground text-[11px] font-medium flex items-center gap-1 shrink-0 mr-1">
            <Sparkles className="h-3 w-3 text-primary" /> Categorías:
          </span>
          {availableTags.map((tag) => {
            const isSelected = filters.tag === tag;
            return (
              <button
                key={tag}
                onClick={() => handleTagToggle(tag)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors shrink-0 ${
                  isSelected
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-muted/60 text-muted-foreground border-border hover:border-primary/50 hover:text-foreground'
                }`}
              >
                #{tag}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
