import { BookOpen, Search, Star } from "lucide-react";

const HowItWorks = () => {
  const steps = [
    {
      icon: BookOpen,
      title: "List Your Books",
      description:
        "Create listings for your used textbooks in minutes. Add details, photos, and set your price.",
    },
    {
      icon: Search,
      title: "Browse & Buy",
      description:
        "Find the textbooks you need from verified sellers. Safe and secure transactions guaranteed.",
    },
    {
      icon: Star,
      title: "Save Money",
      description:
        "Buyers save on textbook costs, and sellers earn money on books they no longer need.",
    },
  ];

  return (
    <section className="py-16 sm:py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-book-800 mb-4">
            How It Works
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 max-w-6xl mx-auto">
          {steps.map((step, index) => (
            <div key={index} className="text-center">
              {/* Icon Circle */}
              <div className="w-20 h-20 mx-auto mb-6 bg-white rounded-full shadow-lg flex items-center justify-center">
                <step.icon className="h-8 w-8 text-book-600" />
              </div>

              {/* Title */}
              <h3 className="text-xl sm:text-2xl font-bold text-book-800 mb-4">
                {step.title}
              </h3>

              {/* Description */}
              <p className="text-gray-600 leading-relaxed max-w-sm mx-auto">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
