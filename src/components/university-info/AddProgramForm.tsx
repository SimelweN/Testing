import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  Minus,
  Send,
  University,
  BookOpen,
  Clock,
  Users,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { UserSubmittedProgram, Subject } from "@/types/university";
import { SOUTH_AFRICAN_UNIVERSITIES } from "@/constants/universities";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const FACULTY_OPTIONS = [
  "Faculty of Science",
  "Faculty of Engineering",
  "Faculty of Commerce and Management",
  "Faculty of Humanities and Social Sciences",
  "Faculty of Health Sciences",
  "Faculty of Education",
  "Faculty of Law",
  "Faculty of Information Technology",
  "Faculty of Agriculture",
  "Faculty of Arts",
  "Faculty of Medicine",
  "Faculty of Veterinary Science",
  "Other",
];

const DURATION_OPTIONS = [
  "1 year",
  "2 years",
  "3 years",
  "4 years",
  "5 years",
  "6 years",
];

const AddProgramForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [formData, setFormData] = useState<Partial<UserSubmittedProgram>>({
    universityId: "",
    universityName: "",
    facultyId: "",
    facultyName: "",
    programName: "",
    duration: "",
    apsRequirement: 0,
    description: "",
    subjects: [],
    careerProspects: [""],
  });

  const [newSubject, setNewSubject] = useState<Subject>({
    name: "",
    level: 1,
    isRequired: true,
  });

  const addSubject = () => {
    if (newSubject.name.trim()) {
      setFormData((prev) => ({
        ...prev,
        subjects: [...(prev.subjects || []), { ...newSubject }],
      }));
      setNewSubject({ name: "", level: 1, isRequired: true });
    }
  };

  const removeSubject = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      subjects: prev.subjects?.filter((_, i) => i !== index) || [],
    }));
  };

  const addCareerProspect = () => {
    setFormData((prev) => ({
      ...prev,
      careerProspects: [...(prev.careerProspects || []), ""],
    }));
  };

  const updateCareerProspect = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      careerProspects:
        prev.careerProspects?.map((prospect, i) =>
          i === index ? value : prospect,
        ) || [],
    }));
  };

  const removeCareerProspect = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      careerProspects:
        prev.careerProspects?.filter((_, i) => i !== index) || [],
    }));
  };

  const handleUniversitySelect = (universityId: string) => {
    const university = SOUTH_AFRICAN_UNIVERSITIES.find(
      (u) => u.id === universityId,
    );
    setFormData((prev) => ({
      ...prev,
      universityId,
      universityName: university?.name || "",
      facultyId: "",
      facultyName: "",
    }));
  };

  const handleFacultySelect = (facultyName: string) => {
    const facultyId = facultyName.toLowerCase().replace(/[^a-z0-9]/g, "-");
    setFormData((prev) => ({
      ...prev,
      facultyId,
      facultyName,
    }));
  };

  const validateForm = (): boolean => {
    if (
      !formData.universityId ||
      !formData.facultyName ||
      !formData.programName ||
      !formData.duration ||
      !formData.description ||
      !formData.apsRequirement
    ) {
      toast.error("Please fill in all required fields marked with *");
      return false;
    }

    if (
      formData.apsRequirement &&
      (formData.apsRequirement < 20 || formData.apsRequirement > 42)
    ) {
      toast.error("APS requirement must be between 20 and 42 points");
      return false;
    }

    if (!formData.subjects || formData.subjects.length === 0) {
      toast.error("Please add at least one subject requirement");
      return false;
    }

    // Check if subjects have names
    const invalidSubjects = formData.subjects.filter((s) => !s.name.trim());
    if (invalidSubjects.length > 0) {
      toast.error("Please provide names for all subjects");
      return false;
    }

    const validCareerProspects =
      formData.careerProspects?.filter((p) => p.trim()) || [];
    if (validCareerProspects.length === 0) {
      toast.error("Please add at least one career prospect");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error("You must be logged in to submit a program");
      return;
    }

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const submissionData: UserSubmittedProgram = {
        ...(formData as UserSubmittedProgram),
        submittedBy: user.id,
        submittedAt: new Date().toISOString(),
        status: "pending",
        careerProspects:
          formData.careerProspects?.filter((p) => p.trim()) || [],
      };

      // Here you would typically send to your backend
      // In a real implementation, this would submit to your backend API
      // For now, we'll just simulate success
      await new Promise((resolve) => {
        setTimeout(() => {
          resolve(true);
        }, 1000);
      });

      setShowSuccess(true);
      toast.success(
        "Program submitted successfully! Our team will review it within 2-3 business days.",
      );

      // Reset form
      setFormData({
        universityId: "",
        universityName: "",
        facultyId: "",
        facultyName: "",
        programName: "",
        duration: "",
        apsRequirement: 0,
        description: "",
        subjects: [],
        careerProspects: [""],
      });
    } catch (error) {
      console.error("Error submitting program:", error);
      toast.error(
        "Failed to submit program. Please check your connection and try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      universityId: "",
      universityName: "",
      facultyId: "",
      facultyName: "",
      programName: "",
      duration: "",
      apsRequirement: 0,
      description: "",
      subjects: [],
      careerProspects: [""],
    });
    setShowSuccess(false);
    toast.success("Form has been reset");
  };

  if (showSuccess) {
    return (
      <Card className="max-w-2xl mx-auto m-4">
        <CardContent className="p-6 md:p-8 text-center">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h3 className="text-2xl font-semibold mb-2">
            Program Submitted Successfully!
          </h3>
          <p className="text-gray-600 mb-6">
            Thank you for contributing to our university database. Your program
            submission has been sent for review and will be published once
            approved by our team.
          </p>
          <Button onClick={() => setShowSuccess(false)}>
            Submit Another Program
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card className="max-w-2xl mx-auto m-4">
        <CardContent className="p-6 md:p-8 text-center">
          <AlertCircle className="h-16 w-16 text-orange-600 mx-auto mb-4" />
          <h3 className="text-2xl font-semibold mb-2">Login Required</h3>
          <p className="text-gray-600 mb-6">
            You need to be logged in to submit new programs to our database.
          </p>
          <Button onClick={() => navigate("/login")}>Log In</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4 md:space-y-6 p-4">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 space-y-2 sm:space-y-0">
            <University className="h-6 w-6 md:h-8 md:w-8 text-blue-600" />
            <div>
              <CardTitle className="text-lg md:text-xl">
                Add University Program
              </CardTitle>
              <CardDescription className="text-sm">
                Help expand our database by adding missing programs from South
                African universities. All submissions are reviewed before
                publication.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 md:space-y-6">
          {/* University Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                University *
              </label>
              <Select
                value={formData.universityId || ""}
                onValueChange={handleUniversitySelect}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select university" />
                </SelectTrigger>
                <SelectContent>
                  {SOUTH_AFRICAN_UNIVERSITIES.map((university) => (
                    <SelectItem key={university.id} value={university.id}>
                      {university.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Faculty *
              </label>
              <Select
                value={formData.facultyName || ""}
                onValueChange={handleFacultySelect}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select faculty" />
                </SelectTrigger>
                <SelectContent>
                  {FACULTY_OPTIONS.map((faculty) => (
                    <SelectItem key={faculty} value={faculty}>
                      {faculty}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Program Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Program Name *
              </label>
              <Input
                placeholder="e.g., Bachelor of Computer Science"
                value={formData.programName || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    programName: e.target.value,
                  }))
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Duration *
              </label>
              <Select
                value={formData.duration || ""}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    duration: value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  {DURATION_OPTIONS.map((duration) => (
                    <SelectItem key={duration} value={duration}>
                      {duration}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              APS Requirement *
            </label>
            <Input
              type="number"
              min="20"
              max="42"
              placeholder="e.g., 32"
              value={formData.apsRequirement || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  apsRequirement: parseInt(e.target.value) || 0,
                }))
              }
            />
            <p className="text-sm text-gray-500 mt-1">
              Enter the minimum APS score required for admission (typically
              20-42)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Program Description *
            </label>
            <Textarea
              placeholder="Describe what this program covers, its focus areas, and what students will learn..."
              value={formData.description || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              rows={4}
            />
          </div>

          <Separator />

          {/* Subject Requirements */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Subject Requirements
            </h3>

            {/* Add Subject Form */}
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <Input
                  placeholder="Subject name"
                  value={newSubject.name}
                  onChange={(e) =>
                    setNewSubject((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                />
                <Select
                  value={newSubject.level.toString()}
                  onValueChange={(value) =>
                    setNewSubject((prev) => ({
                      ...prev,
                      level: parseInt(value),
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem key="level-1" value="1">
                      Level 1
                    </SelectItem>
                    <SelectItem key="level-2" value="2">
                      Level 2
                    </SelectItem>
                    <SelectItem key="level-3" value="3">
                      Level 3
                    </SelectItem>
                    <SelectItem key="level-4" value="4">
                      Level 4
                    </SelectItem>
                    <SelectItem key="level-5" value="5">
                      Level 5
                    </SelectItem>
                    <SelectItem key="level-6" value="6">
                      Level 6
                    </SelectItem>
                    <SelectItem key="level-7" value="7">
                      Level 7
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={newSubject.isRequired.toString()}
                  onValueChange={(value) =>
                    setNewSubject((prev) => ({
                      ...prev,
                      isRequired: value === "true",
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem key="subject-required" value="true">
                      Required
                    </SelectItem>
                    <SelectItem key="subject-recommended" value="false">
                      Recommended
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={addSubject} disabled={!newSubject.name.trim()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
            </div>

            {/* Subject List */}
            <div className="space-y-2">
              {formData.subjects?.map((subject, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <span className="font-medium">{subject.name}</span>
                  </div>
                  <Badge variant="outline">Level {subject.level}</Badge>
                  <Badge variant={subject.isRequired ? "default" : "secondary"}>
                    {subject.isRequired ? "Required" : "Recommended"}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeSubject(index)}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Career Prospects */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Users className="h-5 w-5" />
              Career Prospects
            </h3>

            <div className="space-y-3">
              {formData.careerProspects?.map((prospect, index) => (
                <div key={index} className="flex gap-3">
                  <Input
                    placeholder="e.g., Software Developer, Data Scientist"
                    value={prospect}
                    onChange={(e) =>
                      updateCareerProspect(index, e.target.value)
                    }
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeCareerProspect(index)}
                    disabled={formData.careerProspects?.length === 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              <Button variant="outline" onClick={addCareerProspect}>
                <Plus className="h-4 w-4 mr-2" />
                Add Career Prospect
              </Button>
            </div>
          </div>

          <Separator />

          {/* Submit Section */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Your submission will be reviewed by our team before being added to
              the database. Please ensure all information is accurate and
              complete.
            </AlertDescription>
          </Alert>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                type="submit"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1"
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Submit Program for Review
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
                disabled={isSubmitting}
                className="w-full sm:w-auto"
                size="lg"
              >
                Reset Form
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddProgramForm;
