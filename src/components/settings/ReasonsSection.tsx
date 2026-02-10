import { useState, type FC, type ComponentType } from 'react';
import { Plus, X } from 'lucide-react';

interface ReasonsSectionProps {
  title: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  iconClassName?: string;
  reasons: string[];
  onAdd: (reason: string) => Promise<void>;
  onRemove: (reason: string) => Promise<void>;
}

export const ReasonsSection: FC<ReasonsSectionProps> = ({
  title, icon: Icon, iconClassName, reasons, onAdd, onRemove,
}) => {
  const [newReason, setNewReason] = useState('');

  const handleAdd = async () => {
    if (!newReason.trim()) return;
    await onAdd(newReason.trim());
    setNewReason('');
  };

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-4">
        <Icon size={20} className={iconClassName} />
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      <div className="flex flex-wrap gap-2 mb-3">
        {reasons.map((reason) => (
          <div key={reason} className="chip flex items-center gap-2 chip-selected">
            {reason}
            <button onClick={() => onRemove(reason)} className="hover:bg-white/20 rounded-full p-1">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={newReason}
          onChange={(e) => setNewReason(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Add new reason"
          className="input-field flex-1"
        />
        <button onClick={handleAdd} className="btn-primary flex items-center gap-2">
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
};
