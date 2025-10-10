import Link from 'next/link';
import clsx from 'clsx';

interface SectionExplainerProps {
  title: string;
  description: string;
  actionLabel: string;
  actionHref?: string;
  className?: string;
}

/**
 * Simple text block used under each connector graph to explain the value of the section.
 */
export default function SectionExplainer({
  title,
  description,
  actionLabel,
  actionHref = '#',
  className,
}: SectionExplainerProps) {
  return (
    <section className={clsx('hz-info-block', className)}>
      <div className="hz-info-content">
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <Link className="hz-button" href={actionHref}>
        {actionLabel}
      </Link>
    </section>
  );
}
