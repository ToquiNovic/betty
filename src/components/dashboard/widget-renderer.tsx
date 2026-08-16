'use client';

import React from 'react';
import { DashboardWidget, SensorData } from '@/types';
import { MetricWidget } from './widgets/metric-widget';
import { LineChartWidget } from './widgets/line-chart-widget';
import { BarChartWidget } from './widgets/bar-chart-widget';
import { GaugeWidget } from './widgets/gauge-widget';
import { TableWidget } from './widgets/table-widget';
import { MapWidget } from './widgets/map-widget';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

interface WidgetRendererProps {
  widget: DashboardWidget;
  latestReading?: SensorData;
  isEditMode?: boolean;
  onDelete?: (widgetId: string) => void;
}

export function WidgetRenderer({
  widget,
  latestReading,
  isEditMode = false,
  onDelete,
}: WidgetRendererProps) {
  const renderWidgetContent = () => {
    switch (widget.widgetType) {
      case 'metric':
        return <MetricWidget widget={widget} latestReading={latestReading} />;
      case 'line_chart':
        return <LineChartWidget widget={widget} latestReading={latestReading} />;
      case 'bar_chart':
        return <BarChartWidget widget={widget} latestReading={latestReading} />;
      case 'gauge':
        return <GaugeWidget widget={widget} latestReading={latestReading} />;
      case 'table':
        return <TableWidget widget={widget} latestReading={latestReading} />;
      case 'map':
        return <MapWidget widget={widget} latestReading={latestReading} />;
      default:
        return <MetricWidget widget={widget} latestReading={latestReading} />;
    }
  };

  return (
    <div className="relative h-full w-full group">
      {renderWidgetContent()}

      {isEditMode && onDelete && (
        <Button
          variant="destructive"
          size="icon"
          className="absolute -top-2 -right-2 h-7 w-7 rounded-full shadow-md opacity-90 hover:opacity-100 z-20"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(widget.id);
          }}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}
