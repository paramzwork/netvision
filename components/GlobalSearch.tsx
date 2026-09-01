"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Search, Server, LayoutDashboard, BarChart, X } from "lucide-react";
import { useRouter } from "next/navigation";

import { useData } from "@/context/DataContext";
import { tripleEncode } from "@/lib/utils"; // adjust path
import { menuItems } from "./SideBarComponent";

type SearchItem = {
  id: string | number;
  title: string;
  description?: string;
  type: "menu" | "device" | "submenu";
  url: string;
};

function getIcon(type: SearchItem["type"]) {
  switch (type) {
    case "device":
      return <Server className="h-4 w-4" />;

    case "submenu":
      return <BarChart className="h-4 w-4" />;

    case "menu":
      return <LayoutDashboard className="h-4 w-4" />;

    default:
      return <Search className="h-4 w-4" />;
  }
}

export default function GlobalSearch() {
  const router = useRouter();

  const { activeDevices, currentUser } = useData();

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  /*
   * Generate search items from menuItems
   * and activeDevices.
   */
  const menuSearchData: SearchItem[] = menuItems.flatMap((item, index) => {
    const results: SearchItem[] = [];

    /*
     * Normal menu item
     */
    if (
      item.href &&
      item.roles?.includes(currentUser.roles.role.toLowerCase())
    ) {
      results.push({
        id: `menu-${index}`,
        title: item.name,
        type: "menu",
        url: item.href,
      });
    }

    /*
     * Dynamic devices
     *
     * Your sidebar uses:
     *
     * /devices/{tripleEncodedIp}
     */
    if (
      item.dynamicDevices &&
      item.roles?.includes(currentUser.roles.role.toLowerCase())
    ) {
      /*
       * Add the Devices parent menu
       * only when devices are available.
       */
      if (activeDevices.length > 0) {
        results.push({
          id: `dynamic-${index}`,
          title: item.name,
          description: `${activeDevices.length} active ${
            activeDevices.length === 1 ? "device" : "devices"
          }`,
          type: "menu",
          url: "/devices",
        });
      }

      /*
       * Add each active device
       */
      activeDevices.forEach((device) => {
        const ipAdd = tripleEncode(device.ipAddress);

        results.push({
          id: `device-${device.id}`,
          title: device.sysName,
          description: device.ipAddress,
          type: "device",
          url: `/devices/${ipAdd}`,
        });
      });
    }

    /*
     * Submenus
     */
    item.subMenu?.forEach((subItem, subIndex) => {
      if (
        !subItem.href ||
        !subItem.roles?.includes(currentUser.roles.role.toLowerCase())
      ) {
        return;
      }

      results.push({
        id: `submenu-${index}-${subIndex}`,
        title: subItem.name,
        description: item.name,
        type: "submenu",
        url: subItem.href,
      });
    });

    return results;
  });

  /*
   * Search
   *
   * IMPORTANT:
   * Use menuSearchData, NOT searchData.
   */
  const results =
    query.length > 0
      ? menuSearchData.filter((item) => {
          const matchesSearch =
            item.title.toLowerCase().includes(query) ||
            item.description?.toLowerCase().includes(query);

          const isDeviceSearch =
            item.type === "device" && "device".includes(query);

          return matchesSearch || isDeviceSearch;
        })
      : [];
  const suggestionItems = menuSearchData
    .filter((item) => item.type === "menu" || item.type === "submenu")
    .slice(0, 6);

  const displayItems = query.trim() ? results : suggestionItems;
  const handleSelect = useCallback(
    (item: SearchItem) => {
      setOpen(false);
      setQuery("");
      setSelectedIndex(0);

      router.push(item.url);
    },
    [router],
  );
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();

      if (displayItems.length === 0) {
        return;
      }

      setSelectedIndex((current) =>
        current < displayItems.length - 1 ? current + 1 : 0,
      );

      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();

      if (displayItems.length === 0) {
        return;
      }

      setSelectedIndex((current) =>
        current > 0 ? current - 1 : displayItems.length - 1,
      );

      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();

      const selected = displayItems[selectedIndex];

      if (selected) {
        handleSelect(selected);
      }

      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();

      setOpen(false);
      setQuery("");
      setSelectedIndex(0);

      inputRef.current?.blur();
    }
  };
  useEffect(() => {
    const handleGlobalKeyboard = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();

        setOpen(true);

        requestAnimationFrame(() => {
          inputRef.current?.focus();
        });
      }
    };

    document.addEventListener("keydown", handleGlobalKeyboard);

    return () => {
      document.removeEventListener("keydown", handleGlobalKeyboard);
    };
  }, []);
  return (
    <div ref={searchRef} className="relative w-64">
      {/* Search icon */}
      <Search
        className="
      pointer-events-none
      absolute
      left-3
      top-1/2
      h-4
      w-4
      -translate-y-1/2
      text-gray-400
    "
      />

      {/* Input */}
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setSelectedIndex(0);
          setOpen(true);
        }}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          setSelectedIndex(0);
          setOpen(true);
        }}
        placeholder="Search..."
        className="w-full rounded-sm border border-gray-200 bg-gray-50 py-2 pl-10 pr-10 text-sm text-gray-900 outline-none focus:border-transparent focus:ring-2 focus:ring-primary-500"
      />

      {/* Clear */}
      {query && (
        <button
          type="button"
          onClick={() => {
            setQuery("");
            setSelectedIndex(0);
            setOpen(true);
            inputRef.current?.focus();
          }}
          className="
        absolute
        right-3
        top-1/2
        -translate-y-1/2
        text-gray-400
        hover:text-gray-700
      "
        >
          <X className="h-4 w-4" />
        </button>
      )}

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-105 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl">
          {/* Empty search = suggestions */}
          {!query.trim() ? (
            <div className="py-2">
              <div className="px-4 pb-2 pt-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                Suggestions
              </div>

              {displayItems.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <Search className="mx-auto mb-2 h-6 w-6 text-gray-300" />

                  <p className="text-sm font-medium text-gray-700">
                    No suggestions
                  </p>
                </div>
              ) : (
                displayItems.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors
                  ${
                    selectedIndex === index
                      ? "bg-gray-100"
                      : "hover:bg-gray-100"
                  } `}
                  >
                    {/* Icon */}
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-500">
                      {getIcon(item.type)}
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-800">
                        {item.title}
                      </p>

                      {item.description && (
                        <p className="truncate text-xs text-gray-400">
                          {item.description}
                        </p>
                      )}
                    </div>

                    {/* Keyboard indicator */}
                    {selectedIndex === index && (
                      <span className="text-xs text-gray-400">Enter ↵</span>
                    )}
                  </button>
                ))
              )}
            </div>
          ) : (
            /* Search results */
            <div className="py-2">
              <div className="px-4pb-2 pt-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                Search Results
              </div>

              {displayItems.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <Search className="mx-auto mb-2 h-6 w-6 text-gray-300" />

                  <p className="text-sm font-medium text-gray-700">
                    No results found
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    Try searching for a device or menu.
                  </p>
                </div>
              ) : (
                <div className="max-h-105 overflow-y-auto">
                  {displayItems.map((item, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors
                    ${
                      selectedIndex === index
                        ? "bg-gray-100"
                        : "hover:bg-gray-100"
                    }
                  `}
                    >
                      {/* Icon */}
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-500">
                        {getIcon(item.type)}
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-800">
                          {item.title}
                        </p>

                        {item.description && (
                          <p className="truncate text-xs text-gray-400">
                            {item.description}
                          </p>
                        )}
                      </div>

                      {/* Keyboard indicator */}
                      {selectedIndex === index && (
                        <span className="text-xs text-gray-400">Enter ↵</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-4 py-2 text-[11px] text-gray-400">
            <span>Search NetVision</span>

            <span className="flex items-center gap-2">
              <span>↑↓ Navigate</span>
              <span>↵ Select</span>
              <span>Esc Close</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
