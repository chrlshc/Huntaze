/**
 * Empty States for Messages Interface
 * User-friendly empty states with actionable guidance
 */

import React from 'react';
import { MessageSquare, Inbox, FileText } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      {icon && (
        <div className="mb-4 text-gray-400 dark:text-gray-600">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        {title}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-sm">
        {description}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

export const NoConversationsEmpty: React.FC<{ onStartConversation?: () => void }> = ({ 
  onStartConversation 
}) => {
  return (
    <EmptyState
      icon={<Inbox size={64} />}
      title="Aucune conversation"
      description="Vous n'avez pas encore de conversations. Commencez à échanger avec vos fans pour voir vos messages ici."
      action={onStartConversation ? {
        label: "Démarrer une conversation",
        onClick: onStartConversation
      } : undefined}
    />
  );
};

export const NoMessagesEmpty: React.FC = () => {
  return (
    <EmptyState
      icon={<MessageSquare size={64} />}
      title="Aucun message"
      description="Sélectionnez une conversation dans la liste pour voir les messages ou commencez une nouvelle conversation."
    />
  );
};

export const NoNotesEmpty: React.FC<{ onAddNote?: () => void }> = ({ onAddNote }) => {
  return (
    <EmptyState
      icon={<FileText size={48} />}
      title="Aucune note"
      description="Ajoutez des notes pour garder une trace des informations importantes sur ce fan."
      action={onAddNote ? {
        label: "Ajouter une note",
        onClick: onAddNote
      } : undefined}
    />
  );
};

export const NoSearchResultsEmpty: React.FC<{ searchQuery: string; onClearSearch?: () => void }> = ({ 
  searchQuery,
  onClearSearch 
}) => {
  return (
    <EmptyState
      icon={<Inbox size={64} />}
      title="Aucun résultat"
      description={`Aucune conversation ne correspond à "${searchQuery}". Essayez avec un autre terme de recherche.`}
      action={onClearSearch ? {
        label: "Effacer la recherche",
        onClick: onClearSearch
      } : undefined}
    />
  );
};

export const EmptyStates = {
  NoConversationsEmpty,
  NoMessagesEmpty,
  NoNotesEmpty,
  NoSearchResultsEmpty,
};

export default EmptyStates;
