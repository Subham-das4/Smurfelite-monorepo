"use client";

import { useState } from "react";

type TabId = "description" | "specifications";

const TABS: { id: TabId; label: string }[] = [
  { id: "description", label: "Description" },
  { id: "specifications", label: "Specifications" },
];

interface SpecEntry {
  key: string;
  value: string;
}

interface ProductTabsProps {
  description: string | null;
  specs: SpecEntry[];
}

export function ProductTabs({ description, specs }: ProductTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("description");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex border-b border-slate-200" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`tabpanel-${tab.id}`}
            className={`px-6 py-3 font-medium text-sm transition-colors ${
              activeTab === tab.id
                ? "text-primary border-b-2 border-primary font-bold"
                : "text-slate-500 hover:text-slate-900"
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div
        id="tabpanel-description"
        role="tabpanel"
        hidden={activeTab !== "description"}
        className="text-slate-600 leading-relaxed space-y-4"
      >
        {description ? (
          description.split("\n\n").map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))
        ) : (
          <p className="text-slate-400 italic">No description available.</p>
        )}
      </div>

      <div
        id="tabpanel-specifications"
        role="tabpanel"
        hidden={activeTab !== "specifications"}
      >
        {specs.length > 0 ? (
          <table className="w-full text-sm border-collapse">
            <tbody>
              {specs.map((spec, index) => (
                <tr
                  key={spec.key}
                  className={index % 2 === 0 ? "bg-slate-50" : "bg-white"}
                >
                  <td className="px-4 py-3 font-semibold text-slate-700 w-2/5 border border-slate-200">
                    {spec.key}
                  </td>
                  <td className="px-4 py-3 text-slate-600 border border-slate-200">
                    {spec.value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-slate-400 italic text-sm">No specifications available.</p>
        )}
      </div>
    </div>
  );
}
