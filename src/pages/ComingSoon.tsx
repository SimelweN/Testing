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

          {/* Email Signup */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 mb-12 shadow-xl border border-white/20">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Be the First to Know!
            </h3>
            <p className="text-gray-600 mb-6">
              Join our waitlist and get exclusive early access when we launch.
            </p>

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
                Join Waitlist
              </Button>
            </form>
            <p className="text-sm text-gray-500 mt-4">
              🎉 Join 2,500+ students already on our waitlist!
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

      {/* Student Voices Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-book-600 to-book-700 text-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold mb-4">
              What Students Are Saying
            </h3>
            <p className="text-xl text-book-100">
              Real feedback from students who can't wait for ReBooked Solutions
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                quote:
                  "Finally! A platform made by students, for students. Can't wait to save money on my textbooks!",
                author: "Sarah M.",
                university: "UCT",
                course: "Computer Science",
              },
              {
                quote:
                  "This is exactly what we need! Buying textbooks has always been so expensive. ReBooked will be a game-changer.",
                author: "Thabo K.",
                university: "Wits",
                course: "Engineering",
              },
              {
                quote:
                  "Love the idea of connecting with other students while saving money. The eco-friendly aspect is amazing too!",
                author: "Emma L.",
                university: "Stellenbosch",
                course: "Business",
              },
            ].map((testimonial, index) => (
              <div
                key={index}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
              >
                <div className="flex items-center mb-4">
                  <div className="bg-white/20 w-12 h-12 rounded-full flex items-center justify-center mr-4">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white">
                      {testimonial.author}
                    </h4>
                    <p className="text-book-100 text-sm">
                      {testimonial.course} • {testimonial.university}
                    </p>
                  </div>
                </div>
                <blockquote className="text-book-50 italic leading-relaxed">
                  "{testimonial.quote}"
                </blockquote>
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
              <h5 className="font-bold mb-4">Our Mission</h5>
              <p className="text-gray-400 leading-relaxed">
                Making quality education more affordable and accessible for
                every South African student while building a sustainable
                community around textbook sharing.
              </p>
            </div>

            <div>
              <h5 className="font-bold mb-4">Stay Connected</h5>
              <p className="text-gray-400 mb-4">
                Follow our journey and get updates on the launch
              </p>
              <div className="flex space-x-4">
                <a
                  href="https://www.instagram.com/rebooked.solutions?igsh=dTR3NGh6M2V6Nm82"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gradient-to-r hover:from-purple-500 hover:to-pink-500 transition-all duration-300"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>
                <a
                  href="https://www.facebook.com/share/172RMm3Szc/?mibextid=wwXIfr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center cursor-pointer hover:bg-blue-600 transition-colors"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
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
