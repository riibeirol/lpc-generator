// Filters Panel - combines Search, CurrentSelections, and CategoryTree
import { SearchControl } from "./filters/SearchControl.js";
import { CurrentSelections } from "./selections/CurrentSelections.js";
import { CategoryTree } from "./tree/CategoryTree.js";
import { CollapsibleSection } from "./CollapsibleSection.js";

export const FiltersPanel = {
  view: function () {
    return m(
      CollapsibleSection,
      {
        title: "Filters",
        storageKey: "filters",
        defaultOpen: true,
      },
      [
        m("div.mb-4", m(SearchControl)),
        m("div.mb-4", m(CurrentSelections)),
        m(CategoryTree),
      ],
    );
  },
};
