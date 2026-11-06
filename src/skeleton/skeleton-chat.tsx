// skeleton-chat.tsx
// Placeholder for a chat: message bubbles on both sides and an input bar.

import type { ReactElement } from "react";

const CHAT_BUBBLE_COUNT = 6;

/** Builds alternating chat bubble placeholders (start / end). */
function buildBubbles(bubbleCount: number): ReactElement[] {
  const bubbles: ReactElement[] = [];
  for (let bubbleIndex = 0; bubbleIndex < bubbleCount; bubbleIndex += 1) {
    const isEnd = bubbleIndex % 2 === 1;
    const bubble = (
      <div key={bubbleIndex} className={isEnd ? "chat chat-end" : "chat chat-start"}>
        <div className="chat-image">
          <div className="skeleton size-10 rounded-full" />
        </div>
        <div className="skeleton h-10 w-48" />
      </div>
    );
    bubbles.push(bubble);
  }
  return bubbles;
}

export function SkeletonChat() {
  const bubbles = buildBubbles(CHAT_BUBBLE_COUNT);
  return (
    <div className="flex flex-col gap-2" aria-hidden="true">
      {bubbles}
      <div className="skeleton mt-2 h-12 w-full" />
    </div>
  );
}
