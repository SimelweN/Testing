import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Lightbulb,
  BookOpen,
  TrendingUp,
  Target,
  Clock,
  Users,
  Star,
  RefreshCw,
} from "lucide-react";

import StudyTipCard from "./StudyTipCard";
import StudyResourceCard from "./StudyResourceCard";
import StudyFilters from "./StudyFilters";
import { useStudyResources } from "@/hooks/useStudyResources";
import { STUDY_TIPS, STUDY_RESOURCES } from "@/constants/studyResources";
import { getAllStudyContent } from "@/services/admin/studyResourcesService";
import { StudyTip, StudyResource } from "@/types/university";
import LoadingSpinner from "@/components/LoadingSpinner";

const StudyResourcesPage = () => {
  const [allTips, setAllTips] = useState<StudyTip[]>(STUDY_TIPS);
  const [allResources, setAllResources] =
    useState<StudyResource[]>(STUDY_RESOURCES);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch admin-added content
  useEffect(() => {
    const fetchStudyContent = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get admin-added content from database
        const { tips: adminTips, resources: adminResources } =
          await getAllStudyContent();

        console.log("Fetched admin content:", {
          tipsCount: adminTips.length,
          resourcesCount: adminResources.length,
        });

        // Combine static content with admin-added content
        const combinedTips = [...STUDY_TIPS, ...adminTips];
        const combinedResources = [...STUDY_RESOURCES, ...adminResources];

        setAllTips(combinedTips);
        setAllResources(combinedResources);

        if (adminTips.length === 0 && adminResources.length === 0) {
          console.log("No admin content found, using static content only");
        } else {
          console.log(
            `Loaded ${adminTips.length} admin tips and ${adminResources.length} admin resources`,
          );
        }
      } catch (err) {
        console.error("Error fetching study content:", {
          message: err instanceof Error ? err.message : String(err),
          type: err instanceof Error ? err.constructor.name : typeof err,
        });

        // Determine appropriate error message based on error type
        let errorMessage =
          "Failed to load admin content. Showing default study content.";

        if (err instanceof Error) {
          if (err.message.includes("table") || err.message.includes("42P01")) {
            errorMessage =
              "Study resources database tables not found. Please contact admin to set up the database.";
          } else if (err.message.includes("migrations")) {
            errorMessage =
              "Database setup required. Please contact admin to run migrations.";
          }
        }

        setError(errorMessage);

        // Keep static content if database fetch fails
        setAllTips([...STUDY_TIPS]);
        setAllResources([...STUDY_RESOURCES]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudyContent();
  }, []);

  const {
    searchTerm,
    selectedCategory,
    selectedDifficulty,
    selectedType,
    bookmarkedTips,
    categories,
    filteredTips,
    filteredResources,
    hasActiveFilters,
    setSearchTerm,
    setSelectedCategory,
    setSelectedDifficulty,
    setSelectedType,
    toggleBookmark,
    clearFilters,
  } = useStudyResources({ tips: allTips, resources: allResources });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-4 sm:py-8">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <LoadingSpinner text="Loading study resources..." />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-4 sm:py-8">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center">
              <RefreshCw className="h-5 w-5 text-orange-600 mr-2" />
              <p className="text-orange-800">{error}</p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <Lightbulb className="h-8 w-8 sm:h-10 sm:w-10 text-blue-600" />
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4 px-2">
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Study Resources & Tips
            </span>
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto px-2">
            Evidence-based study techniques and curated resources to help you
            excel in your academic journey.
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <div className="bg-white p-4 sm:p-6 rounded-lg border shadow-sm text-center">
            <Target className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 mx-auto mb-2" />
            <div className="text-xl sm:text-2xl font-bold text-gray-900">
              {STUDY_TIPS.length}
            </div>
            <div className="text-xs sm:text-sm text-gray-600">Study Tips</div>
          </div>
          <div className="bg-white p-4 sm:p-6 rounded-lg border shadow-sm text-center">
            <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 mx-auto mb-2" />
            <div className="text-xl sm:text-2xl font-bold text-gray-900">
              {STUDY_RESOURCES.length}
            </div>
            <div className="text-xs sm:text-sm text-gray-600">Resources</div>
          </div>
          <div className="bg-white p-4 sm:p-6 rounded-lg border shadow-sm text-center">
            <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600 mx-auto mb-2" />
            <div className="text-xl sm:text-2xl font-bold text-gray-900">
              24/7
            </div>
            <div className="text-xs sm:text-sm text-gray-600">Access</div>
          </div>
          <div className="bg-white p-4 sm:p-6 rounded-lg border shadow-sm text-center">
            <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 mx-auto mb-2" />
            <div className="text-xl sm:text-2xl font-bold text-gray-900">
              90%+
            </div>
            <div className="text-xs sm:text-sm text-gray-600">Success Rate</div>
          </div>
        </div>

        {/* Filters */}
        <StudyFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          selectedDifficulty={selectedDifficulty}
          onDifficultyChange={setSelectedDifficulty}
          selectedType={selectedType}
          onTypeChange={setSelectedType}
          onClearFilters={clearFilters}
          categories={categories}
          hasActiveFilters={hasActiveFilters}
        />

        {/* Main Content */}
        <Tabs defaultValue="tips" className="mt-6 sm:mt-8">
          <TabsList className="grid w-full grid-cols-2 mb-6 sm:mb-8 h-12">
            <TabsTrigger
              value="tips"
              className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
            >
              <Lightbulb className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">Study </span>Tips (
              {filteredTips.length})
            </TabsTrigger>
            <TabsTrigger
              value="resources"
              className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
            >
              <BookOpen className="w-3 h-3 sm:w-4 sm:h-4" />
              Resources ({filteredResources.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tips">
            {filteredTips.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <Lightbulb className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-base sm:text-lg font-semibold text-gray-600 mb-2">
                  No tips found
                </h3>
                <p className="text-sm sm:text-base text-gray-500 px-4">
                  Try adjusting your filters or search terms.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {filteredTips.map((tip) => (
                  <StudyTipCard
                    key={tip.id}
                    tip={tip}
                    isBookmarked={bookmarkedTips.has(tip.id)}
                    onBookmark={toggleBookmark}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="resources">
            {filteredResources.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <BookOpen className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-base sm:text-lg font-semibold text-gray-600 mb-2">
                  No resources found
                </h3>
                <p className="text-sm sm:text-base text-gray-500 px-4">
                  Try adjusting your filters or search terms.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {filteredResources.map((resource) => (
                  <StudyResourceCard key={resource.id} resource={resource} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Quick Tips Section */}
        <div className="mt-12 sm:mt-16 bg-white rounded-lg border shadow-sm p-4 sm:p-6 lg:p-8">
          <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-center">
            Quick Study Tips
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            <div className="text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2 text-sm sm:text-base">
                Use the Pomodoro Technique
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                Study for 25 minutes, then take a 5-minute break. Repeat 4
                times, then take a longer break.
              </p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Target className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2 text-sm sm:text-base">
                Practice Active Recall
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                Test yourself regularly instead of just re-reading notes. This
                strengthens memory pathways.
              </p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2 text-sm sm:text-base">
                Space Out Your Learning
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                Review material at increasing intervals: 1 day, 3 days, 1 week,
                2 weeks, 1 month.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudyResourcesPage;
