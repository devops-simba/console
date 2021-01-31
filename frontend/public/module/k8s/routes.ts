import { RouteKind } from './types';

export const routeRouter = (route: RouteKind): string => {
  const labels = route.metadata?.labels || {};
  return labels.router;
};
