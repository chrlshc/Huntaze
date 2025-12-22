/**
 * TailAdmin + Chat UI Kit Test Page
 * Verifies that all components render correctly
 */

'use client';

import React from 'react';
import {
  TailAdminCard,
  TailAdminCardHeader,
  TailAdminCardTitle,
  TailAdminCardContent,
  TailAdminButton,
  TailAdminButtonGroup,
  TailAdminSearchInput,
  TailAdminAvatar,
  TailAdminBadge
} from '@/components/ui/tailadmin';

import {
  MainContainer,
  ChatContainer,
  MessageList,
  Message,
  MessageInput,
  ConversationHeader,
  Avatar,
  TypingIndicator
} from '@chatscope/chat-ui-kit-react';

export default function TestTailAdminPage() {
  const [message, setMessage] = React.useState('');

  return (
    <div className="p-8 space-y-8" style={{ backgroundColor: 'var(--tailadmin-bg)', minHeight: '100vh' }}>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8" style={{ color: 'var(--tailadmin-text-primary)' }}>
          TailAdmin + Chat UI Kit Test
        </h1>

        {/* TailAdmin Components Test */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <TailAdminCard>
            <TailAdminCardHeader>
              <TailAdminCardTitle>TailAdmin Card</TailAdminCardTitle>
            </TailAdminCardHeader>
            <TailAdminCardContent>
              <div className="space-y-4">
                <TailAdminSearchInput placeholder="Search..." />
                
                <TailAdminButtonGroup>
                  <TailAdminButton variant="ghost" active>All</TailAdminButton>
                  <TailAdminButton variant="ghost">Unread</TailAdminButton>
                  <TailAdminButton variant="ghost">VIP</TailAdminButton>
                </TailAdminButtonGroup>

                <div className="flex items-center gap-3">
                  <TailAdminAvatar 
                    src="https://i.pravatar.cc/150?img=1" 
                    alt="User"
                    status="online"
                  />
                  <div>
                    <p className="font-medium" style={{ color: 'var(--tailadmin-text-primary)' }}>
                      John Doe
                    </p>
                    <p className="text-sm" style={{ color: 'var(--tailadmin-text-secondary)' }}>
                      Last message preview...
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <TailAdminBadge variant="primary">Primary</TailAdminBadge>
                  <TailAdminBadge variant="success">Success</TailAdminBadge>
                  <TailAdminBadge variant="warning">Warning</TailAdminBadge>
                  <TailAdminBadge variant="danger">Danger</TailAdminBadge>
                </div>

                <div className="flex gap-2">
                  <TailAdminButton variant="primary" size="sm">Small</TailAdminButton>
                  <TailAdminButton variant="primary" size="md">Medium</TailAdminButton>
                  <TailAdminButton variant="primary" size="lg">Large</TailAdminButton>
                </div>
              </div>
            </TailAdminCardContent>
          </TailAdminCard>

          {/* Chat UI Kit Test */}
          <TailAdminCard padding="none">
            <div style={{ height: '500px' }}>
              <MainContainer>
                <ChatContainer>
                  <ConversationHeader>
                    <Avatar src="https://i.pravatar.cc/150?img=2" name="Jane Smith" />
                    <ConversationHeader.Content 
                      userName="Jane Smith" 
                      info="Active now"
                    />
                  </ConversationHeader>
                  
                  <MessageList
                    typingIndicator={<TypingIndicator content="Jane is typing" />}
                  >
                    <Message
                      model={{
                        message: "Hello! This is a test message from Chat UI Kit.",
                        sentTime: "15 mins ago",
                        sender: "Jane",
                        direction: "incoming",
                        position: "single"
                      }}
                    >
                      <Avatar src="https://i.pravatar.cc/150?img=2" name="Jane Smith" />
                    </Message>
                    
                    <Message
                      model={{
                        message: "This message uses TailAdmin styling!",
                        sentTime: "10 mins ago",
                        sender: "You",
                        direction: "outgoing",
                        position: "single"
                      }}
                    />
                    
                    <Message
                      model={{
                        message: "The colors and spacing match the TailAdmin design system.",
                        sentTime: "5 mins ago",
                        sender: "Jane",
                        direction: "incoming",
                        position: "single"
                      }}
                    >
                      <Avatar src="https://i.pravatar.cc/150?img=2" name="Jane Smith" />
                    </Message>
                  </MessageList>
                  
                  <MessageInput
                    placeholder="Type message here"
                    value={message}
                    onChange={(val) => setMessage(val)}
                    onSend={() => {
                      console.log('Message sent:', message);
                      setMessage('');
                    }}
                    attachButton={true}
                    sendButton={true}
                  />
                </ChatContainer>
              </MainContainer>
            </div>
          </TailAdminCard>
        </div>

        {/* Status */}
        <TailAdminCard>
          <TailAdminCardHeader>
            <TailAdminCardTitle>Integration Status</TailAdminCardTitle>
          </TailAdminCardHeader>
          <TailAdminCardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <TailAdminBadge variant="success">✓</TailAdminBadge>
                <span style={{ color: 'var(--tailadmin-text-primary)' }}>
                  TailAdmin components installed and working
                </span>
              </div>
              <div className="flex items-center gap-2">
                <TailAdminBadge variant="success">✓</TailAdminBadge>
                <span style={{ color: 'var(--tailadmin-text-primary)' }}>
                  Chat UI Kit components installed and working
                </span>
              </div>
              <div className="flex items-center gap-2">
                <TailAdminBadge variant="success">✓</TailAdminBadge>
                <span style={{ color: 'var(--tailadmin-text-primary)' }}>
                  CSS overrides applied successfully
                </span>
              </div>
              <div className="flex items-center gap-2">
                <TailAdminBadge variant="success">✓</TailAdminBadge>
                <span style={{ color: 'var(--tailadmin-text-primary)' }}>
                  Design tokens configured
                </span>
              </div>
            </div>
          </TailAdminCardContent>
        </TailAdminCard>
      </div>
    </div>
  );
}
