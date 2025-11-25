/**
 * Unit Tests for Homepage Components
 * 
 * Tests the HeroSection, ValueProposition, and HomeCTA components
 * to ensure they render correctly and meet requirements.
 * 
 * Feature: site-restructure-multipage
 * Requirements: 2.1, 2.5
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HeroSection } from '@/components/home/HeroSection';
import { ValueProposition, type Benefit } from '@/components/home/ValueProposition';
import { HomeCTA } from '@/components/home/HomeCTA';
import { BarChart3, Sparkles, Users } from 'lucide-react';

describe('HeroSection', () => {
  describe('Rendering', () => {
    it('should render with all required elements', () => {
      render(
        <HeroSection
          badge="Test Badge"
          title="Test Title"
          subtitle="Test Subtitle"
          ctaText="Test CTA"
          ctaHref="/test"
        />
      );

      expect(screen.getByText('Test Badge')).toBeInTheDocument();
      expect(screen.getByText('Test Title')).toBeInTheDocument();
      expect(screen.getByText('Test Subtitle')).toBeInTheDocument();
      expect(screen.getByText('Test CTA')).toBeInTheDocument();
    });

    it('should render with default badge text', () => {
      render(
        <HeroSection
          title="Test Title"
          subtitle="Test Subtitle"
        />
      );

      expect(screen.getByText('Closed Beta • Invite only')).toBeInTheDocument();
    });

    it('should render with default CTA text and href', () => {
      render(
        <HeroSection
          title="Test Title"
          subtitle="Test Subtitle"
        />
      );

      const ctaLink = screen.getByText('Request Early Access');
      expect(ctaLink).toBeInTheDocument();
      expect(ctaLink.closest('a')).toHaveAttribute('href', '/auth/register');
    });

    it('should render CTA link with correct href', () => {
      render(
        <HeroSection
          title="Test Title"
          subtitle="Test Subtitle"
          ctaText="Get Started"
          ctaHref="/signup"
        />
      );

      const ctaLink = screen.getByText('Get Started');
      expect(ctaLink.closest('a')).toHaveAttribute('href', '/signup');
    });

    it('should render dashboard preview placeholder', () => {
      render(
        <HeroSection
          title="Test Title"
          subtitle="Test Subtitle"
        />
      );

      expect(screen.getByText('Dashboard Preview')).toBeInTheDocument();
    });

    it('should render with React elements as title', () => {
      render(
        <HeroSection
          title={
            <>
              <span>Part 1</span>
              <span>Part 2</span>
            </>
          }
          subtitle="Test Subtitle"
        />
      );

      expect(screen.getByText('Part 1')).toBeInTheDocument();
      expect(screen.getByText('Part 2')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(
        <HeroSection
          title="Main Title"
          subtitle="Subtitle text"
        />
      );

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('Main Title');
    });

    it('should have focusable CTA button', () => {
      render(
        <HeroSection
          title="Test Title"
          subtitle="Test Subtitle"
          ctaText="Click Me"
        />
      );

      const ctaLink = screen.getByText('Click Me').closest('a');
      expect(ctaLink).toHaveClass('focus-visible:ring-2');
    });
  });
});

describe('ValueProposition', () => {
  const mockBenefits: Benefit[] = [
    {
      icon: BarChart3,
      title: 'Clarity',
      subtitle: 'See clearly',
      description: 'Track your revenue and growth across all platforms.',
    },
    {
      icon: Sparkles,
      title: 'Freedom',
      subtitle: 'Save time',
      description: 'Your AI assistant works 24/7.',
    },
    {
      icon: Users,
      title: 'Connection',
      subtitle: 'Know your fans',
      description: 'Identify your top supporters.',
    },
  ];

  describe('Rendering', () => {
    it('should render exactly 3 benefits', () => {
      render(<ValueProposition benefits={mockBenefits} />);

      expect(screen.getByText('Clarity')).toBeInTheDocument();
      expect(screen.getByText('Freedom')).toBeInTheDocument();
      expect(screen.getByText('Connection')).toBeInTheDocument();
    });

    it('should display all benefit details', () => {
      render(<ValueProposition benefits={mockBenefits} />);

      // Check titles
      expect(screen.getByText('Clarity')).toBeInTheDocument();
      expect(screen.getByText('Freedom')).toBeInTheDocument();
      expect(screen.getByText('Connection')).toBeInTheDocument();

      // Check subtitles
      expect(screen.getByText('See clearly')).toBeInTheDocument();
      expect(screen.getByText('Save time')).toBeInTheDocument();
      expect(screen.getByText('Know your fans')).toBeInTheDocument();

      // Check descriptions
      expect(screen.getByText('Track your revenue and growth across all platforms.')).toBeInTheDocument();
      expect(screen.getByText('Your AI assistant works 24/7.')).toBeInTheDocument();
      expect(screen.getByText('Identify your top supporters.')).toBeInTheDocument();
    });

    it('should limit display to exactly 3 benefits when more are provided', () => {
      const extraBenefits: Benefit[] = [
        ...mockBenefits,
        {
          icon: BarChart3,
          title: 'Extra Benefit',
          subtitle: 'Should not appear',
          description: 'This should not be rendered.',
        },
        {
          icon: BarChart3,
          title: 'Another Extra',
          subtitle: 'Also should not appear',
          description: 'This also should not be rendered.',
        },
      ];

      render(<ValueProposition benefits={extraBenefits} />);

      // Should render first 3
      expect(screen.getByText('Clarity')).toBeInTheDocument();
      expect(screen.getByText('Freedom')).toBeInTheDocument();
      expect(screen.getByText('Connection')).toBeInTheDocument();

      // Should NOT render extras
      expect(screen.queryByText('Extra Benefit')).not.toBeInTheDocument();
      expect(screen.queryByText('Another Extra')).not.toBeInTheDocument();
    });

    it('should render with fewer than 3 benefits', () => {
      const twoBenefits = mockBenefits.slice(0, 2);
      render(<ValueProposition benefits={twoBenefits} />);

      expect(screen.getByText('Clarity')).toBeInTheDocument();
      expect(screen.getByText('Freedom')).toBeInTheDocument();
      expect(screen.queryByText('Connection')).not.toBeInTheDocument();
    });

    it('should render icons for each benefit', () => {
      const { container } = render(<ValueProposition benefits={mockBenefits} />);

      // Check that SVG icons are rendered (Lucide icons render as SVGs)
      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Layout', () => {
    it('should use grid layout for benefits', () => {
      const { container } = render(<ValueProposition benefits={mockBenefits} />);

      const grid = container.querySelector('.grid');
      expect(grid).toBeInTheDocument();
      expect(grid).toHaveClass('grid-cols-1');
      expect(grid).toHaveClass('lg:grid-cols-3');
    });
  });
});

describe('HomeCTA', () => {
  describe('Rendering', () => {
    it('should render with all default elements', () => {
      render(<HomeCTA />);

      expect(screen.getByText('Ready to upgrade your workflow?')).toBeInTheDocument();
      expect(screen.getByText('Request Access')).toBeInTheDocument();
      expect(screen.getByText('Explore Features →')).toBeInTheDocument();
      expect(screen.getByText('View Pricing →')).toBeInTheDocument();
      expect(screen.getByText('About Us →')).toBeInTheDocument();
    });

    it('should render with custom title', () => {
      render(<HomeCTA title="Join us today!" />);

      expect(screen.getByText('Join us today!')).toBeInTheDocument();
    });

    it('should render with custom CTA text and href', () => {
      render(
        <HomeCTA
          ctaText="Sign Up Now"
          ctaHref="/signup"
        />
      );

      const ctaLink = screen.getByText('Sign Up Now');
      expect(ctaLink).toBeInTheDocument();
      expect(ctaLink.closest('a')).toHaveAttribute('href', '/signup');
    });

    it('should include proper navigation links', () => {
      render(<HomeCTA />);

      const featuresLink = screen.getByText('Explore Features →').closest('a');
      const pricingLink = screen.getByText('View Pricing →').closest('a');
      const aboutLink = screen.getByText('About Us →').closest('a');

      expect(featuresLink).toHaveAttribute('href', '/features');
      expect(pricingLink).toHaveAttribute('href', '/pricing');
      expect(aboutLink).toHaveAttribute('href', '/about');
    });

    it('should allow custom navigation link hrefs', () => {
      render(
        <HomeCTA
          featuresLink="/custom-features"
          pricingLink="/custom-pricing"
          aboutLink="/custom-about"
        />
      );

      const featuresLink = screen.getByText('Explore Features →').closest('a');
      const pricingLink = screen.getByText('View Pricing →').closest('a');
      const aboutLink = screen.getByText('About Us →').closest('a');

      expect(featuresLink).toHaveAttribute('href', '/custom-features');
      expect(pricingLink).toHaveAttribute('href', '/custom-pricing');
      expect(aboutLink).toHaveAttribute('href', '/custom-about');
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<HomeCTA />);

      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent('Ready to upgrade your workflow?');
    });

    it('should have focusable primary CTA', () => {
      render(<HomeCTA />);

      const ctaLink = screen.getByText('Request Access').closest('a');
      expect(ctaLink).toHaveClass('focus-visible:ring-2');
    });

    it('should have focusable navigation links', () => {
      render(<HomeCTA />);

      const featuresLink = screen.getByText('Explore Features →').closest('a');
      const pricingLink = screen.getByText('View Pricing →').closest('a');
      const aboutLink = screen.getByText('About Us →').closest('a');

      expect(featuresLink).toHaveClass('focus-visible:ring-2');
      expect(pricingLink).toHaveClass('focus-visible:ring-2');
      expect(aboutLink).toHaveClass('focus-visible:ring-2');
    });
  });

  describe('Layout', () => {
    it('should center content', () => {
      const { container } = render(<HomeCTA />);

      const section = container.querySelector('section');
      expect(section).toHaveClass('text-center');
    });

    it('should display navigation links in a row', () => {
      const { container } = render(<HomeCTA />);

      const linksContainer = container.querySelector('.flex.flex-wrap');
      expect(linksContainer).toBeInTheDocument();
      expect(linksContainer).toHaveClass('justify-center');
    });
  });
});

describe('Homepage Components Integration', () => {
  it('should work together to create a complete homepage', () => {
    const benefits: Benefit[] = [
      {
        icon: BarChart3,
        title: 'Clarity',
        subtitle: 'See clearly',
        description: 'Track your revenue.',
      },
      {
        icon: Sparkles,
        title: 'Freedom',
        subtitle: 'Save time',
        description: 'AI assistant works 24/7.',
      },
      {
        icon: Users,
        title: 'Connection',
        subtitle: 'Know your fans',
        description: 'Identify top supporters.',
      },
    ];

    const { container } = render(
      <>
        <HeroSection
          title="Test Homepage"
          subtitle="Test subtitle"
        />
        <ValueProposition benefits={benefits} />
        <HomeCTA />
      </>
    );

    // Verify all sections are present
    expect(screen.getByText('Test Homepage')).toBeInTheDocument();
    expect(screen.getByText('Clarity')).toBeInTheDocument();
    expect(screen.getByText('Ready to upgrade your workflow?')).toBeInTheDocument();

    // Verify structure
    const sections = container.querySelectorAll('section');
    expect(sections.length).toBe(3);
  });
});
