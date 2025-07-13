import { Link } from "react-router-dom";
import {
  Book,
  MessageCircle,
  AlertTriangle,
  Instagram,
  Facebook,
} from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const handleLinkClick = () => {
    setTimeout(() => {
      window.scrollTo(0, 0);
    }, 100);
  };

  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <Link
              to="/"
              className="flex items-center"
              onClick={handleLinkClick}
            >
              <Book className="h-6 w-6 text-book-600" />
              <span className="ml-2 text-xl font-bold text-book-800">
                ReBooked Solutions
              </span>
            </Link>
            <p className="text-gray-600 text-sm">
              Buy and sell new and used books through our secure platform. No
              direct communication needed.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Marketplace
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/books"
                  className="text-gray-600 hover:text-book-600 text-sm"
                  onClick={handleLinkClick}
                >
                  Browse Books
                </Link>
              </li>
              <li>
                <Link
                  to="/books?category=textbooks"
                  className="text-gray-600 hover:text-book-600 text-sm"
                  onClick={handleLinkClick}
                >
                  Textbooks
                </Link>
              </li>
              <li>
                <Link
                  to="/books?condition=used"
                  className="text-gray-600 hover:text-book-600 text-sm"
                  onClick={handleLinkClick}
                >
                  Used Books
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Account
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/profile"
                  className="text-gray-600 hover:text-book-600 text-sm"
                  onClick={handleLinkClick}
                >
                  My Profile
                </Link>
              </li>
              <li>
                <Link
                  to="/create-listing"
                  className="text-gray-600 hover:text-book-600 text-sm"
                  onClick={handleLinkClick}
                >
                  Sell a Book
                </Link>
              </li>
              <li>
                <Link
                  to="/activity"
                  className="text-gray-600 hover:text-book-600 text-sm"
                  onClick={handleLinkClick}
                >
                  My Activity
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Support
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/contact"
                  className="text-gray-600 hover:text-book-600 text-sm flex items-center"
                  onClick={handleLinkClick}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Contact Us
                </Link>
              </li>
              <li>
                <Link
                  to="/report"
                  className="text-gray-600 hover:text-book-600 text-sm flex items-center"
                  onClick={handleLinkClick}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Report Issue
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy"
                  className="text-gray-600 hover:text-book-600 text-sm"
                  onClick={handleLinkClick}
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/policies"
                  className="text-gray-600 hover:text-book-600 text-sm font-medium"
                  onClick={handleLinkClick}
                >
                  All Policies & Terms
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6 mt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-500">
            &copy; {currentYear} ReBooked Solutions. All rights reserved.
          </p>

          {/* Social Media Links */}
          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            <a
              href="https://www.instagram.com/rebooked.solutions?igsh=M2ZsNjd2aTNmZmRh"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-pink-500 transition-colors"
              aria-label="Follow us on Instagram"
            >
              <Instagram className="h-5 w-5" />
            </a>
            <a
              href="https://www.facebook.com/share/16ngKMps6U/?mibextid=wwXIfr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-blue-600 transition-colors"
              aria-label="Follow us on Facebook"
            >
              <Facebook className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
