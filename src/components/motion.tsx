import { useLayoutEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

const reducedMotionQuery = '(prefers-reduced-motion: reduce)';

function prefersReducedMotion() {
  return (
    window.matchMedia(reducedMotionQuery).matches ||
    document.documentElement.dataset.reducedMotion === 'true'
  );
}

// Only watch preferences while an entrance is pending or playing.
function watchReducedMotion(onReduce: () => void) {
  const media = window.matchMedia(reducedMotionQuery);
  const onChange = () => {
    if (prefersReducedMotion()) onReduce();
  };
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-reduced-motion'],
  });
  media.addEventListener('change', onChange);

  return () => {
    observer.disconnect();
    media.removeEventListener('change', onChange);
  };
}

export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;

    const show = () => {
      node.classList.remove('motion-pending');
      node.classList.add('motion-visible');
    };

    if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
      show();
      return;
    }

    node.classList.remove('motion-visible');
    node.classList.add('motion-pending');
    const reveal = () => {
      show();
      observer.disconnect();
      stopWatching();
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) reveal();
      },
      { threshold: 0 }
    );
    const stopWatching = watchReducedMotion(reveal);
    // Keyboard navigation must never focus an invisible control.
    node.addEventListener('focusin', reveal);
    observer.observe(node);

    return () => {
      observer.disconnect();
      stopWatching();
      node.removeEventListener('focusin', reveal);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={['motion-reveal', className].filter(Boolean).join(' ')}
      style={
        {
          '--reveal-delay': `${Number.isFinite(delay) ? Math.max(0, Math.min(delay, 240)) : 0}ms`,
        } as CSSProperties
      }
    >
      {children}
    </div>
  );
}

export function RouteTransition({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node || prefersReducedMotion() || typeof node.animate !== 'function') return;

    // Replay the entrance without resetting route state or retaining a transform.
    const animation = node.animate(
      [
        { opacity: 0, transform: 'translate3d(0, 8px, 0)' },
        { opacity: 1, transform: 'none' },
      ],
      { duration: 220, easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)' }
    );
    const stopWatching = watchReducedMotion(() => animation.cancel());
    animation.addEventListener('finish', stopWatching, { once: true });
    animation.addEventListener('cancel', stopWatching, { once: true });

    return () => {
      stopWatching();
      animation.removeEventListener('finish', stopWatching);
      animation.removeEventListener('cancel', stopWatching);
      animation.cancel();
    };
  }, [pathname]);

  return (
    <div ref={ref} className="route-transition">
      {children}
    </div>
  );
}
