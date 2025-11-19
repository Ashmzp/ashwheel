import React from 'react';

/**
 * Loading skeleton components for better UX
 * Fixes HIGH severity issue #31
 */

export const TableSkeleton = ({ rows = 5, columns = 5 }) => (
  <div className="space-y-2">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex gap-4">
        {Array.from({ length: columns }).map((_, j) => (
          <div key={j} className="h-10 bg-secondary animate-pulse rounded flex-1" />
        ))}
      </div>
    ))}
  </div>
);

export const CardSkeleton = () => (
  <div className="border rounded-lg p-6 space-y-4">
    <div className="h-6 bg-secondary animate-pulse rounded w-1/3" />
    <div className="h-4 bg-secondary animate-pulse rounded w-2/3" />
    <div className="h-20 bg-secondary animate-pulse rounded" />
  </div>
);

export const FormSkeleton = () => (
  <div className="space-y-4">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="space-y-2">
        <div className="h-4 bg-secondary animate-pulse rounded w-1/4" />
        <div className="h-10 bg-secondary animate-pulse rounded" />
      </div>
    ))}
  </div>
);

export const ListSkeleton = ({ items = 5 }) => (
  <div className="space-y-2">
    {Array.from({ length: items }).map((_, i) => (
      <div key={i} className="h-16 bg-secondary animate-pulse rounded" />
    ))}
  </div>
);

export default { TableSkeleton, CardSkeleton, FormSkeleton, ListSkeleton };
