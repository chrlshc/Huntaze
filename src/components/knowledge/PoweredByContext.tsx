import React from 'react';
import {
  Card,
  BlockStack,
  InlineStack,
  Text,
  Button,
  Badge,
  Icon,
  Popover,
  ActionList,
  Box,
} from '@shopify/polaris';
import { InfoIcon } from '@shopify/polaris-icons';

interface KnowledgeSource {
  id: string;
  title: string;
  similarity: number;
  type: string;
  views?: number;
  revenue?: number;
}

interface PoweredByContextProps {
  sources: KnowledgeSource[];
  onViewDetails?: (source: KnowledgeSource) => void;
  compact?: boolean;
}

export function PoweredByContext({
  sources,
  onViewDetails,
  compact = false,
}: PoweredByContextProps) {
  const [popoverActive, setPopoverActive] = React.useState(false);

  const togglePopoverActive = () => {
    setPopoverActive((active) => !active);
  };

  const activator = React.createElement(Button, {
    variant: "plain",
    onClick: togglePopoverActive,
    disclosure: "down",
    size: "micro",
  }, React.createElement(InlineStack, {
    gap: "200",
    blockAlign: "center"
  }, React.createElement(Icon, {
    source: InfoIcon,
    tone: "subdued"
  }), React.createElement(Text, {
    as: "span",
    variant: "bodySm",
    tone: "subdued"
  }, `Powered by ${sources.length} top performers`)));

  if (compact) {
    return (
      <InlineStack gap="200" blockAlign="center">
        <Icon source={InfoIcon} tone="subdued" />
        <Text as="span" variant="bodyXs" tone="subdued">
          Using {sources.length} similar items
        </Text>
        <Popover
          active={popoverActive}
          activator={activator}
          autofocusTarget="first-node"
          onClose={togglePopoverActive}
        >
          <ActionList
            actionRole="menuitem"
            items={sources.map((source) => ({
              content: source.title,
              suffix: (
                <Badge tone="info" size="small">
                  {`${(source.similarity * 100).toFixed(0)}%`}
                </Badge>
              ),
              onAction: () => onViewDetails?.(source),
            }))}
          />
        </Popover>
      </InlineStack>
    );
  }

  return (
    <Card>
      <BlockStack gap="300">
        <InlineStack align="space-between" blockAlign="center">
          <InlineStack gap="200" blockAlign="center">
            <Icon source={InfoIcon} tone="subdued" />
            <Text as="h3" variant="headingSm">
              Powered by Context
            </Text>
          </InlineStack>
          <Button
            variant="plain"
            onClick={togglePopoverActive}
            disclosure={popoverActive ? 'up' : 'down'}
            size="micro"
          >
            View all
          </Button>
        </InlineStack>

        <Text as="p" variant="bodySm" tone="subdued">
          Using insights from {sources.length} top performing items
        </Text>

        <Box>
          <BlockStack gap="200">
            {sources.slice(0, 3).map((source, index) => (
              <Box
                key={source.id}
                padding="200"
                borderWidth="025"
                borderColor="border"
                borderRadius="200"
              >
                <InlineStack align="space-between" blockAlign="center">
                  <BlockStack gap="050">
                    <Text as="p" variant="bodySm" fontWeight="medium">
                      {source.title}
                    </Text>
                    <InlineStack gap="100">
                      <Badge size="small">{source.type}</Badge>
                      {source.views && (
                        <Text as="span" variant="bodyXs" tone="subdued">
                          {source.views.toLocaleString()} views
                        </Text>
                      )}
                      {source.revenue && (
                        <Text as="span" variant="bodyXs" tone="success">
                          ${source.revenue.toFixed(0)} revenue
                        </Text>
                      )}
                    </InlineStack>
                  </BlockStack>
                  <Badge tone="info">
                    {`${(source.similarity * 100).toFixed(0)}% match`}
                  </Badge>
                </InlineStack>
              </Box>
            ))}
          </BlockStack>
        </Box>

        {sources.length > 3 && (
          <Popover
            active={popoverActive}
            activator={
              <Button
                variant="plain"
                onClick={togglePopoverActive}
                disclosure={popoverActive ? 'up' : 'down'}
                size="micro"
                fullWidth
              >
                View {sources.length - 3} more sources
              </Button>
            }
            autofocusTarget="first-node"
            onClose={togglePopoverActive}
          >
            <Card padding="0">
              <ActionList
                actionRole="menuitem"
                items={sources.map((source) => ({
                  content: source.title,
                  prefix: (
                    <Badge size="small" tone="subdued">
                      {source.type}
                    </Badge>
                  ),
                  suffix: (
                    <InlineStack gap="200">
                      {source.views && (
                        <Text as="span" variant="bodyXs" tone="subdued">
                          {source.views.toLocaleString()} views
                        </Text>
                      )}
                      <Badge tone="info" size="small">
                        {`${(source.similarity * 100).toFixed(0)}%`}
                      </Badge>
                    </InlineStack>
                  ),
                  onAction: () => onViewDetails?.(source),
                }))}
              />
            </Card>
          </Popover>
        )}
      </BlockStack>
    </Card>
  );
}

// Usage example for different contexts
export function ChatCloserContext({ sources }: { sources: KnowledgeSource[] }) {
  return (
    <PoweredByContext
      sources={sources}
      onViewDetails={(source) => {
        console.log('View chat closer:', source);
      }}
      compact={true}
    />
  );
}

export function ContentContext({ sources }: { sources: KnowledgeSource[] }) {
  return (
    <PoweredByContext
      sources={sources}
      onViewDetails={(source) => {
        console.log('View viral structure:', source);
      }}
    />
  );
}

export function EditingContext({ sources }: { sources: KnowledgeSource[] }) {
  return (
    <PoweredByContext
      sources={sources}
      onViewDetails={(source) => {
        console.log('View editing rules:', source);
      }}
      compact={true}
    />
  );
}
