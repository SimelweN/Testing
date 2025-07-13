import { Users, Calendar, Star, MapPin, GraduationCap } from "lucide-react";

interface UniversityStatsProps {
  totalUniversities: number;
  totalProvinces?: number;
  totalPrograms?: number;
  totalStudents?: string;
  layout?: "horizontal" | "grid";
  className?: string;
}

const UniversityStats = ({
  totalUniversities,
  totalProvinces = 9,
  totalPrograms = 300,
  totalStudents = "1M+",
  layout = "grid",
  className = "",
}: UniversityStatsProps) => {
  const stats = [
    {
      icon: GraduationCap,
      value: totalUniversities.toString(),
      label: "Universities",
      color: "text-book-600",
    },
    {
      icon: MapPin,
      value: totalProvinces.toString(),
      label: "Provinces",
      color: "text-green-600",
    },
    {
      icon: Star,
      value: `${totalPrograms}+`,
      label: "Degree Programs",
      color: "text-blue-600",
    },
    {
      icon: Users,
      value: totalStudents,
      label: "Students",
      color: "text-purple-600",
    },
  ];

  const baseClasses =
    "bg-white/60 backdrop-blur-sm rounded-xl md:rounded-2xl p-3 md:p-4 text-center border border-white/20 shadow-sm";

  if (layout === "horizontal") {
    return (
      <div
        className={`flex flex-wrap justify-center gap-3 md:gap-4 ${className}`}
      >
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className={`${baseClasses} min-w-[100px] md:min-w-[120px]`}
            >
              <Icon
                className={`h-5 w-5 md:h-6 md:w-6 mx-auto mb-1 md:mb-2 ${stat.color}`}
              />
              <div className={`text-lg md:text-2xl font-bold ${stat.color}`}>
                {stat.value}
              </div>
              <div className="text-xs md:text-sm text-gray-600">
                {stat.label}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className={`grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 ${className}`}
    >
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div key={index} className={baseClasses}>
            <Icon
              className={`h-5 w-5 md:h-6 md:w-6 mx-auto mb-1 md:mb-2 ${stat.color}`}
            />
            <div className={`text-lg md:text-2xl font-bold ${stat.color}`}>
              {stat.value}
            </div>
            <div className="text-xs md:text-sm text-gray-600">{stat.label}</div>
          </div>
        );
      })}
    </div>
  );
};

export default UniversityStats;
