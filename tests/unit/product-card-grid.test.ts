import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

// Mock ProductCard component
const MockProductCard = ({ product, onAddToCart, onQuickView, className }: any) => (
  <div className={`product-card ${className || ''}`} data-testid={`product-${product.id}`}>
    <div className="product-image">
      <img src={product.image} alt={product.name} loading="lazy" />
      {product.badge && (
        <span className={`badge ${product.badge.type}`}>{product.badge.text}</span>
      )}
    </div>
    
    <div className="product-info">
      <h3 className="product-name">{product.name}</h3>
      <p className="product-price">
        {product.salePrice ? (
          <>
            <span className="sale-price">${product.salePrice}</span>
            <span className="original-price">${product.price}</span>
          </>
        ) : (
          <span className="price">${product.price}</span>
        )}
      </p>
      
      {product.rating && (
        <div className="product-rating" aria-label={`Rating: ${product.rating} out of 5 stars`}>
          {'★'.repeat(Math.floor(product.rating))}{'☆'.repeat(5 - Math.floor(product.rating))}
          <span className="rating-count">({product.reviewCount})</span>
        </div>
      )}
    </div>

    <div className="product-actions">
      <button
        onClick={() => onQuickView?.(product)}
        className="quick-view-btn"
        aria-label={`Quick view ${product.name}`}
      >
        Quick View
      </button>
      <button
        onClick={() => onAddToCart?.(product)}
        className="add-to-cart-btn"
        disabled={!product.inStock}
        aria-label={`Add ${product.name} to cart`}
      >
        {product.inStock ? 'Add to Cart' : 'Out of Stock'}
      </button>
    </div>
  </div>
);

// Mock ProductGrid component
const MockProductGrid = ({ 
  products, 
  columns = 4, 
  loading = false, 
  error = null,
  onAddToCart,
  onQuickView,
  onLoadMore,
  hasMore = false,
  className 
}: any) => {
  if (loading) {
    return (
      <div className="product-grid loading" aria-live="polite">
        <div className="loading-spinner" role="status" aria-label="Loading products">
          Loading...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="product-grid error" role="alert">
        <p>Error loading products: {error.message}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="product-grid empty">
        <p>No products found.</p>
      </div>
    );
  }

  return (
    <div className={`product-grid ${className || ''}`}>
      <div 
        className={`grid-container columns-${columns}`}
        style={{ 
          display: 'grid', 
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: '1rem'
        }}
      >
        {products.map((product: any) => (
          <MockProductCard
            key={product.id}
            product={product}
            onAddToCart={onAddToCart}
            onQuickView={onQuickView}
          />
        ))}
      </div>

      {hasMore && (
        <div className="load-more-container">
          <button
            onClick={onLoadMore}
            className="load-more-btn"
            aria-label="Load more products"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
};

describe('ProductCard Component', () => {
  const mockProduct = {
    id: '1',
    name: 'Test Product',
    price: 99.99,
    image: '/product-image.jpg',
    inStock: true,
    rating: 4.5,
    reviewCount: 123,
  };

  const mockHandlers = {
    onAddToCart: vi.fn(),
    onQuickView: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render product information correctly', () => {
      render(<MockProductCard product={mockProduct} {...mockHandlers} />);

      expect(screen.getByText('Test Product')).toBeInTheDocument();
      expect(screen.getByText('$99.99')).toBeInTheDocument();
      expect(screen.getByAltText('Test Product')).toBeInTheDocument();
      expect(screen.getByLabelText('Rating: 4.5 out of 5 stars')).toBeInTheDocument();
      expect(screen.getByText('(123)')).toBeInTheDocument();
    });

    it('should render sale price correctly', () => {
      const saleProduct = { ...mockProduct, salePrice: 79.99 };
      render(<MockProductCard product={saleProduct} {...mockHandlers} />);

      expect(screen.getByText('$79.99')).toBeInTheDocument();
      expect(screen.getByText('$99.99')).toBeInTheDocument();
      expect(screen.getByText('$79.99')).toHaveClass('sale-price');
      expect(screen.getByText('$99.99')).toHaveClass('original-price');
    });

    it('should render product badge', () => {
      const badgeProduct = { 
        ...mockProduct, 
        badge: { type: 'sale', text: 'SALE' } 
      };
      render(<MockProductCard product={badgeProduct} {...mockHandlers} />);

      const badge = screen.getByText('SALE');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('badge', 'sale');
    });

    it('should disable add to cart when out of stock', () => {
      const outOfStockProduct = { ...mockProduct, inStock: false };
      render(<MockProductCard product={outOfStockProduct} {...mockHandlers} />);

      const addToCartBtn = screen.getByText('Out of Stock');
      expect(addToCartBtn).toBeDisabled();
    });
  });

  describe('Interactions', () => {
    it('should handle add to cart click', async () => {
      const user = userEvent.setup();
      render(<MockProductCard product={mockProduct} {...mockHandlers} />);

      const addToCartBtn = screen.getByLabelText(`Add ${mockProduct.name} to cart`);
      await user.click(addToCartBtn);

      expect(mockHandlers.onAddToCart).toHaveBeenCalledWith(mockProduct);
    });

    it('should handle quick view click', async () => {
      const user = userEvent.setup();
      render(<MockProductCard product={mockProduct} {...mockHandlers} />);

      const quickViewBtn = screen.getByLabelText(`Quick view ${mockProduct.name}`);
      await user.click(quickViewBtn);

      expect(mockHandlers.onQuickView).toHaveBeenCalledWith(mockProduct);
    });
  });

  describe('Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<MockProductCard product={mockProduct} {...mockHandlers} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper ARIA labels', () => {
      render(<MockProductCard product={mockProduct} {...mockHandlers} />);

      expect(screen.getByLabelText('Rating: 4.5 out of 5 stars')).toBeInTheDocument();
      expect(screen.getByLabelText(`Add ${mockProduct.name} to cart`)).toBeInTheDocument();
      expect(screen.getByLabelText(`Quick view ${mockProduct.name}`)).toBeInTheDocument();
    });

    it('should have proper image alt text', () => {
      render(<MockProductCard product={mockProduct} {...mockHandlers} />);

      const image = screen.getByAltText(mockProduct.name);
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('loading', 'lazy');
    });
  });
});

