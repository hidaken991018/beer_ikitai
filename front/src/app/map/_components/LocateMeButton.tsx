import { LocateFixed } from 'lucide-react';

interface LocateMeButtonProps {
  onClick: () => void;
}

export function LocateMeButton({ onClick }: LocateMeButtonProps) {
  return (
    <button
      onClick={onClick}
      className="absolute top-4 right-4 z-10 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 active:bg-gray-100"
    >
      <LocateFixed className="w-5 h-5 text-gray-700" />
    </button>
  );
}
