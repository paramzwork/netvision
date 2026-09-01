"use client";

import { Bell, MessageSquare } from "lucide-react";
import GlobalSearch from "./GlobalSearch";

export default function HeaderComponent() {
  return (
    <header className="w-full flex items-center justify-between bg-[#3b3b3b] border-b border-gray-500 px-8 py-3 font-lexend">
      {/* LEFT SIDE */}
      <div className="w-full flex items-center gap-4">
        {/* Search */}
      <GlobalSearch />

        {/* Notifications */}
        <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">
          <Bell className="w-5 h-5 text-white" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* Messages */}
        <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <MessageSquare className="w-5 h-5 text-white" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-primary-500 rounded-full"></span>
        </button>
      </div>
      <div className="w-full text-sm text-end text-white">
        {new Date().toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </div>
    </header>
  );
}
