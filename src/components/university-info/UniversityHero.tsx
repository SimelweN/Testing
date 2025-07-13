import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  University,
  GraduationCap,
  BookOpen,
  Calculator,
  Search,
  TrendingUp,
  Award,
  Users,
  Building,
  DollarSign,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface UniversityHeroProps {
  onNavigateToTool: (tool: string) => void;
}

const UniversityHero = ({ onNavigateToTool }: UniversityHeroProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = () => {
    if (searchQuery.trim()) {
      // Navigate to search results or filter
      onNavigateToTool("search");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // Hero statistics
  const stats = [
    {
      icon: Building,
      value: "29",
      label: "Universities",
      color: "text-blue-600",
    },
    {
      icon: BookOpen,
      value: "1000+",
      label: "Programs",
      color: "text-purple-600",
    },
    { icon: Users, value: "1M+", label: "Students", color: "text-gray-600" },
    {
      icon: Award,
      value: "Growing",
      label: "Opportunities",
      color: "text-orange-600",
    },
  ];

  const quickActions = [
    {
      title: "Calculate APS",
      description: "Find programs you qualify for",
      icon: Calculator,
      action: () => onNavigateToTool("aps-calculator"),
      color: "bg-blue-600 hover:bg-blue-700",
      popular: true,
    },
    {
      title: "Find Bursaries",
      description: "Discover funding opportunities",
      icon: DollarSign,
      action: () => onNavigateToTool("bursaries"),
      color: "bg-green-600 hover:bg-green-700",
      popular: false,
    },
    {
      title: "Browse Books",
      description: "Find textbooks for courses",
      icon: BookOpen,
      action: () => onNavigateToTool("books"),
      color: "bg-purple-600 hover:bg-purple-700",
      popular: false,
    },
  ];

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)`,
            backgroundSize: "40px 40px",
          }}
        ></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {/* Main Hero Content */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center bg-blue-600/20 backdrop-blur-sm rounded-full px-3 sm:px-4 py-2 mb-4 sm:mb-6 border border-blue-400/30">
            <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 mr-2 text-blue-300" />
            <span className="text-xs sm:text-sm font-medium text-blue-200">
              Your Gateway to Higher Education
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 leading-tight">
            Discover Your
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent block">
              Perfect University
            </span>
          </h1>

          <p className="text-base sm:text-lg lg:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed mb-6 sm:mb-8 px-4">
            Explore 29 South African universities, calculate your APS, find
            bursaries, and discover the perfect academic path for your future
            success.
          </p>
          <p className="text-base sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed px-4">
            Your comprehensive guide to South African higher education.
            Calculate your APS, explore universities, find bursaries, and
            discover textbooks.
          </p>
        </div>

        {/* Search Section - Mobile Optimized */}
        <div className="max-w-2xl mx-auto mb-6 sm:mb-8 px-4">
          <div className="relative">
            <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
            <Input
              placeholder="Search universities, programs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="pl-10 sm:pl-12 pr-16 sm:pr-24 py-3 sm:py-4 text-sm sm:text-lg border-2 border-gray-200 focus:border-blue-500 rounded-lg sm:rounded-xl"
            />
            <Button
              onClick={handleSearch}
              className="absolute right-1 sm:right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-6 text-xs sm:text-sm"
              size="sm"
            >
              Search
            </Button>
          </div>
        </div>

        {/* Quick Actions - Mobile Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8 px-4">
          {quickActions.map((action, index) => (
            <Card
              key={index}
              className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-blue-200"
              onClick={action.action}
            >
              <CardContent className="p-4 sm:p-6 text-center">
                <div className="relative mb-3 sm:mb-4">
                  <div
                    className={`${action.color} p-3 sm:p-4 rounded-xl sm:rounded-2xl inline-block text-white group-hover:scale-105 transition-transform duration-300`}
                  >
                    <action.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  {action.popular && (
                    <Badge className="absolute -top-1 sm:-top-2 -right-1 sm:-right-2 bg-red-500 text-white border-0 px-1 sm:px-2 py-0.5 sm:py-1 text-xs">
                      Popular
                    </Badge>
                  )}
                </div>

                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {action.title}
                </h3>

                <p className="text-sm text-gray-600 mb-3 sm:mb-4">
                  {action.description}
                </p>

                <div className="flex items-center justify-center text-blue-600 group-hover:text-blue-700 font-medium text-sm">
                  Get Started
                  <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Statistics - Mobile Grid */}
        <div className="bg-white/70 backdrop-blur-sm rounded-lg sm:rounded-xl p-4 sm:p-6 border border-white/40 mx-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 text-center">
            {stats.map((stat, index) => (
              <div key={index} className="group">
                <div className="flex items-center justify-center mb-2">
                  <stat.icon
                    className={`w-6 h-6 sm:w-8 sm:h-8 ${stat.color} group-hover:scale-105 transition-transform duration-300`}
                  />
                </div>
                <div className="text-lg sm:text-2xl font-bold text-gray-900 mb-1">
                  {stat.value}
                </div>
                <div className="text-xs sm:text-sm text-gray-600">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Additional Features - Mobile Grid */}
        <div className="mt-6 sm:mt-8 text-center px-4">
          <h2 className="text-lg sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">
            Everything You Need for Your University Journey
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto">
            {[
              {
                icon: Calculator,
                text: "APS Calculator",
                desc: "Calculate admission points",
              },
              {
                icon: University,
                text: "University Profiles",
                desc: "Detailed information",
              },
              {
                icon: DollarSign,
                text: "Bursary Database",
                desc: "Find funding options",
              },
              {
                icon: BookOpen,
                text: "Textbook Marketplace",
                desc: "Buy & sell books",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-white/50 backdrop-blur-sm rounded-lg p-3 sm:p-4 border border-white/40 hover:bg-white/70 transition-colors"
              >
                <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 mx-auto mb-1 sm:mb-2" />
                <h3 className="font-medium text-gray-900 mb-1 text-xs sm:text-sm">
                  {feature.text}
                </h3>
                <p className="text-xs text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Call to Action - Mobile Optimized */}
        <div className="mt-6 sm:mt-8 text-center px-4">
          <Button
            onClick={() => onNavigateToTool("aps-calculator")}
            size="lg"
            className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-lg rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            Start Your Journey - Calculate APS Now
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
          </Button>

          <p className="text-xs sm:text-sm text-gray-500 mt-2 sm:mt-3">
            Join thousands of students who've found their perfect university
            match
          </p>
        </div>
      </div>
    </div>
  );
};

export default UniversityHero;
