import React from "react";

export const CardSkeleton: React.FC = () => {
  return (
    <div className="luxury-card overflow-hidden h-[380px] animate-pulse flex flex-col justify-between">
      <div className="aspect-square bg-muted-light dark:bg-muted-light/10"></div>
      <div className="p-4 flex flex-col gap-3 flex-grow">
        <div className="h-2.5 bg-muted-light dark:bg-muted-light/10 w-1/4 rounded"></div>
        <div className="h-3.5 bg-muted-light dark:bg-muted-light/10 w-3/4 rounded"></div>
        <div className="flex justify-between items-center mt-auto pt-2">
          <div className="h-4 bg-muted-light dark:bg-muted-light/10 w-1/3 rounded"></div>
          <div className="h-3 bg-muted-light dark:bg-muted-light/10 w-10 rounded"></div>
        </div>
      </div>
    </div>
  );
};

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="w-full flex flex-col gap-4 animate-pulse">
      <div className="h-8 bg-muted-light dark:bg-muted-light/10 rounded w-full"></div>
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex gap-4 items-center justify-between py-3 border-b border-card-border">
          <div className="h-4 bg-muted-light dark:bg-muted-light/10 rounded w-1/3"></div>
          <div className="h-4 bg-muted-light dark:bg-muted-light/10 rounded w-10"></div>
          <div className="h-4 bg-muted-light dark:bg-muted-light/10 rounded w-20"></div>
        </div>
      ))}
    </div>
  );
};

export const StatSkeleton: React.FC = () => {
  return (
    <div className="luxury-card p-5 flex items-center gap-4 animate-pulse w-full">
      <div className="rounded-full bg-muted-light dark:bg-muted-light/10 h-12 w-12 shrink-0"></div>
      <div className="flex-grow flex flex-col gap-2">
        <div className="h-2.5 bg-muted-light dark:bg-muted-light/10 w-1/2 rounded"></div>
        <div className="h-5 bg-muted-light dark:bg-muted-light/10 w-3/4 rounded"></div>
      </div>
    </div>
  );
};

export const DetailSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 animate-pulse py-6">
      <div className="aspect-square bg-muted-light dark:bg-muted-light/10 rounded-lg"></div>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <div className="h-3 bg-muted-light dark:bg-muted-light/10 w-1/4 rounded"></div>
          <div className="h-8 bg-muted-light dark:bg-muted-light/10 w-3/4 rounded"></div>
          <div className="h-4 bg-muted-light dark:bg-muted-light/10 w-1/3 rounded mt-2"></div>
        </div>
        <div className="h-20 bg-muted-light dark:bg-muted-light/10 w-full rounded mt-4"></div>
        <div className="h-12 bg-muted-light dark:bg-muted-light/10 w-1/2 rounded mt-6"></div>
      </div>
    </div>
  );
};

export const FormSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col gap-6 animate-pulse w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="flex flex-col gap-2">
          <div className="h-3 bg-muted-light dark:bg-muted-light/10 w-1/4 rounded"></div>
          <div className="h-10 bg-muted-light dark:bg-muted-light/10 rounded"></div>
        </div>
        <div className="flex flex-col gap-2">
          <div className="h-3 bg-muted-light dark:bg-muted-light/10 w-1/4 rounded"></div>
          <div className="h-10 bg-muted-light dark:bg-muted-light/10 rounded"></div>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <div className="h-3 bg-muted-light dark:bg-muted-light/10 w-1/4 rounded"></div>
        <div className="h-28 bg-muted-light dark:bg-muted-light/10 rounded"></div>
      </div>
    </div>
  );
};
