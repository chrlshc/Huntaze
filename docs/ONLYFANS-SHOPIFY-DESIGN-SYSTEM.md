# OnlyFans/Shopify Design System

This documentation outlines the standardized design system components that apply the OnlyFans visual style with Shopify-like polish throughout the application.

## Overview

The design system includes:
- Consistent spacing and typography
- Card component with elevation and hover effects
- Form inputs with modern styling
- Buttons with multiple variants
- Category pills/badges
- Table components
- Standardized layout system

## Setup

To apply the design system to your pages:

1. Ensure the `GlobalThemeProvider` is included in your app shell:

```tsx
import { GlobalThemeProvider } from '@/components/layout/GlobalThemeProvider';

function AppShell({ children }) {
  return (
    <GlobalThemeProvider>
      {/* Rest of your app shell */}
      {children}
    </GlobalThemeProvider>
  );
}
```

2. Use the shared components in your pages

## Core Components

### Card

The `Card` component provides a consistent surface with elevation and hover effects.

```tsx
import { Card } from '@/components/shared/Card';

<Card
  title="Optional Card Title"
  subtitle="Optional subtitle description"
  category="Optional Category Label"
  accent={true} // or specific color like "#4F46E5"
  actions={<Button>Action</Button>}
  footer={<div>Optional Footer</div>}
  padding="default" // or "none", "small", "large"
>
  Card content goes here
</Card>
```

#### Props

| Prop | Type | Description |
|------|------|-------------|
| children | ReactNode | Card content |
| accent | boolean \| string | Show accent border (true or color string) |
| className | string | Optional CSS class |
| category | string | Optional category pill text |
| title | string | Optional card title |
| subtitle | string | Optional card subtitle |
| actions | ReactNode | Optional action buttons in header |
| footer | ReactNode | Optional footer content |
| padding | 'none' \| 'small' \| 'default' \| 'large' | Optional card padding |

### Button

Standardized button component with multiple variants and states.

```tsx
import { Button } from '@/components/shared/Button';

<Button 
  variant="primary" 
  size="md" 
  leftIcon={<Icon />}
  loading={isLoading}
  fullWidth
  onClick={handleClick}
>
  Button Text
</Button>
```

#### Props

| Prop | Type | Description |
|------|------|-------------|
| variant | 'primary' \| 'secondary' \| 'outline' \| 'ghost' \| 'danger' \| 'success' | Visual variant |
| size | 'sm' \| 'md' \| 'lg' | Button size |
| fullWidth | boolean | Make button full width |
| leftIcon | ReactNode | Optional left icon |
| rightIcon | ReactNode | Optional right icon |
| loading | boolean | Shows loading spinner |
| className | string | Optional CSS class |

### FormInput

Standardized form input with consistent styling.

```tsx
import { FormInput } from '@/components/shared/FormInput';

<FormInput
  label="Email Address"
  name="email"
  type="email"
  placeholder="you@example.com"
  error="Invalid email format"
  helperText="We'll never share your email"
  width="full"
  leftIcon={<EmailIcon />}
  onChange={handleChange}
/>
```

#### Props

| Prop | Type | Description |
|------|------|-------------|
| label | string | Input label |
| error | string | Error message |
| helperText | string | Helper text below input |
| width | 'full' \| 'medium' \| 'small' | Input width variant |
| leftIcon | ReactNode | Optional left icon |
| rightIcon | ReactNode | Optional right icon |

### CategoryPill

Badge/pill component for status indicators and categories.

```tsx
import { CategoryPill } from '@/components/shared/CategoryPill';

<CategoryPill variant="success" icon={<CheckIcon />}>Active</CategoryPill>
```

#### Props

| Prop | Type | Description |
|------|------|-------------|
| variant | 'default' \| 'ai' \| 'success' \| 'warning' \| 'error' \| 'info' \| 'draft' \| 'active' | Visual variant/tone |
| className | string | Optional CSS class |
| icon | ReactNode | Optional icon before text |

### Table

