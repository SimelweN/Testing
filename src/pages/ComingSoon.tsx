import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  BookOpen,
  Users,
  Truck,
  Shield,
  Clock,
  Mail,
  CheckCircle,
  Star,
  GraduationCap,
  MapPin,
  CreditCard,
  Smartphone,
  Globe,
  TrendingUp,
  Heart,
  Zap,
  Award,
  Search,
  MessageCircle,
  Calendar,
  BookMarked,
} from "lucide-react";
import { toast } from "sonner";

const ComingSoon = () => {
  const [email, setEmail] = useState("");
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  // Launch date - adjust this as needed
  const launchDate = new Date("2024-02-15T00:00:00").getTime();

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = launchDate - now;

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor(
          (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
        ),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [launchDate]);

  const handleNotifyMe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      // Store email in localStorage for now
      const emails = JSON.parse(localStorage.getItem("waitlistEmails") || "[]");
      if (!emails.includes(email)) {
        emails.push(email);
        localStorage.setItem("waitlistEmails", JSON.stringify(emails));
        toast.success(
          "🎉 You're on the waitlist! We'll notify you when we launch.",
        );
        setEmail("");
      } else {
        toast.info("You're already on our waitlist!");
      }
    }
  };

  const features = [
    {
      icon: <BookOpen className="h-8 w-8" />,
      title: "Massive Textbook Library",
      description:
        "Browse thousands of textbooks across all major universities and subjects in South Africa.",
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Student Community",
      description:
        "Connect with fellow students, share study tips, and build your academic network.",
    },
    {
      icon: <Truck className="h-8 w-8" />,
      title: "Nationwide Delivery",
      description:
        "Fast, reliable delivery to any campus or address across South Africa.",
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Secure Transactions",
      description:
        "Safe payment processing with buyer and seller protection built-in.",
    },
    {
      icon: <CreditCard className="h-8 w-8" />,
      title: "Easy Payments",
      description:
        "Multiple payment options including cards, EFT, and student-friendly installments.",
    },
    {
      icon: <Smartphone className="h-8 w-8" />,
      title: "Mobile Optimized",
      description:
        "Seamless experience across all devices - desktop, tablet, and mobile.",
    },
  ];

  const universities = [
    "University of Cape Town",
    "University of the Witwatersrand",
    "University of Pretoria",
    "Stellenbosch University",
    "University of KwaZulu-Natal",
    "Rhodes University",
    "North-West University",
    "University of the Free State",
    "Nelson Mandela University",
  ];

  const stats = [
    {
      icon: <BookMarked className="h-6 w-6" />,
      number: "50,000+",
      label: "Textbooks Available",
    },
    {
      icon: <Users className="h-6 w-6" />,
      number: "25+",
      label: "Universities Covered",
    },
    {
      icon: <TrendingUp className="h-6 w-6" />,
      number: "70%",
      label: "Average Savings",
    },
    {
      icon: <Award className="h-6 w-6" />,
      number: "24/7",
      label: "Customer Support",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Header */}
      <header className="relative overflow-hidden bg-white border-b border-gray-100">
        <div className="absolute inset-0 bg-gradient-to-r from-book-500/5 to-blue-500/5" />
        <div className="relative container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-book-600 p-2 rounded-xl">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  ReBooked Solutions
                </h1>
                <p className="text-sm text-gray-500">
                  Pre-Loved Pages, New Adventures
                </p>
              </div>
            </div>
            <Badge className="bg-orange-100 text-orange-800 border-orange-200">
              Coming Soon
            </Badge>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-book-600/10 to-blue-600/10" />
        <div className="relative container mx-auto max-w-6xl">
          <div className="mb-8">
            <h2 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6">
              South Africa's
              <span className="block text-book-600">Premier Textbook</span>
              <span className="block">Marketplace</span>
            </h2>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              The revolutionary platform where students buy, sell, and exchange
              textbooks. Save money, help the environment, and connect with your
              academic community.
            </p>
          </div>

          {/* Countdown Timer */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 mb-12 shadow-xl border border-white/20">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Launching In
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { value: timeLeft.days, label: "Days" },
                { value: timeLeft.hours, label: "Hours" },
                { value: timeLeft.minutes, label: "Minutes" },
                { value: timeLeft.seconds, label: "Seconds" },
              ].map((item, index) => (
                <div
                  key={index}
                  className="bg-book-600 text-white rounded-xl p-4"
                >
                  <div className="text-3xl md:text-4xl font-bold">
                    {item.value}
                  </div>
                  <div className="text-book-100 text-sm uppercase tracking-wide">
                    {item.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Email Signup */}
            <form
              onSubmit={handleNotifyMe}
              className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
            >
              <Input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1"
                required
              />
              <Button type="submit" className="bg-book-600 hover:bg-book-700">
                <Mail className="h-4 w-4 mr-2" />
                Notify Me
              </Button>
            </form>
            <p className="text-sm text-gray-500 mt-2">
              Join 2,500+ students already on our waitlist!
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need for Academic Success
            </h3>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              ReBooked Solutions is more than just a marketplace - it's your
              complete academic companion.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <CardContent className="p-8 text-center">
                  <div className="bg-book-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 text-book-600">
                    {feature.icon}
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-4">
                    {feature.title}
                  </h4>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-book-600 to-book-700 text-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold mb-4">
              The Numbers Speak for Themselves
            </h3>
            <p className="text-xl text-book-100">
              Trusted by thousands of students across South Africa
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white">
                  {stat.icon}
                </div>
                <div className="text-3xl md:text-4xl font-bold mb-2">
                  {stat.number}
                </div>
                <div className="text-book-100">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-gray-900 mb-4">
              How ReBooked Works
            </h3>
            <p className="text-xl text-gray-600">
              Simple, secure, and student-friendly
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                step: "01",
                icon: <Search className="h-8 w-8" />,
                title: "Search & Browse",
                description:
                  "Find textbooks by subject, university, or course code",
              },
              {
                step: "02",
                icon: <Heart className="h-8 w-8" />,
                title: "Compare & Save",
                description:
                  "Compare prices and condition to get the best deals",
              },
              {
                step: "03",
                icon: <Shield className="h-8 w-8" />,
                title: "Secure Purchase",
                description: "Buy safely with our protected payment system",
              },
              {
                step: "04",
                icon: <Truck className="h-8 w-8" />,
                title: "Fast Delivery",
                description: "Get your books delivered right to your doorstep",
              },
            ].map((step, index) => (
              <div key={index} className="text-center relative">
                <div className="bg-book-600 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                  {step.step}
                </div>
                <div className="bg-book-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 text-book-600">
                  {step.icon}
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-4">
                  {step.title}
                </h4>
                <p className="text-gray-600">{step.description}</p>
                {index < 3 && (
                  <div className="hidden lg:block absolute top-6 -right-4 w-8 h-0.5 bg-book-200" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Universities */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <GraduationCap className="h-16 w-16 text-book-600 mx-auto mb-6" />
            <h3 className="text-4xl font-bold text-gray-900 mb-4">
              Covering All Major Universities
            </h3>
            <p className="text-xl text-gray-600">
              From UCT to Wits, we've got textbooks for every campus
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {universities.map((uni, index) => (
              <div
                key={index}
                className="bg-gray-50 rounded-xl p-6 text-center hover:bg-book-50 transition-colors"
              >
                <h4 className="font-semibold text-gray-900">{uni}</h4>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-4 bg-gradient-to-br from-blue-50 to-green-50">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h3 className="text-4xl font-bold text-gray-900 mb-8">
                Why Choose ReBooked Solutions?
              </h3>
              <div className="space-y-6">
                {[
                  {
                    icon: <Zap className="h-6 w-6" />,
                    title: "Save Up to 70%",
                    description:
                      "Get the same textbooks at a fraction of the original price",
                  },
                  {
                    icon: <Globe className="h-6 w-6" />,
                    title: "Eco-Friendly",
                    description:
                      "Give textbooks a second life and reduce environmental impact",
                  },
                  {
                    icon: <MessageCircle className="h-6 w-6" />,
                    title: "Student Community",
                    description:
                      "Connect with peers and share academic resources",
                  },
                  {
                    icon: <Award className="h-6 w-6" />,
                    title: "Quality Guaranteed",
                    description:
                      "Every book is verified for condition and authenticity",
                  },
                ].map((benefit, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="bg-book-600 text-white p-2 rounded-lg">
                      {benefit.icon}
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-gray-900 mb-2">
                        {benefit.title}
                      </h4>
                      <p className="text-gray-600">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-2xl">
              <div className="text-center mb-8">
                <div className="bg-book-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Star className="h-10 w-10 text-white" />
                </div>
                <h4 className="text-2xl font-bold text-gray-900 mb-4">
                  Join the Revolution
                </h4>
                <p className="text-gray-600 mb-6">
                  Be part of South Africa's most innovative student marketplace
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <span className="font-semibold text-gray-900">
                    Free Registration
                  </span>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <span className="font-semibold text-gray-900">
                    No Hidden Fees
                  </span>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <span className="font-semibold text-gray-900">
                    24/7 Support
                  </span>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <span className="font-semibold text-gray-900">
                    Money-Back Guarantee
                  </span>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 bg-book-600 text-white">
        <div className="container mx-auto max-w-4xl text-center">
          <Calendar className="h-16 w-16 mx-auto mb-6 text-book-100" />
          <h3 className="text-4xl font-bold mb-6">Don't Miss the Launch!</h3>
          <p className="text-xl text-book-100 mb-8">
            Be among the first to experience the future of textbook trading in
            South Africa. Early users get exclusive benefits and lifetime
            discounts!
          </p>

          <form
            onSubmit={handleNotifyMe}
            className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto mb-8"
          >
            <Input
              type="email"
              placeholder="Your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 bg-white text-gray-900"
              required
            />
            <Button
              type="submit"
              className="bg-white text-book-600 hover:bg-gray-100"
            >
              <Mail className="h-4 w-4 mr-2" />
              Join Waitlist
            </Button>
          </form>

          <p className="text-book-200">
            🎉 Early birds get 50% off fees for the first 6 months!
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-book-600 p-2 rounded-lg">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h4 className="text-xl font-bold">ReBooked Solutions</h4>
                  <p className="text-gray-400 text-sm">
                    Pre-Loved Pages, New Adventures
                  </p>
                </div>
              </div>
              <p className="text-gray-400">
                Revolutionizing how South African students buy, sell, and share
                textbooks.
              </p>
            </div>

            <div>
              <h5 className="font-bold mb-4">Coming Features</h5>
              <ul className="space-y-2 text-gray-400">
                <li>• Smart textbook recommendations</li>
                <li>• Study group creation</li>
                <li>• Grade tracking integration</li>
                <li>• Campus delivery lockers</li>
              </ul>
            </div>

            <div>
              <h5 className="font-bold mb-4">Stay Connected</h5>
              <p className="text-gray-400 mb-4">
                Follow our journey and get updates on the launch
              </p>
              <div className="flex space-x-4">
                <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center cursor-pointer hover:bg-book-600 transition-colors">
                  <span className="text-sm font-bold">f</span>
                </div>
                <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center cursor-pointer hover:bg-book-600 transition-colors">
                  <span className="text-sm font-bold">t</span>
                </div>
                <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center cursor-pointer hover:bg-book-600 transition-colors">
                  <span className="text-sm font-bold">in</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>
              &copy; 2024 ReBooked Solutions. All rights reserved. Coming Soon
              to South Africa!
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ComingSoon;