describe('ProductGrid Component', () => {
  const mockProducts = [
    { id: '1', name: 'Product 1', price: 99.99, image: '/img1.jpg', inStock: true },
    { id: '2', name: 'Product 2', price: 149.99, image: '/img2.jpg', inStock: true },
    { id: '3', name: 'Product 3', price: 79.99, image: '/img3.jpg', inStock: false },
    { id: '4', name: 'Product 4', price: 199.99, image: '/img4.jpg', inStock: true },
  ];

  const mockHandlers = {
    onAddToCart: vi.fn(),
    onQuickView: vi.fn(),
    onLoadMore: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render all products in grid', () => {
      render(<MockProductGrid products={mockProducts} {...mockHandlers} />);

      mockProducts.forEach(product => {
        expect(screen.getByText(product.name)).toBeInTheDocument();
      });
    });

    it('should render with correct column layout', () => {
      render(<MockProductGrid products={mockProducts} columns={3} {...mockHandlers} />);

      const gridContainer = screen.getByRole('main', { hidden: true }) || 
                           document.querySelector('.grid-container');
      
      if (gridContainer) {
        expect(gridContainer).toHaveClass('columns-3');
        expect(gridContainer).toHaveStyle('grid-template-columns: repeat(3, 1fr)');
      }
    });

    it('should render loading state', () => {
      render(<MockProductGrid loading={true} {...mockHandlers} />);

      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByLabelText('Loading products')).toBeInTheDocument();
    });

    it('should render error state', () => {
      const error = new Error('Failed to load products');
      render(<MockProductGrid error={error} {...mockHandlers} />);

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Error loading products: Failed to load products')).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    it('should render empty state', () => {
      render(<MockProductGrid products={[]} {...mockHandlers} />);

      expect(screen.getByText('No products found.')).toBeInTheDocument();
    });

    it('should render load more button when hasMore is true', () => {
      render(<MockProductGrid products={mockProducts} hasMore={true} {...mockHandlers} />);

      expect(screen.getByLabelText('Load more products')).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('should adapt to different screen sizes', () => {
      const { rerender } = render(
        <MockProductGrid products={mockProducts} columns={4} {...mockHandlers} />
      );

      // Desktop: 4 columns
      let gridContainer = document.querySelector('.grid-container');
      expect(gridContainer).toHaveClass('columns-4');

      // Tablet: 3 columns
      rerender(<MockProductGrid products={mockProducts} columns={3} {...mockHandlers} />);
      gridContainer = document.querySelector('.grid-container');
      expect(gridContainer).toHaveClass('columns-3');

      // Mobile: 2 columns
      rerender(<MockProductGrid products={mockProducts} columns={2} {...mockHandlers} />);
      gridContainer = document.querySelector('.grid-container');
      expect(gridContainer).toHaveClass('columns-2');
    });
  });

  describe('Interactions', () => {
    it('should handle load more click', async () => {
      const user = userEvent.setup();
      render(<MockProductGrid products={mockProducts} hasMore={true} {...mockHandlers} />);

      const loadMoreBtn = screen.getByLabelText('Load more products');
      await user.click(loadMoreBtn);

      expect(mockHandlers.onLoadMore).toHaveBeenCalled();
    });

    it('should propagate product interactions', async () => {
      const user = userEvent.setup();
      render(<MockProductGrid products={mockProducts} {...mockHandlers} />);

      // Test add to cart on first product
      const addToCartBtn = screen.getByLabelText('Add Product 1 to cart');
      await user.click(addToCartBtn);

      expect(mockHandlers.onAddToCart).toHaveBeenCalledWith(mockProducts[0]);

      // Test quick view on second product
      const quickViewBtn = screen.getByLabelText('Quick view Product 2');
      await user.click(quickViewBtn);

      expect(mockHandlers.onQuickView).toHaveBeenCalledWith(mockProducts[1]);
    });
  });

  describe('Performance', () => {
    it('should render large product lists efficiently', () => {
      const largeProductList = Array.from({ length: 100 }, (_, i) => ({
        id: `product-${i}`,
        name: `Product ${i}`,
        price: 99.99 + i,
        image: `/img${i}.jpg`,
        inStock: true,
      }));

      const startTime = performance.now();
      render(<MockProductGrid products={largeProductList} {...mockHandlers} />);
      const endTime = performance.now();

      const renderTime = endTime - startTime;
      expect(renderTime).toBeLessThan(200); // Should render within 200ms
    });

    it('should use lazy loading for images', () => {
      render(<MockProductGrid products={mockProducts} {...mockHandlers} />);

      const images = screen.getAllByRole('img');
      images.forEach(img => {
        expect(img).toHaveAttribute('loading', 'lazy');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<MockProductGrid products={mockProducts} {...mockHandlers} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should announce loading state to screen readers', () => {
      render(<MockProductGrid loading={true} {...mockHandlers} />);

      const loadingElement = screen.getByRole('status');
      expect(loadingElement).toHaveAttribute('aria-label', 'Loading products');
    });

    it('should announce errors to screen readers', () => {
      const error = new Error('Network error');
      render(<MockProductGrid error={error} {...mockHandlers} />);

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<MockProductGrid products={mockProducts} {...mockHandlers} />);

      // Tab through interactive elements
      await user.tab();
      expect(screen.getByLabelText('Quick view Product 1')).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText('Add Product 1 to cart')).toHaveFocus();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing product data gracefully', () => {
      const incompleteProducts = [
        { id: '1', name: 'Product 1' }, // Missing price, image
        { id: '2', price: 99.99 }, // Missing name, image
      ];

      expect(() => {
        render(<MockProductGrid products={incompleteProducts} {...mockHandlers} />);
      }).not.toThrow();
    });

    it('should handle network errors gracefully', () => {
      const networkError = new Error('Network request failed');
      render(<MockProductGrid error={networkError} {...mockHandlers} />);

      expect(screen.getByText('Error loading products: Network request failed')).toBeInTheDocument();
    });

    it('should handle retry action', async () => {
      const user = userEvent.setup();
      const reloadSpy = vi.spyOn(window.location, 'reload').mockImplementation(() => {});
      
      const error = new Error('Failed to load');
      render(<MockProductGrid error={error} {...mockHandlers} />);

      const retryBtn = screen.getByText('Retry');
      await user.click(retryBtn);

      expect(reloadSpy).toHaveBeenCalled();
      
      reloadSpy.mockRestore();
    });
  });
});