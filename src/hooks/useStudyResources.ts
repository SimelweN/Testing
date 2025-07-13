import { useState, useMemo } from "react";
import { StudyTip, StudyResource } from "@/types/university";

interface UseStudyResourcesProps {
  tips: StudyTip[];
  resources: StudyResource[];
}

export const useStudyResources = ({
  tips,
  resources,
}: UseStudyResourcesProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [bookmarkedTips, setBookmarkedTips] = useState<Set<string>>(new Set());

  // Get unique categories from both tips and resources
  const categories = useMemo(() => {
    const tipCategories = tips.map((tip) => tip.category);
    const resourceCategories = resources.map((resource) => resource.category);
    return Array.from(
      new Set([...tipCategories, ...resourceCategories]),
    ).sort();
  }, [tips, resources]);

  // Filter tips based on search and filters
  const filteredTips = useMemo(() => {
    return tips.filter((tip) => {
      const matchesSearch =
        !searchTerm ||
        tip.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tip.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tip.tags?.some((tag) =>
          tag.toLowerCase().includes(searchTerm.toLowerCase()),
        );

      const matchesCategory =
        selectedCategory === "all" || tip.category === selectedCategory;
      const matchesDifficulty =
        selectedDifficulty === "all" || tip.difficulty === selectedDifficulty;

      return matchesSearch && matchesCategory && matchesDifficulty;
    });
  }, [tips, searchTerm, selectedCategory, selectedDifficulty]);

  // Filter resources based on search and filters
  const filteredResources = useMemo(() => {
    return resources.filter((resource) => {
      const matchesSearch =
        !searchTerm ||
        resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resource.tags?.some((tag) =>
          tag.toLowerCase().includes(searchTerm.toLowerCase()),
        );

      const matchesCategory =
        selectedCategory === "all" || resource.category === selectedCategory;
      const matchesDifficulty =
        selectedDifficulty === "all" ||
        resource.difficulty === selectedDifficulty;
      const matchesType =
        selectedType === "all" || resource.type === selectedType;

      return (
        matchesSearch && matchesCategory && matchesDifficulty && matchesType
      );
    });
  }, [
    resources,
    searchTerm,
    selectedCategory,
    selectedDifficulty,
    selectedType,
  ]);

  const toggleBookmark = (tipId: string) => {
    setBookmarkedTips((prev) => {
      const newBookmarks = new Set(prev);
      if (newBookmarks.has(tipId)) {
        newBookmarks.delete(tipId);
      } else {
        newBookmarks.add(tipId);
      }
      return newBookmarks;
    });
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setSelectedDifficulty("all");
    setSelectedType("all");
  };

  const hasActiveFilters = !!(
    searchTerm ||
    (selectedCategory && selectedCategory !== "all") ||
    (selectedDifficulty && selectedDifficulty !== "all") ||
    (selectedType && selectedType !== "all")
  );

  return {
    // State
    searchTerm,
    selectedCategory,
    selectedDifficulty,
    selectedType,
    bookmarkedTips,

    // Derived data
    categories,
    filteredTips,
    filteredResources,
    hasActiveFilters,

    // Actions
    setSearchTerm,
    setSelectedCategory,
    setSelectedDifficulty,
    setSelectedType,
    toggleBookmark,
    clearFilters,
  };
};
