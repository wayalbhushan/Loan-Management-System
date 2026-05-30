import React from 'react';

export default function TableSkeleton() {
  return (
    <div className="border border-zinc-200 bg-white p-4 shadow-sm animate-pulse space-y-4">
      {/* Header bar skeleton */}
      <div className="flex justify-between items-center border-b border-zinc-100 pb-3">
        <div className="h-4 bg-zinc-200 w-1/4 rounded"></div>
        <div className="h-7 bg-zinc-200 w-16 rounded"></div>
      </div>
      
      {/* Table grid layout skeleton */}
      <div className="space-y-3">
        {/* Columns header */}
        <div className="grid grid-cols-4 gap-4 py-2 border-b border-zinc-200">
          <div className="h-3 bg-zinc-200 w-2/3 rounded"></div>
          <div className="h-3 bg-zinc-200 w-1/2 rounded"></div>
          <div className="h-3 bg-zinc-200 w-3/4 rounded"></div>
          <div className="h-3 bg-zinc-200 w-1/3 rounded"></div>
        </div>
        
        {/* Five placeholder rows */}
        {[...Array(5)].map((_, i) => (
          <div key={i} className="grid grid-cols-4 gap-4 py-3.5 border-b border-zinc-100 last:border-b-0">
            <div className="space-y-2">
              <div className="h-3.5 bg-zinc-200 w-4/5 rounded"></div>
              <div className="h-2.5 bg-zinc-200 w-1/2 rounded"></div>
            </div>
            <div className="h-3.5 bg-zinc-200 w-2/3 rounded self-center"></div>
            <div className="h-3.5 bg-zinc-200 w-3/4 rounded self-center"></div>
            <div className="h-6 bg-zinc-200 w-16 rounded justify-self-end self-center"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
