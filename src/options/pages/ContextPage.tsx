import React from 'react';
import { useOptions } from '../OptionsContext';
import { Switch } from '../../components/ui/Switch';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { MessageSquare } from 'lucide-react';

export const ContextPage: React.FC = () => {
  const { chatContext, setChatContext, maxContext, setMaxContext } = useOptions();

  return (
    <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col gap-5 animate-fadeIn">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-200 flex items-center gap-2">
          <MessageSquare size={18} className="text-indigo-400" /> Conversation context (Chat Context)
        </h2>
        <Badge variant={chatContext ? 'success' : 'secondary'} size="sm">
          {chatContext ? 'Enabled' : 'Disabled'}
        </Badge>
      </div>

      <Switch
        label="Extract chat context (Chat Context Awareness)"
        description="Automatically read recent messages on Slack, Discord, and MS Teams to translate forms of address based on workplace roles."
        checked={chatContext}
        onChange={setChatContext}
      />

      {chatContext && (
        <div className="pt-4 border-t border-slate-800/80 flex flex-col gap-3.5">
          <Input
            label="Maximum context messages (1 - 10)"
            type="number"
            min={1}
            max={10}
            value={maxContext}
            onChange={(e) => setMaxContext(Math.max(1, Math.min(10, Number(e.target.value))))}
          />

          <div className="flex items-center gap-2 pt-1">
            <span className="text-xs text-slate-400">Quick select:</span>
            {[2, 4, 6, 8].map((num) => (
              <Button
                key={num}
                type="button"
                variant={maxContext === num ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setMaxContext(num)}
              >
                {num} messages
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
