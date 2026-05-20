window.SKY = window.SKY || {};

window.SKY.Math2D = {
  clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  },

  dist(aX, aY, bX, bY) {
    const dx = aX - bX;
    const dy = aY - bY;
    return Math.sqrt(dx * dx + dy * dy);
  },

  length(x, y) {
    return Math.sqrt(x * x + y * y);
  },

  normalize(x, y) {
    const len = Math.max(0.0001, Math.sqrt(x * x + y * y));
    return { x: x / len, y: y / len };
  },

  pointInRect(x, y, r) {
    return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
  },

  segmentsIntersect(ax, ay, bx, by, cx, cy, dx, dy) {
    const orient = (px, py, qx, qy, rx, ry) => (qy - py) * (rx - qx) - (qx - px) * (ry - qy);
    const onSegment = (px, py, qx, qy, rx, ry) => (
      qx <= Math.max(px, rx) && qx >= Math.min(px, rx) &&
      qy <= Math.max(py, ry) && qy >= Math.min(py, ry)
    );

    const o1 = orient(ax, ay, bx, by, cx, cy);
    const o2 = orient(ax, ay, bx, by, dx, dy);
    const o3 = orient(cx, cy, dx, dy, ax, ay);
    const o4 = orient(cx, cy, dx, dy, bx, by);

    if ((o1 > 0) !== (o2 > 0) && (o3 > 0) !== (o4 > 0)) return true;
    if (Math.abs(o1) < 0.0001 && onSegment(ax, ay, cx, cy, bx, by)) return true;
    if (Math.abs(o2) < 0.0001 && onSegment(ax, ay, dx, dy, bx, by)) return true;
    if (Math.abs(o3) < 0.0001 && onSegment(cx, cy, ax, ay, dx, dy)) return true;
    if (Math.abs(o4) < 0.0001 && onSegment(cx, cy, bx, by, dx, dy)) return true;
    return false;
  },

  segmentIntersectsRect(x1, y1, x2, y2, r) {
    if (!r) return false;
    if (this.pointInRect(x1, y1, r) || this.pointInRect(x2, y2, r)) return true;

    const left = r.x;
    const right = r.x + r.w;
    const top = r.y;
    const bottom = r.y + r.h;

    return this.segmentsIntersect(x1, y1, x2, y2, left, top, right, top) ||
           this.segmentsIntersect(x1, y1, x2, y2, right, top, right, bottom) ||
           this.segmentsIntersect(x1, y1, x2, y2, right, bottom, left, bottom) ||
           this.segmentsIntersect(x1, y1, x2, y2, left, bottom, left, top);
  },
};
