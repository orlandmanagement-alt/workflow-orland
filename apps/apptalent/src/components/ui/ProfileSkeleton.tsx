import React from 'react';

export function ProfileSkeleton() {
  return (
    <div className="max-w-[1100px] mx-auto pb-28 pt-6 relative animate-pulse">
      
      {/* Header Skeleton */}
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center p-6 border border-slate-100 dark:border-slate-800 rounded-[14px]">
          <div>
              <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg mb-2"></div>
              <div className="h-4 w-24 bg-slate-100 dark:bg-slate-900 rounded-md"></div>
          </div>
          <div className="h-10 w-32 bg-slate-200 dark:bg-slate-800 rounded-xl mt-4 md:mt-0"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 items-start">
        
        {/* Sidebar Skeleton */}
        <aside className="bg-white dark:bg-dark-card border border-slate-100 dark:border-slate-800 rounded-[14px] p-4 shadow-sm">
           <div className="w-full aspect-[4/5] bg-slate-100 dark:bg-slate-800 rounded-[14px] mb-4"></div>
           <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="w-full aspect-[4/3] bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
              <div className="w-full aspect-[4/3] bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
           </div>
           <div className="h-4 w-1/2 bg-slate-100 dark:bg-slate-800 rounded mb-2"></div>
           <div className="h-10 w-full bg-slate-100 dark:bg-slate-800 rounded-xl mb-4"></div>
        </aside>

        {/* Main Content Skeleton */}
        <main className="bg-white dark:bg-dark-card border border-slate-100 dark:border-slate-800 rounded-[14px] shadow-sm p-4 md:p-5">
           {/* Tabs Skeleton */}
           <div className="flex gap-5 border-b border-slate-100 dark:border-slate-800 pb-3 mb-6">
              <div className="h-5 w-16 bg-slate-200 dark:bg-slate-800 rounded"></div>
              <div className="h-5 w-16 bg-slate-100 dark:bg-slate-900 rounded"></div>
              <div className="h-5 w-24 bg-slate-100 dark:bg-slate-900 rounded"></div>
           </div>

           {/* Content Box 1 */}
           <div className="h-40 w-full bg-slate-50 dark:bg-slate-900 rounded-2xl mb-4"></div>
           
           {/* Content Grid */}
           <div className="grid grid-cols-2 gap-4">
               <div className="h-20 bg-slate-50 dark:bg-slate-900 rounded-xl"></div>
               <div className="h-20 bg-slate-50 dark:bg-slate-900 rounded-xl"></div>
               <div className="h-20 bg-slate-50 dark:bg-slate-900 rounded-xl"></div>
               <div className="h-20 bg-slate-50 dark:bg-slate-900 rounded-xl"></div>
           </div>
        </main>
      </div>
    </div>
  );
}
