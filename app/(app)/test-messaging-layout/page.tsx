import { MessagingInterface } from '@/components/messages/MessagingInterface';

export default function TestMessagingLayoutPage() {
  return (
    <div className="h-screen flex flex-col">
      <div className="p-4 bg-gray-50 border-b">
        <h1 className="text-2xl font-bold mb-2">Messaging Interface Layout Test</h1>
        <p className="text-gray-600 text-sm">
          Test the three-column responsive layout with Huntaze header. Resize your browser to see:
        </p>
        <ul className="list-disc list-inside text-xs text-gray-600 mt-2">
          <li><strong>Desktop (&gt;1024px):</strong> Three columns + full header</li>
          <li><strong>Tablet (768-1024px):</strong> Two columns + compact header</li>
          <li><strong>Mobile (&lt;768px):</strong> Single column + minimal header</li>
        </ul>
      </div>
      
      <div className="flex-1 overflow-hidden">
        <MessagingInterface 
          userName="Sarah Johnson"
          userAvatar="/avatars/user-1.jpg"
          unreadNotifications={5}
        />
      </div>
    </div>
  );
}
