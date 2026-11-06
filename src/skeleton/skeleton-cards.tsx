// skeleton-cards.tsx
// Placeholder for a grid of cards (products, stores, articles ...).

import type { ReactElement } from "react";

export interface SkeletonCardsProps {
  /** Number of cards. Default 6. */
  count?: number;
}

/** Builds the card placeholders. */
function buildCards(cardCount: number): ReactElement[] {
  const cards: ReactElement[] = [];
  for (let cardIndex = 0; cardIndex < cardCount; cardIndex += 1) {
    const card = (
      <div key={cardIndex} className="flex flex-col gap-3 rounded-box bg-base-100 p-4 shadow-sm">
        <div className="skeleton h-32 w-full" />
        <div className="skeleton h-4 w-3/4" />
        <div className="skeleton h-4 w-1/2" />
      </div>
    );
    cards.push(card);
  }
  return cards;
}

export function SkeletonCards(props: SkeletonCardsProps) {
  const { count = 6 } = props;
  const cards = buildCards(count);
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
      {cards}
    </div>
  );
}
