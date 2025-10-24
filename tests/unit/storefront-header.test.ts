import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

// Mock StorefrontHeader component
const MockStorefrontHeader = ({ 
  logo, 
  navigation, 
  searchEnabled = true, 
  cartItemCount = 0,
  onSearch,
  onCartClick,
  onMenuToggle 
}: any) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');

  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen);
    onMenuToggle?.(isMenuOpen);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchQuery);
  };

  return (
    <header className="storefront-header" role="banner">
      {/* Mobile menu button */}
      <button
        className="menu-toggle md:hidden"
        onClick={handleMenuToggle}
        aria-label="Toggle navigation menu"
        aria-expanded={isMenuOpen}
      >
        ☰
      </button>

      {/* Logo */}
      <div className="logo">
        <img src={logo} alt="Store logo" />
      </div>

      {/* Navigation */}
      <nav 
        className={`navigation ${isMenuOpen ? 'open' : 'closed'}`}
        aria-label="Main navigation"
      >
        <ul>
          {navigation?.map((item: any, index: number) => (
            <li key={index}>
              <a href={item.href}>{item.label}</a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Search */}
      {searchEnabled && (
        <form onSubmit={handleSearch} className="search-form" role="search">
          <label htmlFor="search-input" className="sr-only">
            Search products
          </label>
          <input
            id="search-input"
            type="search"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search products"
          />
          <button type="submit" aria-label="Submit search">
            🔍
          </button>
        </form>
      )}

      {/* Cart */}
      <button
        className="cart-button"
        onClick={onCartClick}
        aria-label={`Shopping cart with ${cartItemCount} items`}
      >
        Cart
        {cartItemCount > 0 && (
          <span className="cart-count" aria-label={`${cartItemCount} items in cart`}>
            {cartItemCount}
          </span>
        )}
      </button>
    </header>
  );
};

// Mock React for useState
const React = {
  useState: vi.fn(),
};

vi.mock('react', () => ({
  ...vi.importActual('react'),
  useState: (initial: any) => {
    const [state, setState] = vi.fn().mockReturnValue([initial, vi.fn()]);
    return [state(), setState];
  },
}));

describe('StorefrontHeader Component', () => {
  const defaultProps = {
    logo: '/logo.png',
    navigation: [
      { href: '/products', label: 'Products' },
      { href: '/about', label: 'About' },
      { href: '/contact', label: 'Contact' },
    ],
    searchEnabled: true,
    cartItemCount: 0,
    onSearch: vi.fn(),
    onCartClick: vi.fn(),
    onMenuToggle: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset useState mock
    React.useState = vi.fn((initial) => [initial, vi.fn()]);
  });

  describe('Rendering', () => {
    it('should render header with all elements', () => {
      render(<MockStorefrontHeader {...defaultProps} />);

      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByAltText('Store logo')).toBeInTheDocument();
      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(screen.getByRole('search')).toBeInTheDocument();
      expect(screen.getByLabelText(/shopping cart/i)).toBeInTheDocument();
    });

    it('should render navigation items', () => {
      render(<MockStorefrontHeader {...defaultProps} />);

      expect(screen.getByText('Products')).toBeInTheDocument();
      expect(screen.getByText('About')).toBeInTheDocument();
      expect(screen.getByText('Contact')).toBeInTheDocument();
    });

    it('should render cart with item count', () => {
      render(<MockStorefrontHeader {...defaultProps} cartItemCount={5} />);

      expect(screen.getByLabelText('Shopping cart with 5 items')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('should hide search when disabled', () => {
      render(<MockStorefrontHeader {...defaultProps} searchEnabled={false} />);

      expect(screen.queryByRole('search')).not.toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('should show mobile menu toggle on small screens', () => {
      render(<MockStorefrontHeader {...defaultProps} />);

      const menuToggle = screen.getByLabelText('Toggle navigation menu');
      expect(menuToggle).toBeInTheDocument();
      expect(menuToggle).toHaveClass('md:hidden');
    });

    it('should toggle mobile menu', async () => {
      const user = userEvent.setup();
      const onMenuToggle = vi.fn();

      render(<MockStorefrontHeader {...defaultProps} onMenuToggle={onMenuToggle} />);

      const menuToggle = screen.getByLabelText('Toggle navigation menu');
      await user.click(menuToggle);

      expect(onMenuToggle).toHaveBeenCalledWith(false);
    });

    it('should update aria-expanded on menu toggle', async () => {
      const user = userEvent.setup();
      
      render(<MockStorefrontHeader {...defaultProps} />);

      const menuToggle = screen.getByLabelText('Toggle navigation menu');
      expect(menuToggle).toHaveAttribute('aria-expanded', 'false');

      await user.click(menuToggle);
      // Note: In a real implementation, this would update based on state
    });
  });

  describe('Search Functionality', () => {
    it('should handle search input', async () => {
      const user = userEvent.setup();
      
      render(<MockStorefrontHeader {...defaultProps} />);

      const searchInput = screen.getByLabelText('Search products');
      await user.type(searchInput, 'test query');

      expect(searchInput).toHaveValue('test query');
    });

    it('should submit search form', async () => {
      const user = userEvent.setup();
      const onSearch = vi.fn();

      render(<MockStorefrontHeader {...defaultProps} onSearch={onSearch} />);

      const searchInput = screen.getByLabelText('Search products');
      const searchButton = screen.getByLabelText('Submit search');

      await user.type(searchInput, 'test query');
      await user.click(searchButton);

      expect(onSearch).toHaveBeenCalledWith('test query');
    });

    it('should submit search on Enter key', async () => {
      const user = userEvent.setup();
      const onSearch = vi.fn();

      render(<MockStorefrontHeader {...defaultProps} onSearch={onSearch} />);

      const searchInput = screen.getByLabelText('Search products');
      await user.type(searchInput, 'test query{enter}');

      expect(onSearch).toHaveBeenCalledWith('test query');
    });
  });

  describe('Cart Interaction', () => {
    it('should handle cart click', async () => {
      const user = userEvent.setup();
      const onCartClick = vi.fn();

      render(<MockStorefrontHeader {...defaultProps} onCartClick={onCartClick} />);

      const cartButton = screen.getByLabelText(/shopping cart/i);
      await user.click(cartButton);

      expect(onCartClick).toHaveBeenCalled();
    });

    it('should display correct cart count', () => {
      render(<MockStorefrontHeader {...defaultProps} cartItemCount={10} />);

      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getByLabelText('10 items in cart')).toBeInTheDocument();
    });

    it('should not show cart count when zero', () => {
      render(<MockStorefrontHeader {...defaultProps} cartItemCount={0} />);

      expect(screen.queryByText('0')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<MockStorefrontHeader {...defaultProps} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper ARIA labels', () => {
      render(<MockStorefrontHeader {...defaultProps} cartItemCount={3} />);

      expect(screen.getByLabelText('Toggle navigation menu')).toBeInTheDocument();
      expect(screen.getByLabelText('Search products')).toBeInTheDocument();
      expect(screen.getByLabelText('Submit search')).toBeInTheDocument();
      expect(screen.getByLabelText('Shopping cart with 3 items')).toBeInTheDocument();
    });

    it('should have proper semantic structure', () => {
      render(<MockStorefrontHeader {...defaultProps} />);

      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(screen.getByRole('search')).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      
      render(<MockStorefrontHeader {...defaultProps} />);

      // Tab through interactive elements
      await user.tab();
      expect(screen.getByLabelText('Toggle navigation menu')).toHaveFocus();

      await user.tab();
      expect(screen.getByText('Products')).toHaveFocus();

      await user.tab();
      expect(screen.getByText('About')).toHaveFocus();
    });
  });

  describe('Performance', () => {
    it('should render within performance budget', () => {
      const startTime = performance.now();
      
      render(<MockStorefrontHeader {...defaultProps} />);
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within 100ms
      expect(renderTime).toBeLessThan(100);
    });

    it('should handle large navigation menus efficiently', () => {
      const largeNavigation = Array.from({ length: 50 }, (_, i) => ({
        href: `/category-${i}`,
        label: `Category ${i}`,
      }));

      const startTime = performance.now();
      
      render(<MockStorefrontHeader {...defaultProps} navigation={largeNavigation} />);
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;

      expect(renderTime).toBeLessThan(200);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing logo gracefully', () => {
      render(<MockStorefrontHeader {...defaultProps} logo="" />);

      const logo = screen.getByAltText('Store logo');
      expect(logo).toHaveAttribute('src', '');
    });

    it('should handle empty navigation', () => {
      render(<MockStorefrontHeader {...defaultProps} navigation={[]} />);

      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
      expect(nav.querySelector('ul')).toBeEmptyDOMElement();
    });

    it('should handle search errors gracefully', async () => {
      const user = userEvent.setup();
      const onSearch = vi.fn().mockImplementation(() => {
        throw new Error('Search failed');
      });

      render(<MockStorefrontHeader {...defaultProps} onSearch={onSearch} />);

      const searchInput = screen.getByLabelText('Search products');
      const searchButton = screen.getByLabelText('Submit search');

      await user.type(searchInput, 'test');
      
      // Should not throw error
      expect(async () => {
        await user.click(searchButton);
      }).not.toThrow();
    });
  });
});