Standardized data table with consistent styling.

```tsx
import { Table } from '@/components/shared/Table';

const columns = [
  { 
    header: 'Name', 
    accessor: 'name',
    sortable: true
  },
  { 
    header: 'Status', 
    accessor: (item) => <CategoryPill variant={getVariant(item.status)}>{item.status}</CategoryPill> 
  },
];

<Table 
  data={items}
  columns={columns}
  onRowClick={handleRowClick}
  zebra={true}
  bordered={true}
  isLoading={isLoading}
  emptyState={<EmptyState />}
/>
```

#### Props

| Prop | Type | Description |
|------|------|-------------|
| data | T[] | Array of data objects |
| columns | TableColumn<T>[] | Column configuration |
| keyExtractor | (item: T) => string | Optional key function |
| emptyState | ReactNode | Optional empty state |
| isLoading | boolean | Optional loading state |
| onRowClick | (item: T) => void | Optional row click handler |
| footer | ReactNode | Optional footer content |
| zebra | boolean | Show zebra striping |
| bordered | boolean | Enable border around table |

### ShopifyStyleLayout

Page layout component with consistent spacing and structure.

```tsx
import { ShopifyStyleLayout } from '@/components/layout/ShopifyStyleLayout';

<ShopifyStyleLayout
  title="Page Title"
  subtitle="Optional page description text"
  category="Optional Category"
  actions={<Button>Action</Button>}
  sidebar={<Card>Sidebar content</Card>}
  breadcrumbs={<Breadcrumbs />}
>
  <Card>Main content</Card>
  <Card>More content</Card>
</ShopifyStyleLayout>
```

#### Props

| Prop | Type | Description |
|------|------|-------------|
| title | string | Page title |
| subtitle | string | Optional page subtitle |
| category | string | Optional category badge |
| children | ReactNode | Main content |
| sidebar | ReactNode | Optional sidebar content |
| actions | ReactNode | Optional actions in header |
| breadcrumbs | ReactNode | Optional breadcrumbs |

## Design Tokens

The design system uses the following tokens:

### Spacing

- `--of-space-1`: 4px (Label → helper text)
- `--of-space-2`: 8px (Gaps between elements)
- `--of-space-3`: 12px (Internal card padding)
- `--of-space-4`: 16px (Standard card padding)
- `--of-space-5`: 20px (Large card padding)
- `--of-space-6`: 24px (Section spacing)
- `--of-space-8`: 32px (Major section spacing)

### Border Radius

- `--of-radius-card`: 20px (Cards, large blocks)
- `--of-radius-input`: 16px (Inputs, buttons)
- `--of-radius-chip`: 999px (Pills, badges)

### Shadows

- `--of-shadow-card-saas`: 0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)
- `--of-shadow-card-hover-saas`: 0 4px 8px rgba(0, 0, 0, 0.12), 0 2px 4px rgba(0, 0, 0, 0.06)

### Typography

- `--of-text-h1`: 26px (Page titles)
- `--of-text-section`: 18px (Section headers)
- `--of-text-body`: 14px (Body text)

## Example Usage

See the example implementation page at `/examples/shopify-style` for a complete reference implementation.

## Best Practices

1. **Consistent Card Usage**: Use Card components for all content sections
2. **Standardized Form Inputs**: Use FormInput for all form fields
3. **Consistent Button Styling**: Use Button component with appropriate variants
4. **Layout Structure**: Use ShopifyStyleLayout for page layouts
5. **Status Indicators**: Use CategoryPill for all status/badge indicators
6. **Table Data**: Use Table component for data tables

## Migrating Existing Pages

To update existing pages to use the design system:

1. Wrap the AppShell with the GlobalThemeProvider
2. Replace custom cards with the shared Card component
3. Replace form inputs with FormInput component
4. Replace buttons with Button component
5. Replace status indicators with CategoryPill
6. Use ShopifyStyleLayout for page structure

## Known Issues

- Some legacy components may need manual styling adjustments
- The design system is still being adopted across all pages
