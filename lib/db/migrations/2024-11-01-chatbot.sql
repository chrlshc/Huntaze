-- Chatbot Conversations and Messages
-- Migration: 2024-11-01-chatbot

-- Create chatbot_conversations table
CREATE TABLE IF NOT EXISTS chatbot_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255),
  context JSONB, -- Store page context, user role, etc.
  last_message_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create chatbot_messages table
CREATE TABLE IF NOT EXISTS chatbot_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES chatbot_conversations(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB, -- Store tokens used, model, etc.
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_chatbot_conversations_user_id ON chatbot_conversations(user_id);
CREATE INDEX idx_chatbot_conversations_last_message_at ON chatbot_conversations(last_message_at DESC);
CREATE INDEX idx_chatbot_messages_conversation_id ON chatbot_messages(conversation_id);
CREATE INDEX idx_chatbot_messages_created_at ON chatbot_messages(created_at DESC);

-- Create function to update last_message_at
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chatbot_conversations
  SET last_message_at = NEW.created_at,
      updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trigger_update_conversation_last_message
AFTER INSERT ON chatbot_messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_last_message();

-- Add comments
COMMENT ON TABLE chatbot_conversations IS 'Stores chatbot conversation sessions';
COMMENT ON TABLE chatbot_messages IS 'Stores individual messages in chatbot conversations';
COMMENT ON COLUMN chatbot_conversations.context IS 'JSON context: page, user role, etc.';
COMMENT ON COLUMN chatbot_messages.metadata IS 'JSON metadata: tokens, model, response time, etc.';
