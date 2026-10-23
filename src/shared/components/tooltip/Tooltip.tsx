import { cloneElement, useId, type ReactElement } from 'react';

import * as styles from './Tooltip.css';

interface TooltipProps {
  content: string;
  children: ReactElement<{ 'aria-describedby'?: string }>;
  placement?: 'top' | 'right';
  enabled?: boolean;
  fullWidth?: boolean;
  describeTrigger?: boolean;
}

const Tooltip = ({
  content,
  children,
  placement = 'top',
  enabled = true,
  fullWidth = false,
  describeTrigger = true,
}: TooltipProps) => {
  const tooltipId = useId();

  if (!enabled) return children;

  return (
    <span className={`${styles.trigger} ${fullWidth ? styles.fullWidthTrigger : ''}`}>
      {describeTrigger
        ? cloneElement(children, {
            'aria-describedby': [children.props['aria-describedby'], tooltipId]
              .filter(Boolean)
              .join(' '),
          })
        : children}
      <span id={tooltipId} className={styles.content({ placement })} role="tooltip">
        {content}
      </span>
    </span>
  );
};

export default Tooltip;
