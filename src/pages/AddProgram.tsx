import CampusNavbar from "@/components/CampusNavbar";
import AddProgramForm from "@/components/university-info/AddProgramForm";
import SEO from "@/components/SEO";

const AddProgram = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <SEO
        title="Add University Program | ReBooked Campus"
        description="Help expand our university database by adding missing programs from South African universities. All submissions are reviewed before publication."
        keywords="add program, university programs, contribute, university database, South African universities"
      />
      <CampusNavbar />
      <div className="container mx-auto px-4 py-8">
        <AddProgramForm />
      </div>
    </div>
  );
};

export default AddProgram;
