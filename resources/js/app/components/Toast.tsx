import { useEffect } from 'react';
import { CheckCircle, X, AlertCircle, Info } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, type = 'success', onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const config = {
    success: {
      icon: CheckCircle,
      bg: 'bg-[#6bbf8d]',
      border: 'border-[#5fb587]',
      text: 'text-white',
    },
    error: {
      icon: AlertCircle,
      bg: 'bg-red-500',
      border: 'border-red-600',
      text: 'text-white',
    },
    info: {
      icon: Info,
      bg: 'bg-[#7ba7d6]',
      border: 'border-[#6a96c5]',
      text: 'text-white',
    },
  };

  const Icon = config[type].icon;

  return (
    <div className="fixed top-4 right-4 z-[100] animate-in slide-in-from-top-5 duration-300">
      <div className={`${config[type].bg} ${config[type].text} px-6 py-4 rounded-lg shadow-lg border-2 ${config[type].border} flex items-center gap-3 min-w-[320px] max-w-md`}>
        <Icon className="w-6 h-6 flex-shrink-0" />
        <p className="flex-1 font-medium">{message}</p>
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/20 rounded transition-colors flex-shrink-0"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
