export interface OdometerTimelineBounds {
  previousMax: number | null;
  nextMin: number | null;
}

export type OdometerTimelineIssue = { kind: 'belowPrevious'; boundaryKm: number } | { kind: 'aboveNext'; boundaryKm: number };

export function validateOdometerInTimeline(odometerKm: number, bounds: OdometerTimelineBounds): OdometerTimelineIssue | null {
  if (bounds.previousMax !== null && odometerKm < bounds.previousMax) {
    return { kind: 'belowPrevious', boundaryKm: bounds.previousMax };
  }
  if (bounds.nextMin !== null && odometerKm > bounds.nextMin) {
    return { kind: 'aboveNext', boundaryKm: bounds.nextMin };
  }
  return null;
}
