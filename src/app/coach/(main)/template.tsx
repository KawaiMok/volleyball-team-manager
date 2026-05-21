import { PageTransition } from "@/components/ui/page-transition";

/** 教練主區轉場 template（註解：每次路由切換 re-render 並播放動畫） */
export default function CoachMainTemplate({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
