'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Copy, Check, AlertTriangle, KeyRound } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface ApiKeyDisplayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rawApiKey: string;
  sensorName: string;
  mqttTopic: string;
}

export function ApiKeyDisplayDialog({
  open,
  onOpenChange,
  rawApiKey,
  sensorName,
  mqttTopic,
}: ApiKeyDisplayProps) {
  const t = useTranslations('sensors');
  const common = useTranslations('common');
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedTopic, setCopiedTopic] = useState(false);

  const copyToClipboard = (text: string, isKey: boolean) => {
    navigator.clipboard.writeText(text);
    if (isKey) {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } else {
      setCopiedTopic(true);
      setTimeout(() => setCopiedTopic(false), 2000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2 text-primary">
            <KeyRound className="h-5 w-5" />
            <DialogTitle className="text-xl font-bold">
              API Key — {sensorName}
            </DialogTitle>
          </div>
          <DialogDescription>
            Usa estas credenciales para conectar tu dispositivo o simulación al broker MQTT.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <Alert variant="destructive" className="border-amber-500/50 bg-amber-500/10 text-amber-900 dark:text-amber-200">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertTitle className="font-semibold">{t('apiKeyWarningTitle')}</AlertTitle>
            <AlertDescription className="text-xs mt-1">
              {t('apiKeyWarningDesc')}
            </AlertDescription>
          </Alert>

          {/* Raw API Key input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              API Key (Password MQTT)
            </label>
            <div className="flex gap-2">
              <Input
                readOnly
                value={rawApiKey}
                className="font-mono text-xs select-all bg-muted"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(rawApiKey, true)}
                className="shrink-0"
              >
                {copiedKey ? (
                  <Check className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* MQTT Topic */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t('mqttTopic')}
            </label>
            <div className="flex gap-2">
              <Input
                readOnly
                value={mqttTopic}
                className="font-mono text-xs select-all bg-muted"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(mqttTopic, false)}
                className="shrink-0"
              >
                {copiedTopic ? (
                  <Check className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            {common('close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
