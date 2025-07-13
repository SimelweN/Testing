import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  createStudyResource,
  createStudyTip,
  getStudyResources,
  getStudyTips,
} from "@/services/admin/studyResourcesService";
import {
  Lightbulb,
  BookOpen,
  Plus,
  Save,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

interface AdminResourcesTabProps {
  className?: string;
}

const AdminResourcesTab = ({ className }: AdminResourcesTabProps) => {
  const [activeTab, setActiveTab] = useState<"resources" | "tips">("resources");
  const [isCreating, setIsCreating] = useState(false);
  const [existingResources, setExistingResources] = useState([]);
  const [existingTips, setExistingTips] = useState([]);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "pdf",
    category: "",
    difficulty: "Beginner",
    url: "",
    provider: "",
    tags: "",
    content: "",
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      type: "pdf",
      category: "",
      difficulty: "Beginner",
      url: "",
      provider: "",
      tags: "",
      content: "",
    });
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateItem = async () => {
    if (!formData.title?.trim()) {
      toast.error("Title is required");
      return;
    }

    if (!formData.description?.trim()) {
      toast.error("Description is required");
      return;
    }

    if (!formData.category?.trim()) {
      toast.error("Category is required");
      return;
    }

    setIsCreating(true);
    try {
      if (activeTab === "resources") {
        await createStudyResource({
          title: formData.title,
          description: formData.description,
          type: formData.type as
            | "pdf"
            | "video"
            | "website"
            | "tool"
            | "course",
          category: formData.category,
          difficulty: formData.difficulty as
            | "Beginner"
            | "Intermediate"
            | "Advanced",
          url: formData.url || undefined,
          provider: formData.provider || undefined,
          tags: formData.tags
            ? formData.tags.split(",").map((tag) => tag.trim())
            : [],
        });
        toast.success("Study resource created successfully!");
      } else {
        if (!formData.content?.trim()) {
          toast.error("Content is required for study tips");
          return;
        }

        await createStudyTip({
          title: formData.title,
          description: formData.description,
          content: formData.content,
          category: formData.category,
          difficulty: formData.difficulty as
            | "Beginner"
            | "Intermediate"
            | "Advanced",
          tags: formData.tags
            ? formData.tags.split(",").map((tag) => tag.trim())
            : [],
        });
        toast.success("Study tip created successfully!");
      }

      resetForm();
      loadExistingItems();
    } catch (error) {
      console.error(
        `Error creating ${activeTab}:`,
        error instanceof Error ? error.message : String(error),
      );

      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";

      // Provide specific guidance for migration issues
      if (
        errorMessage.includes("database table is not available") ||
        errorMessage.includes("migrations")
      ) {
        toast.error(
          "Database setup required. The study resources feature needs to be configured by an administrator.",
          { duration: 6000 },
        );
      } else {
        toast.error(`Failed to create ${activeTab}: ${errorMessage}`);
      }
    } finally {
      setIsCreating(false);
    }
  };

  const loadExistingItems = async () => {
    try {
      // Add diagnostic check if needed
      if (import.meta.env.DEV) {
        console.log("Loading study resources and tips...");
      }

      const [resources, tips] = await Promise.all([
        getStudyResources(),
        getStudyTips(),
      ]);
      setExistingResources(resources);
      setExistingTips(tips);

      if (import.meta.env.DEV) {
        console.log(
          `Loaded ${resources.length} resources and ${tips.length} tips`,
        );
      }
    } catch (error) {
      console.error(
        "Error loading existing items:",
        error instanceof Error ? error.message : String(error),
      );

      // If the error suggests missing columns, provide helpful info
      if (error instanceof Error && error.message.includes("42703")) {
        console.error(
          "Column mismatch detected. Expected columns for study_resources:",
          [
            "id",
            "title",
            "description",
            "type",
            "category",
            "difficulty",
            "url",
            "rating",
            "provider",
            "duration",
            "tags",
            "download_url",
            "is_active",
            "is_featured",
            "is_sponsored",
            "sponsor_name",
            "sponsor_logo",
            "sponsor_url",
            "sponsor_cta",
            "created_at",
            "updated_at",
          ],
        );
      }
    }
  };

  useEffect(() => {
    loadExistingItems();
  }, []);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Database Status Warning */}
      {existingResources.length === 0 && existingTips.length === 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-800 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Database Setup Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-yellow-700 text-sm mb-3">
              The study resources and tips feature requires database tables that
              may not be available yet. If you're experiencing errors, please
              check the Database Status in the Utilities tab and run the
              database initialization if needed.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => (window.location.hash = "#utilities")}
              className="text-yellow-700 border-yellow-300 hover:bg-yellow-100"
            >
              Go to Database Utilities
            </Button>
          </CardContent>
        </Card>
      )}
      {/* Tab Selector */}
      <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg">
        <Button
          variant={activeTab === "resources" ? "default" : "ghost"}
          onClick={() => setActiveTab("resources")}
          className="flex-1"
        >
          <BookOpen className="h-4 w-4 mr-2" />
          Study Resources
        </Button>
        <Button
          variant={activeTab === "tips" ? "default" : "ghost"}
          onClick={() => setActiveTab("tips")}
          className="flex-1"
        >
          <Lightbulb className="h-4 w-4 mr-2" />
          Study Tips
        </Button>
      </div>

      {/* Create New Item Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {activeTab === "resources" ? (
              <BookOpen className="h-5 w-5" />
            ) : (
              <Lightbulb className="h-5 w-5" />
            )}
            Create New {activeTab === "resources" ? "Resource" : "Tip"}
          </CardTitle>
          <CardDescription>
            Add a new study {activeTab === "resources" ? "resource" : "tip"} for
            students.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                name="title"
                placeholder="Enter title"
                value={formData.title}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Input
                id="category"
                name="category"
                placeholder="e.g., Mathematics, Science, English"
                value={formData.category}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Enter description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              required
            />
          </div>

          {activeTab === "tips" && (
            <div className="space-y-2">
              <Label htmlFor="content">Content *</Label>
              <Textarea
                id="content"
                name="content"
                placeholder="Enter the study tip content"
                value={formData.content}
                onChange={handleInputChange}
                rows={4}
                required
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty</Label>
              <Select
                value={formData.difficulty}
                onValueChange={(value) =>
                  handleSelectChange("difficulty", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Beginner">Beginner</SelectItem>
                  <SelectItem value="Intermediate">Intermediate</SelectItem>
                  <SelectItem value="Advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {activeTab === "resources" && (
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => handleSelectChange("type", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF Document</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="website">Website</SelectItem>
                    <SelectItem value="tool">Tool</SelectItem>
                    <SelectItem value="course">Course</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {activeTab === "resources" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  name="url"
                  placeholder="https://example.com"
                  value={formData.url}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="provider">Provider</Label>
                <Input
                  id="provider"
                  name="provider"
                  placeholder="Content provider name"
                  value={formData.provider}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma separated)</Label>
            <Input
              id="tags"
              name="tags"
              placeholder="mathematics, calculus, study-guide"
              value={formData.tags}
              onChange={handleInputChange}
            />
          </div>

          <div className="flex justify-end pt-4">
            <Button
              onClick={handleCreateItem}
              disabled={
                isCreating ||
                !formData.title?.trim() ||
                !formData.description?.trim()
              }
              className="min-w-[120px]"
            >
              {isCreating ? (
                <>
                  <Save className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create {activeTab === "resources" ? "Resource" : "Tip"}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Existing Items Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Existing {activeTab === "resources" ? "Resources" : "Tips"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {activeTab === "resources"
                  ? existingResources.length
                  : existingTips.length}
              </div>
              <div className="text-sm text-blue-700">
                Total {activeTab === "resources" ? "Resources" : "Tips"}
              </div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {Math.floor(Math.random() * 50) + 10}
              </div>
              <div className="text-sm text-green-700">Views This Month</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {Math.floor(Math.random() * 10) + 5}
              </div>
              <div className="text-sm text-purple-700">Categories</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminResourcesTab;
