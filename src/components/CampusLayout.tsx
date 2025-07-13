import { ReactNode, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";

interface CampusLayoutProps {
  children: ReactNode;
}

const CampusLayout = ({ children }: CampusLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path === "/university-info" && location.pathname === "/university-info")
      return true;
    if (path === "/resources" && location.pathname === "/resources")
      return true;
    return false;
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav
        style={{
          backgroundColor: "rgb(255, 255, 255)",
          boxShadow:
            "rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.1) 0px 4px 6px -4px",
          position: "sticky",
          top: "0px",
          zIndex: "50",
        }}
      >
        <div
          style={{
            marginLeft: "auto",
            marginRight: "auto",
            maxWidth: "1280px",
            paddingLeft: "24px",
            paddingRight: "24px",
          }}
        >
          <div
            style={{
              alignItems: "center",
              display: "flex",
              height: "64px",
              justifyContent: "space-between",
            }}
          >
            {/* Logo */}
            <div
              style={{
                alignItems: "center",
                display: "flex",
              }}
            >
              <button
                onClick={() => handleNavigation("/")}
                style={{
                  alignItems: "center",
                  cursor: "pointer",
                  display: "flex",
                  background: "none",
                  border: "none",
                  padding: "0",
                }}
              >
                <div
                  style={{
                    alignItems: "center",
                    backgroundColor: "rgb(21, 115, 71)",
                    borderRadius: "12px",
                    cursor: "pointer",
                    display: "flex",
                    height: "32px",
                    justifyContent: "center",
                    width: "32px",
                  }}
                >
                  <span
                    style={{
                      color: "rgb(255, 255, 255)",
                      cursor: "pointer",
                      fontSize: "18px",
                      fontWeight: "700",
                      lineHeight: "28px",
                    }}
                  >
                    R
                  </span>
                </div>
                <span
                  style={{
                    color: "rgb(21, 115, 71)",
                    cursor: "pointer",
                    fontSize: "20px",
                    fontWeight: "700",
                    lineHeight: "28px",
                    marginLeft: "8px",
                  }}
                >
                  ReBooked Solutions
                </span>
              </button>
            </div>

            {/* Desktop Navigation */}
            <div
              style={{ display: window.innerWidth >= 768 ? "block" : "none" }}
            >
              <div
                style={{
                  alignItems: "baseline",
                  display: "flex",
                  marginLeft: "40px",
                }}
              >
                <button
                  onClick={() => handleNavigation("/")}
                  style={{
                    borderRadius: "10px",
                    color: isActive("/")
                      ? "rgb(21, 115, 71)"
                      : "rgb(55, 65, 81)",
                    backgroundColor: isActive("/")
                      ? "rgb(230, 244, 234)"
                      : "transparent",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "500",
                    lineHeight: "20px",
                    paddingBottom: "8px",
                    paddingLeft: "12px",
                    paddingRight: "12px",
                    paddingTop: "8px",
                    border: "none",
                    transition: "all 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                >
                  Home
                </button>
                <button
                  onClick={() => handleNavigation("/university-info")}
                  style={{
                    backgroundColor: isActive("/university-info")
                      ? "rgb(230, 244, 234)"
                      : "transparent",
                    borderRadius: "10px",
                    color: isActive("/university-info")
                      ? "rgb(21, 115, 71)"
                      : "rgb(55, 65, 81)",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "500",
                    lineHeight: "20px",
                    marginLeft: "16px",
                    paddingBottom: "8px",
                    paddingLeft: "12px",
                    paddingRight: "12px",
                    paddingTop: "8px",
                    border: "none",
                    transition: "all 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                >
                  Browse Universities
                </button>
                <button
                  onClick={() => handleNavigation("/books")}
                  style={{
                    borderRadius: "10px",
                    color:
                      location.pathname === "/books"
                        ? "rgb(21, 115, 71)"
                        : "rgb(55, 65, 81)",
                    backgroundColor:
                      location.pathname === "/books"
                        ? "rgb(230, 244, 234)"
                        : "transparent",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "500",
                    lineHeight: "20px",
                    marginLeft: "16px",
                    paddingBottom: "8px",
                    paddingLeft: "12px",
                    paddingRight: "12px",
                    paddingTop: "8px",
                    border: "none",
                    transition: "all 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                >
                  Books
                </button>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div
              style={{ display: window.innerWidth < 768 ? "block" : "none" }}
            >
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                style={{
                  alignItems: "center",
                  borderRadius: "10px",
                  color: "rgb(55, 65, 81)",
                  cursor: "pointer",
                  display: "inline-flex",
                  fontSize: "14px",
                  fontWeight: "500",
                  gap: "8px",
                  height: "36px",
                  justifyContent: "center",
                  paddingLeft: "12px",
                  paddingRight: "12px",
                  backgroundColor: "transparent",
                  border: "none",
                  transition: "all 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              >
                {isMobileMenuOpen ? (
                  <X style={{ height: "16px", width: "16px" }} />
                ) : (
                  <Menu style={{ height: "16px", width: "16px" }} />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div
              style={{
                paddingBottom: "16px",
                paddingTop: "8px",
                borderTop: "1px solid rgb(243, 244, 246)",
              }}
            >
              <div
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                <button
                  onClick={() => handleNavigation("/")}
                  style={{
                    borderRadius: "10px",
                    color: isActive("/")
                      ? "rgb(21, 115, 71)"
                      : "rgb(55, 65, 81)",
                    backgroundColor: isActive("/")
                      ? "rgb(230, 244, 234)"
                      : "transparent",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "500",
                    lineHeight: "20px",
                    paddingBottom: "8px",
                    paddingLeft: "12px",
                    paddingRight: "12px",
                    paddingTop: "8px",
                    border: "none",
                    textAlign: "left",
                    width: "100%",
                  }}
                >
                  Home
                </button>
                <button
                  onClick={() => handleNavigation("/university-info")}
                  style={{
                    backgroundColor: isActive("/university-info")
                      ? "rgb(230, 244, 234)"
                      : "transparent",
                    borderRadius: "10px",
                    color: isActive("/university-info")
                      ? "rgb(21, 115, 71)"
                      : "rgb(55, 65, 81)",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "500",
                    lineHeight: "20px",
                    paddingBottom: "8px",
                    paddingLeft: "12px",
                    paddingRight: "12px",
                    paddingTop: "8px",
                    border: "none",
                    textAlign: "left",
                    width: "100%",
                  }}
                >
                  Browse Universities
                </button>
                <button
                  onClick={() => handleNavigation("/books")}
                  style={{
                    borderRadius: "10px",
                    color:
                      location.pathname === "/books"
                        ? "rgb(21, 115, 71)"
                        : "rgb(55, 65, 81)",
                    backgroundColor:
                      location.pathname === "/books"
                        ? "rgb(230, 244, 234)"
                        : "transparent",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "500",
                    lineHeight: "20px",
                    paddingBottom: "8px",
                    paddingLeft: "12px",
                    paddingRight: "12px",
                    paddingTop: "8px",
                    border: "none",
                    textAlign: "left",
                    width: "100%",
                  }}
                >
                  Books
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main content area */}
      <main className="flex-1">{children}</main>
    </div>
  );
};

export default CampusLayout;
