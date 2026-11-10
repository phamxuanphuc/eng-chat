export interface Position {
  x: number;
  y: number;
}

export interface PopupAnchor extends Position {
  top?: number;
}

const MARGIN = 8;

export const clampPosition = (x: number, y: number, width: number, height: number): Position => {
  const maxX = Math.max(MARGIN, window.innerWidth - width - MARGIN);
  const maxY = Math.max(MARGIN, window.innerHeight - height - MARGIN);
  return {
    x: Math.min(Math.max(MARGIN, x), maxX),
    y: Math.min(Math.max(MARGIN, y), maxY),
  };
};

export const placeNearAnchor = (anchor: PopupAnchor, width: number, height: number): Position => {
  const fitsBelow = anchor.y + height + MARGIN <= window.innerHeight;
  const above = (anchor.top ?? anchor.y) - MARGIN - height;
  const y = fitsBelow || above < MARGIN ? anchor.y : above;
  return clampPosition(anchor.x, y, width, height);
};
