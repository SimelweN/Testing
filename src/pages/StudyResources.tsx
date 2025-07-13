import CampusNavbar from "@/components/CampusNavbar";
import StudyResourcesPage from "@/components/university-info/study-resources/StudyResourcesPage";
import SEO from "@/components/SEO";

const StudyResources = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <SEO
        title="Study Resources & Tips | ReBooked Campus"
        description="Master your studies with expert tips, proven techniques, and practical resources. From time management to exam preparation, everything you need for academic success."
        keywords="study tips, study resources, time management, exam preparation, academic success, student resources"
      />
      <CampusNavbar />
      <div className="container mx-auto px-4 py-8">
        <StudyResourcesPage />
      </div>
    </div>
  );
};

export default StudyResources;
