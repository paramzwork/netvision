import { TopologyTypes } from "@/app/(pages)/weathermap/page";
import { create } from "zustand";

interface TopologyStore {
  topologies: TopologyTypes[];
  setTopologies: React.Dispatch<React.SetStateAction<TopologyTypes[]>>;
  selectedTopology: TopologyTypes | null;
  setSelectedTopology: (user: TopologyTypes | null) => void;
}
export const useTopologyStore = create<TopologyStore>((set) => ({
  topologies: [],
  setTopologies: (value) =>
    set((state) => ({
      topologies: typeof value === "function" ? value(state.topologies) : value,
    })),

  selectedTopology: null,
  setSelectedTopology: (user) =>
    set({
      selectedTopology: user,
    }),
}));
