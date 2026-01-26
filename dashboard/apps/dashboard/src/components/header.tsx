"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export function Header() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  // Handle keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSelect = useCallback(
    (path: string) => {
      setOpen(false);
      router.push(path);
    },
    [router],
  );

  return (
    <header className="z-50 h-[50px] flex items-center justify-between px-4 border-b border-[#e5e5e5] dark:border-[#1a1a1a] bg-white dark:bg-[#0a0a0a] sticky top-0">
      {/* Search Trigger */}
      {/*<button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "flex items-center gap-2 h-8 px-3 rounded-md text-xs",
          "bg-[#fafafa] dark:bg-[#1a1a1a] border border-[#e5e5e5] dark:border-[#2a2a2a]",
          "text-[#878787] hover:text-black dark:hover:text-white",
          "transition-colors cursor-pointer",
        )}
      >
        <Search size={14} />
        <span className="hidden sm:inline">Find anything...</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 ml-2 text-[10px] font-medium bg-white dark:bg-[#0a0a0a] border border-[#e5e5e5] dark:border-[#2a2a2a] rounded">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>*/}

      {/* Right side placeholder for future actions */}
      <div className="flex items-center gap-2">
        {/* Future: notifications, settings, etc */}
      </div>

      {/* Command Dialog */}
      {/*<CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type to search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Navigation">
            {navigationItems.map((item) => (
              <CommandItem
                key={item.path}
                value={item.name}
                onSelect={() => handleSelect(item.path)}
                className="cursor-pointer"
              >
                <item.icon size={16} className="mr-2 text-[#878787]" />
                <span>{item.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>*/}
    </header>
  );
}
