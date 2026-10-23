import type { ReactNode } from 'react';

import clsx from 'clsx';

import * as styles from './EmptyState.css';

export type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
  size?: 'default' | 'compact';
  tone?: 'light' | 'dark';
};

const EmptyState = ({
  title,
  description,
  icon,
  action,
  className,
  size = 'default',
  tone = 'light',
}: EmptyStateProps) => (
  <div className={clsx(styles.container, size === 'compact' && styles.containerCompact, className)}>
    {icon ? (
      <span
        className={clsx(
          styles.icon,
          size === 'compact' && styles.iconCompact,
          tone === 'dark' && styles.iconDark,
        )}
        aria-hidden="true"
      >
        {icon}
      </span>
    ) : null}

    <div className={styles.text}>
      <strong
        className={clsx(
          styles.title,
          size === 'compact' && styles.titleCompact,
          tone === 'dark' && styles.titleDark,
        )}
      >
        {title}
      </strong>
      {description ? (
        <p
          className={clsx(
            styles.description,
            size === 'compact' && styles.descriptionCompact,
            tone === 'dark' && styles.descriptionDark,
          )}
        >
          {description}
        </p>
      ) : null}
    </div>

    {action}
  </div>
);

export default EmptyState;
