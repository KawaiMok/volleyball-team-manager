"use client";

import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type TargetAndTransition,
  type Transition,
} from "motion/react";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import {
  consumeNavDirection,
  resolveTransitionKind,
  type NavDirection,
  type TransitionKind,
} from "@/hooks/use-navigation-direction";

type Props = {
  children: React.ReactNode;
};

const VARIANTS: Record<
  TransitionKind,
  {
    initial: TargetAndTransition;
    animate: TargetAndTransition;
    exit: TargetAndTransition;
    transition: Transition;
  }
> = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.15, ease: "easeOut" },
  },
  crossfade: {
    initial: { opacity: 0, scale: 0.98 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.98 },
    transition: { duration: 0.2, ease: "easeOut" },
  },
  "stack-push": {
    initial: { opacity: 0.85, x: "18%" },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0.7, x: "-12%" },
    transition: { duration: 0.28, ease: [0.32, 0.72, 0, 1] },
  },
  "stack-pop": {
    initial: { opacity: 0.7, x: "-12%" },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0.85, x: "18%" },
    transition: { duration: 0.28, ease: [0.32, 0.72, 0, 1] },
  },
};

/**
 * App Router 頁面轉場（註解：掛在 `(main)/template.tsx`；Tab fade、詳情 slide stack）。
 */
export function PageTransition({ children }: Props) {
  const pathname = usePathname() ?? "";
  const reducedMotion = useReducedMotion();
  const prevPathRef = useRef(pathname);
  const directionRef = useRef<NavDirection>("forward");

  // 路由變更時才 consume 方向（註解：避免每次 re-render 清掉 sessionStorage）
  if (pathname !== prevPathRef.current) {
    directionRef.current = consumeNavDirection();
  }

  const kind = resolveTransitionKind(prevPathRef.current, pathname, directionRef.current);
  const variant = VARIANTS[kind];

  useEffect(() => {
    prevPathRef.current = pathname;
  }, [pathname]);

  if (reducedMotion) {
    return <div key={pathname}>{children}</div>;
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={variant.initial}
        animate={variant.animate}
        exit={variant.exit}
        transition={variant.transition}
        className="min-h-0"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
