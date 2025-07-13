import { useState } from "react";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Scale, Shield, Mail } from "lucide-react";

const Policies = () => {
  const [activeTab, setActiveTab] = useState("privacy");

  return (
    <Layout>
      <SEO
        title="Policies & Terms | ReBooked Solutions"
        description="Complete policy documentation for ReBooked Solutions - Privacy Policy and Terms and Conditions."
        keywords="policies, terms, privacy, POPIA, consumer protection, ReBooked Solutions"
      />

      <div className="container mx-auto px-4 py-4 sm:py-8 max-w-6xl">
        <div className="mb-6 sm:mb-8 text-center">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
            ReBooked Solutions – Platform Policies
          </h1>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mt-4 max-w-4xl mx-auto">
            <div className="text-blue-800 text-xs sm:text-sm space-y-1 sm:space-y-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-center flex-wrap gap-1 sm:gap-2">
                <span>
                  <strong>Effective Date:</strong> 10 June 2025
                </span>
                <span className="hidden sm:inline">•</span>
                <span>
                  <strong>Platform:</strong>{" "}
                  <span className="break-all">www.rebookedsolutions.co.za</span>
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-center flex-wrap gap-1 sm:gap-2 mt-2 sm:mt-1">
                <span>
                  <strong>Platform Operator:</strong> ReBooked Solutions (Pty)
                  Ltd
                </span>
                <span className="hidden sm:inline">•</span>
                <span>
                  <strong>Support:</strong>{" "}
                  <span className="break-all">
                    support@rebookedsolutions.co.za
                  </span>
                </span>
              </div>
              <div className="mt-2 sm:mt-1">
                <span>
                  <strong>Jurisdiction:</strong> Republic of South Africa
                </span>
              </div>
              <div className="mt-2 sm:mt-1">
                <span>
                  <strong>Regulatory Compliance:</strong> Consumer Protection
                  Act (Act 68 of 2008), Electronic Communications and
                  Transactions Act (Act 25 of 2002), Protection of Personal
                  Information Act (Act 4 of 2013)
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full">
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-wrap gap-2 sm:gap-3 p-3 sm:p-4 bg-gray-100 rounded-lg">
              <Button
                onClick={() => setActiveTab("privacy")}
                variant={activeTab === "privacy" ? "default" : "outline"}
                size="sm"
                className="text-xs sm:text-sm flex-shrink-0"
              >
                <Shield className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span>Privacy Policy</span>
              </Button>
              <Button
                onClick={() => setActiveTab("terms")}
                variant={activeTab === "terms" ? "default" : "outline"}
                size="sm"
                className="text-xs sm:text-sm flex-shrink-0"
              >
                <Scale className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span>Terms & Conditions</span>
              </Button>
              <Button
                onClick={() => setActiveTab("refunds")}
                variant={activeTab === "refunds" ? "default" : "outline"}
                size="sm"
                className="text-xs sm:text-sm flex-shrink-0"
              >
                <span>Refund Policy</span>
              </Button>
              <Button
                onClick={() => setActiveTab("cancellation")}
                variant={activeTab === "cancellation" ? "default" : "outline"}
                size="sm"
                className="text-xs sm:text-sm flex-shrink-0"
              >
                <span>Cancellation Policy</span>
              </Button>
              <Button
                onClick={() => setActiveTab("shipping")}
                variant={activeTab === "shipping" ? "default" : "outline"}
                size="sm"
                className="text-xs sm:text-sm flex-shrink-0"
              >
                <span>Shipping & Delivery</span>
              </Button>
              <Button
                onClick={() => setActiveTab("returns")}
                variant={activeTab === "returns" ? "default" : "outline"}
                size="sm"
                className="text-xs sm:text-sm flex-shrink-0"
              >
                <span>Return Policy</span>
              </Button>
              <Button
                onClick={() => setActiveTab("disputes")}
                variant={activeTab === "disputes" ? "default" : "outline"}
                size="sm"
                className="text-xs sm:text-sm flex-shrink-0"
              >
                <span>Dispute Resolution</span>
              </Button>
            </div>
          </div>

          {/* Privacy Policy Tab */}
          {activeTab === "privacy" && (
            <div className="space-y-4 sm:space-y-6">
              <Card>
                <CardHeader className="pb-4 sm:pb-6">
                  <CardTitle className="text-xl sm:text-2xl lg:text-3xl flex items-center gap-2 mb-2 sm:mb-3">
                    <Shield className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 flex-shrink-0" />
                    <span>Privacy Policy</span>
                  </CardTitle>
                  <div className="text-gray-600 text-xs sm:text-sm space-y-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <span>
                        <strong>Effective Date:</strong> 10 June 2025
                      </span>
                      <span className="hidden sm:inline">•</span>
                      <span>
                        <strong>Platform:</strong>{" "}
                        <span className="break-all">
                          www.rebookedsolutions.co.za
                        </span>
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <span>
                        <strong>Operator:</strong> ReBooked Solutions (Pty) Ltd
                      </span>
                      <span className="hidden sm:inline">•</span>
                      <span>
                        <strong>Contact:</strong>{" "}
                        <span className="break-all">
                          support@rebookedsolutions.co.za
                        </span>
                      </span>
                    </div>
                    <strong>Jurisdiction:</strong>
                    <div>
                      <span> Republic of South Africa</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-4 sm:px-6">
                  <div className="prose max-w-none space-y-4 sm:space-y-6">
                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        1. Introduction
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3 sm:mb-4">
                        ReBooked Solutions (Pty) Ltd ("ReBooked", "we", "our",
                        or "us") is committed to protecting your privacy. This
                        Privacy Policy outlines how we collect, use, store,
                        share, and protect your personal information in
                        accordance with the Protection of Personal Information
                        Act (POPIA) and applicable South African law.
                      </p>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
                        By accessing or using any part of the ReBooked platform,
                        including ReBooked Campus, you consent to the collection
                        and processing of your personal information as outlined
                        in this Policy. If you do not agree, please refrain from
                        using the platform.
                      </p>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        2. Scope of the Policy
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3 sm:mb-4">
                        This Privacy Policy applies to all visitors, users, and
                        account holders of ReBooked Solutions. It covers
                        information collected through our main marketplace,
                        ReBooked Campus, our communication tools, analytics
                        systems, and any third-party integrations we use.
                      </p>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        3. What Information We Collect
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3 sm:mb-4">
                        We collect personal information that is necessary to
                        provide our services and ensure platform security. This
                        includes, but is not limited to:
                      </p>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li>
                          Identification and contact information: full name,
                          email address, phone number, and optionally your
                          school or university.
                        </li>
                        <li>
                          Account credentials: hashed passwords and login
                          activity.
                        </li>
                        <li>
                          Listing and transaction data: books or items listed,
                          viewed, sold, or purchased.
                        </li>
                        <li>
                          Delivery information: shipping address, courier
                          tracking data, and delivery preferences.
                        </li>
                        <li>
                          Payment-related information: payout details or payment
                          references, collected and processed securely through
                          trusted third-party providers like Paystack.
                        </li>
                        <li>
                          Educational data: input used in APS calculators, study
                          tips submitted, bursary tools used, and program
                          searches within ReBooked Campus.
                        </li>
                        <li>
                          Technical and usage data: IP address, browser type,
                          device info, time on page, actions performed, and
                          referral source.
                        </li>
                        <li>
                          Communication data: messages sent to our support
                          email, helpdesk forms, or via any integrated chat or
                          contact system.
                        </li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        4. How We Collect Your Information
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3 sm:mb-4">
                        We collect personal information directly from you when
                        you create an account, submit forms, list items, browse
                        educational resources, or communicate with us.
                      </p>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3 sm:mb-4">
                        We also collect certain data automatically through
                        cookies, server logs, analytics tools, and browser-based
                        tracking, which help us improve the platform and detect
                        suspicious activity.
                      </p>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
                        Where applicable, we may collect information from
                        third-party services you interact with through our
                        platform, such as payment providers or delivery
                        companies.
                      </p>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        5. How We Use Your Information
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3 sm:mb-4">
                        We use your information for the following lawful
                        purposes:
                      </p>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li>To register and manage your account.</li>
                        <li>
                          To facilitate the listing, browsing, and sale of books
                          and other goods.
                        </li>
                        <li>
                          To enable communication between buyers and sellers.
                        </li>
                        <li>
                          To coordinate with courier services for deliveries.
                        </li>
                        <li>
                          To display and improve ReBooked Campus resources,
                          including APS tools, bursary data, and university
                          programs.
                        </li>
                        <li>
                          To send important notifications, alerts, and updates
                          related to your account, listings, or educational
                          tools.
                        </li>
                        <li>
                          To respond to user queries and provide customer
                          support.
                        </li>
                        <li>
                          To analyse user behaviour and improve platform
                          performance, reliability, and security.
                        </li>
                        <li>
                          To enforce our terms and conditions and protect
                          against fraud, abuse, or policy violations.
                        </li>
                        <li>
                          To comply with South African legal obligations, such
                          as tax, consumer protection, or data protection laws.
                        </li>
                      </ul>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mt-3">
                        We will only use your personal information for the
                        purpose it was collected, unless we reasonably believe
                        another purpose is compatible or we obtain your further
                        consent.
                      </p>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        6. Sharing of Information
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3 sm:mb-4">
                        We do not sell, lease, or rent your personal information
                        to any third parties. However, we may share your
                        personal data under strict conditions with:
                      </p>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li>
                          Third-party service providers who help operate the
                          platform, such as our database host (Supabase), web
                          host (Vercel), or analytics partners.
                        </li>
                        <li>
                          Courier companies for fulfilling delivery instructions
                          and providing tracking updates.
                        </li>
                        <li>
                          Payment processors like Paystack for secure handling
                          of funds, subject to their own privacy and security
                          frameworks.
                        </li>
                        <li>
                          Legal or regulatory authorities if required by law,
                          court order, subpoena, or in the defence of legal
                          claims.
                        </li>
                        <li>
                          Technical advisors or consultants strictly for
                          internal compliance, audits, or security reviews.
                        </li>
                      </ul>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mt-3">
                        All third parties are contractually required to treat
                        your data with confidentiality and to use it only for
                        the intended service delivery purpose.
                      </p>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        7. Cookies and Tracking
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3 sm:mb-4">
                        ReBooked Solutions uses cookies and similar technologies
                        to improve user experience, maintain security, and
                        analyse platform usage.
                      </p>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
                        These cookies may track session duration, device
                        information, login behaviour, and referral sources. You
                        can disable cookies in your browser settings, but this
                        may limit some functionality on our website.
                      </p>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        8. Data Security
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3 sm:mb-4">
                        We implement industry-standard technical and
                        organisational measures to protect your personal data.
                        These include secure password hashing, role-based access
                        control, encrypted storage, audit logging, and real-time
                        threat monitoring.
                      </p>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
                        While we make every effort to safeguard your data, no
                        method of digital transmission or storage is completely
                        secure. Use of the platform is at your own risk, and you
                        acknowledge that absolute security cannot be guaranteed.
                      </p>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        9. Data Retention
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3 sm:mb-4">
                        We retain personal information only as long as necessary
                        to fulfil the purposes outlined in this Policy or as
                        required by law. When your information is no longer
                        required, it is securely deleted or anonymised.
                      </p>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
                        You may request deletion of your data by contacting
                        support@rebookedsolutions.co.za. However, we may retain
                        certain information if required for legal compliance,
                        fraud prevention, dispute resolution, or transaction
                        history.
                      </p>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        10. User Rights Under POPIA
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3 sm:mb-4">
                        Under South African data protection law, you have the
                        following rights:
                      </p>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li>
                          The right to be informed about how your personal data
                          is collected and used.
                        </li>
                        <li>
                          The right to access the personal data we hold about
                          you.
                        </li>
                        <li>
                          The right to request correction or deletion of your
                          personal information.
                        </li>
                        <li>
                          The right to object to processing or withdraw consent
                          where applicable.
                        </li>
                        <li>
                          The right to lodge a complaint with the Information
                          Regulator.
                        </li>
                      </ul>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mt-3">
                        To exercise any of these rights, please contact
                        support@rebookedsolutions.co.za. We may require proof of
                        identity before processing any request.
                      </p>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        11. Children's Privacy
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
                        Our platform is not intended for users under the age of
                        16 without parental or guardian consent. If we learn
                        that we have collected information from a child without
                        proper authorisation, we will take steps to delete it
                        promptly.
                      </p>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        12. Third-Party Links
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
                        Our site may contain links to third-party websites,
                        services, or bursary programs. Once you leave our
                        domain, we are not responsible for the privacy
                        practices, content, or accuracy of those third-party
                        sites. You access them at your own risk.
                      </p>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        13. International Transfers
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
                        Although we are based in South Africa, some of our
                        service providers (e.g., hosting or email services) may
                        process data in foreign jurisdictions. We take
                        reasonable steps to ensure that all data transfers are
                        compliant with South African data protection laws and
                        subject to adequate safeguards.
                      </p>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        14. Policy Updates
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
                        We reserve the right to update this Privacy Policy at
                        any time. Material changes will be announced on the
                        platform. Continued use after such changes implies your
                        acceptance of the revised terms.
                      </p>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        15. Contact Us
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3">
                        If you have any questions, requests, or concerns
                        regarding your personal information or this Privacy
                        Policy, please contact:
                      </p>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-3">
                        <p className="text-blue-800 text-sm sm:text-base">
                          <strong>ReBooked Solutions (Pty) Ltd</strong>
                          <br />
                          Email:{" "}
                          <span className="break-all">
                            support@rebookedsolutions.co.za
                          </span>
                          <br />
                          Based in the Republic of South Africa
                        </p>
                      </div>
                    </section>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Terms & Conditions Tab */}
          {activeTab === "terms" && (
            <div className="space-y-4 sm:space-y-6">
              <Card>
                <CardHeader className="pb-4 sm:pb-6">
                  <CardTitle className="text-xl sm:text-2xl lg:text-3xl flex items-center gap-2 mb-2 sm:mb-3">
                    <Scale className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 flex-shrink-0" />
                    <span>Terms and Conditions of Use</span>
                  </CardTitle>
                  <div className="text-gray-600 text-xs sm:text-sm space-y-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <span>
                        <strong>Effective Date:</strong> 10 June 2025
                      </span>
                      <span className="hidden sm:inline">•</span>
                      <span>
                        <strong>Platform Operator:</strong> ReBooked Solutions
                        (Pty) Ltd
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <span>
                        <strong>Email:</strong>{" "}
                        <span className="break-all">
                          support@rebookedsolutions.co.za
                        </span>
                      </span>
                      <span className="hidden sm:inline">•</span>
                      <span>
                        <strong>Jurisdiction:</strong> Republic of South Africa
                      </span>
                    </div>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 sm:p-4 mt-3">
                    <div className="text-amber-800 text-xs sm:text-sm">
                      <p className="font-semibold mb-2">Governing Laws:</p>
                      <ul className="space-y-1 text-xs sm:text-sm">
                        <li>• Consumer Protection Act (CPA) No. 68 of 2008</li>
                        <li>
                          • Electronic Communications and Transactions Act
                          (ECTA) No. 25 of 2002
                        </li>
                        <li>
                          • Protection of Personal Information Act (POPIA) No. 4
                          of 2013
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-4 sm:px-6">
                  <div className="prose max-w-none space-y-4 sm:space-y-6">
                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        1. INTRODUCTION
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3 sm:mb-4">
                        Welcome to ReBooked Solutions. These Terms and
                        Conditions ("Terms") are a legally binding agreement
                        between you and ReBooked Solutions (Pty) Ltd
                        ("ReBooked", "we", "us", or "our"). They govern your
                        access to and use of our platform, services, and
                        content. If you do not agree to these Terms, you must
                        cease all use of our services immediately.
                      </p>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
                        By using the Platform, you confirm that you understand
                        and agree to these Terms, our policies (including but
                        not limited to Refund, Return, Shipping, and Dispute
                        policies), and our Privacy Policy. You accept all risks
                        associated with using a peer-to-peer resale platform and
                        accept that ReBooked Solutions is not a party to any
                        sale of goods between users.
                      </p>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        2. DEFINITIONS
                      </h3>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li>
                          "Platform" refers to the website
                          www.rebookedsolutions.co.za, including all services,
                          features, and content available therein.
                        </li>
                        <li>
                          "User" or "you" refers to any individual or entity who
                          accesses or uses the Platform, whether as a buyer,
                          seller, or visitor.
                        </li>
                        <li>
                          "ReBooked Campus" refers to the informational and
                          educational segment of the Platform offering academic
                          resources, university data, APS tools, bursary
                          listings, blog posts, and study tips.
                        </li>
                        <li>
                          "Content" includes any text, images, documents, posts,
                          data, links, files, or other materials submitted,
                          posted, or displayed by users.
                        </li>
                        <li>
                          "Third Party" refers to any entity or service provider
                          that is not owned or directly controlled by ReBooked
                          Solutions.
                        </li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        3. PLATFORM NATURE & DISCLAIMER OF RESPONSIBILITY
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3 sm:mb-4">
                        ReBooked Solutions is an online marketplace and academic
                        resource platform. We do not buy, own, stock, or sell
                        any books or physical goods listed by users. All
                        transactions are conducted directly between buyers and
                        sellers.
                      </p>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3 sm:mb-4">
                        We provide a digital venue and payment integration only.
                        We make no warranties regarding the suitability, safety,
                        legality, or quality of items listed, nor the
                        credibility of sellers or accuracy of ReBooked Campus
                        information. All users transact at their own risk.
                      </p>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3 sm:mb-4">
                        We are not liable for:
                      </p>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li>
                          Misleading listings or undisclosed book conditions
                        </li>
                        <li>Counterfeit, plagiarised, or illegal goods</li>
                        <li>Non-performance or breach by any user</li>
                        <li>Courier or delivery delays</li>
                        <li>Failed payments or chargebacks</li>
                        <li>Errors in educational or institutional data</li>
                      </ul>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mt-3">
                        You acknowledge that ReBooked is not a party to any
                        contract for sale formed between users, nor are we
                        agents of any buyer or seller.
                      </p>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        4. USER ELIGIBILITY
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3 sm:mb-4">
                        By using the Platform, you warrant that:
                      </p>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li>
                          You are 18 years or older, or have consent from a
                          parent/guardian.
                        </li>
                        <li>
                          You are not prohibited under South African law from
                          using online marketplaces.
                        </li>
                        <li>
                          You are providing accurate and lawful personal and
                          payment information.
                        </li>
                        <li>
                          You accept full legal responsibility for all
                          activities under your account.
                        </li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        5. USER ACCOUNT RESPONSIBILITIES
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3 sm:mb-4">
                        5.1 Each user is responsible for maintaining the
                        confidentiality and accuracy of their account
                        information. You must not share your password or allow
                        anyone else to access your account.
                      </p>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3 sm:mb-4">
                        5.2 You are liable for all actions performed through
                        your account, including fraud, unauthorised sales, or
                        misrepresentations. ReBooked disclaims all liability for
                        unauthorised access due to user negligence.
                      </p>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3 sm:mb-4">
                        5.3 ReBooked reserves the right to suspend or
                        permanently terminate any user account at any time for:
                      </p>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li>Violating these Terms</li>
                        <li>Posting harmful, misleading, or illegal content</li>
                        <li>
                          Attempting to circumvent platform systems or fees
                        </li>
                        <li>Using the platform to deceive or defraud others</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        6. TRANSACTIONS, FEES, AND PAYMENTS
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3 sm:mb-4">
                        6.1 All payments are facilitated through trusted
                        third-party payment processors (e.g., Paystack).
                        ReBooked does not store credit card information or
                        process payments internally.
                      </p>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3 sm:mb-4">
                        6.2 ReBooked charges a 10% service fee per successful
                        transaction. This fee is automatically deducted before
                        payouts are made to sellers.
                      </p>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3 sm:mb-4">
                        6.3 We are not liable for:
                      </p>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li>Failed or delayed payments</li>
                        <li>Withdrawal issues due to incorrect bank details</li>
                        <li>Currency conversion or third-party bank fees</li>
                      </ul>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mt-3">
                        Sellers are solely responsible for compliance with SARS
                        or tax reporting requirements.
                      </p>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        7. SHIPPING, DELIVERY, RETURNS, AND REFUNDS
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3 sm:mb-4">
                        All buyers and sellers agree to abide by ReBooked's:
                      </p>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li>Refund Policy</li>
                        <li>Return Policy</li>
                        <li>Shipping Policy</li>
                        <li>Cancellation Policy</li>
                        <li>Dispute Resolution Policy</li>
                      </ul>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3 sm:mb-4 mt-3">
                        These policies are incorporated by reference and
                        enforceable as part of these Terms.
                      </p>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3 sm:mb-4">
                        You acknowledge that:
                      </p>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li>
                          ReBooked does not ship or handle physical goods.
                        </li>
                        <li>
                          ReBooked is not liable for lost, stolen, delayed, or
                          damaged packages.
                        </li>
                        <li>
                          Return disputes are handled between buyer and seller,
                          with ReBooked only providing a non-binding mediation
                          role.
                        </li>
                        <li>
                          Refunds are not guaranteed unless supported by clear
                          evidence and governed under our published policies.
                        </li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        8. REBOOKED CAMPUS TERMS
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3 sm:mb-4">
                        8.1 ReBooked Campus offers informational academic
                        resources such as:
                      </p>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li>APS calculation tools</li>
                        <li>Bursary listings</li>
                        <li>University program data</li>
                        <li>Application advice</li>
                        <li>Sponsor or affiliate content</li>
                      </ul>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3 sm:mb-4 mt-3">
                        8.2 All content in ReBooked Campus is provided "as-is"
                        for informational purposes only. We do not:
                      </p>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li>
                          Guarantee data accuracy (APS scores, deadlines, etc.)
                        </li>
                        <li>
                          Represent any university or financial aid provider
                        </li>
                        <li>Guarantee bursary outcomes or funding</li>
                        <li>
                          Accept liability for decisions made based on this
                          information
                        </li>
                      </ul>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mt-3">
                        Users must verify all information directly with the
                        official institution or funding body. ReBooked accepts
                        no responsibility for missed deadlines, incorrect
                        submissions, or misinterpreted content.
                      </p>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        9. USER CONTENT AND CONDUCT
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3 sm:mb-4">
                        Users must not upload, post, or distribute any content
                        that is:
                      </p>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li>False, deceptive, or misleading</li>
                        <li>Offensive, defamatory, racist, or abusive</li>
                        <li>
                          Infringing on intellectual property or copyright
                        </li>
                        <li>
                          Illegal or in violation of applicable academic codes
                        </li>
                      </ul>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mt-3">
                        We may remove content and/or suspend users without
                        notice. ReBooked is not liable for third-party or
                        user-generated content hosted on the Platform.
                      </p>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        10. INTELLECTUAL PROPERTY
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3 sm:mb-4">
                        All content, tools, design elements, software, and
                        branding related to ReBooked Solutions are the property
                        of ReBooked Solutions (Pty) Ltd unless otherwise stated.
                        This includes, but is not limited to:
                      </p>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li>The APS Calculator</li>
                        <li>The ReBooked Campus interface</li>
                        <li>Study materials and guides</li>
                        <li>Custom icons, logos, and user interfaces</li>
                      </ul>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mt-3">
                        No part of the Platform may be copied, distributed,
                        sold, modified, reverse-engineered, or reused without
                        express written permission.
                      </p>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        11. DISCLAIMERS AND LIMITATION OF LIABILITY
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3 sm:mb-4">
                        TO THE MAXIMUM EXTENT PERMITTED UNDER SOUTH AFRICAN LAW:
                      </p>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li>
                          ReBooked Solutions disclaims all warranties, express
                          or implied, including merchantability, title, fitness
                          for purpose, or non-infringement.
                        </li>
                        <li>
                          We are not liable for any losses (direct or indirect),
                          loss of data, opportunity, profit, goodwill, or
                          personal injury caused by use of the Platform.
                        </li>
                        <li>
                          We are not liable for third-party actions, including
                          users, payment providers, couriers, institutions, or
                          advertisers.
                        </li>
                        <li>
                          Use of ReBooked Campus is at your sole risk, and no
                          guarantees are made regarding academic success or
                          institutional acceptance.
                        </li>
                      </ul>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mt-3">
                        ReBooked shall never be liable for damages exceeding the
                        total amount of platform fees earned from the specific
                        transaction in dispute.
                      </p>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        12. INDEMNITY
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3 sm:mb-4">
                        You agree to fully indemnify and hold harmless ReBooked
                        Solutions (Pty) Ltd, its directors, employees, agents,
                        and service providers against any claims, liabilities,
                        damages, losses, fines, legal fees, or costs arising
                        from:
                      </p>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li>Your use or misuse of the Platform</li>
                        <li>Your breach of these Terms</li>
                        <li>Your violation of any third-party rights</li>
                        <li>Your inaccurate or fraudulent content</li>
                        <li>
                          Disputes arising from your transactions, listings, or
                          communications
                        </li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        13. TERMINATION
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3 sm:mb-4">
                        ReBooked may, at its sole discretion and without notice:
                      </p>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li>Suspend or permanently ban your account</li>
                        <li>Remove or block content</li>
                        <li>Deny platform access</li>
                        <li>Pursue civil or criminal action</li>
                      </ul>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mt-3">
                        Termination does not limit our right to recover unpaid
                        fees or enforce indemnity.
                      </p>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        14. GOVERNING LAW AND JURISDICTION
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3 sm:mb-4">
                        These Terms are governed by the laws of the Republic of
                        South Africa. You agree that:
                      </p>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li>
                          Any dispute shall first be submitted to ReBooked's
                          internal dispute resolution process.
                        </li>
                        <li>
                          Unresolved matters may be referred to the Consumer
                          Goods and Services Ombud (CGSO) or the National
                          Consumer Commission.
                        </li>
                        <li>
                          Jurisdiction lies with the courts of South Africa, and
                          all legal notices must be served to the registered
                          address of ReBooked Solutions (Pty) Ltd.
                        </li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        15. AMENDMENTS
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
                        We reserve the right to amend these Terms at any time.
                        Updates will be posted on the Platform, and your
                        continued use after such changes constitutes your
                        acceptance.
                      </p>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        16. CONTACT INFORMATION
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3">
                        For all support, legal, or general inquiries:
                      </p>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-3">
                        <p className="text-blue-800 text-sm sm:text-base">
                          Email:{" "}
                          <span className="break-all">
                            support@rebookedsolutions.co.za
                          </span>
                          <br />
                          ReBooked Solutions (Pty) Ltd – Registered in South
                          Africa
                        </p>
                      </div>
                    </section>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Refund Policy Tab */}
          {activeTab === "refunds" && (
            <div className="space-y-4 sm:space-y-6">
              <Card>
                <CardHeader className="pb-4 sm:pb-6">
                  <CardTitle className="text-xl sm:text-2xl lg:text-3xl flex items-center gap-2 mb-2 sm:mb-3">
                    <FileText className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 flex-shrink-0" />
                    <span>Refund Policy</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 sm:px-6">
                  <div className="prose max-w-none space-y-4 sm:space-y-6">
                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        1.1 Scope and Application
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
                        This Refund Policy applies to all users transacting on
                        www.rebookedsolutions.co.za and governs the
                        circumstances under which refunds may be issued.
                        ReBooked Solutions operates as a digital intermediary
                        between independent sellers and buyers and does not own
                        or control the inventory sold on the platform.
                      </p>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        1.2 Statutory Rights
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
                        In terms of Section 20 and 56 of the Consumer Protection
                        Act, consumers are entitled to return defective goods
                        within six months of delivery if the item is unsafe,
                        fails to perform as intended, or does not meet the
                        description.
                      </p>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        1.3 Platform-Specific Refund Conditions
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3 sm:mb-4">
                        Refunds will be processed only if one of the following
                        conditions is met:
                      </p>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li>
                          The item has not been received within 14 business days
                          of dispatch confirmation.
                        </li>
                        <li>
                          The item delivered materially differs from the
                          listing, including:
                          <ul className="list-disc pl-6 mt-2 space-y-1">
                            <li>
                              Incorrect book (wrong edition, title, or author)
                            </li>
                            <li>
                              Undisclosed major defects (e.g. missing pages,
                              mold, water damage)
                            </li>
                          </ul>
                        </li>
                        <li>
                          The item is counterfeit or an illegal reproduction
                        </li>
                        <li>Fraudulent or deceptive conduct by the seller</li>
                      </ul>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mt-3 mb-3 sm:mb-4">
                        All refund requests must be supported by photographic
                        evidence and a formal complaint lodged within five (5)
                        calendar days of delivery or the estimated delivery
                        date. Submissions must be made to
                        support@rebookedsolutions.co.za. The buyer must retain
                        proof of delivery, shipping labels, and original
                        packaging where applicable.
                      </p>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3 sm:mb-4">
                        Refunds are strictly not applicable in the following
                        cases:
                      </p>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li>
                          Buyer remorse or change of mind (CPA Section 20 does
                          not apply to second-hand goods unless sold by a
                          business)
                        </li>
                        <li>
                          Wear and tear reasonably expected of pre-owned books
                        </li>
                        <li>
                          Delays by couriers beyond the platform's control
                        </li>
                        <li>Items marked "non-refundable" in the listing</li>
                      </ul>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mt-3">
                        ReBooked Solutions will act as an impartial mediator but
                        makes no guarantee of refund unless the above criteria
                        are objectively met and supported with documentation.
                        Final decisions rest with the platform's resolution
                        team.
                      </p>
                    </section>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Cancellation Policy Tab */}
          {activeTab === "cancellation" && (
            <div className="space-y-4 sm:space-y-6">
              <Card>
                <CardHeader className="pb-4 sm:pb-6">
                  <CardTitle className="text-xl sm:text-2xl lg:text-3xl flex items-center gap-2 mb-2 sm:mb-3">
                    <FileText className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 flex-shrink-0" />
                    <span>Cancellation Policy</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 sm:px-6">
                  <div className="prose max-w-none space-y-4 sm:space-y-6">
                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        2.1 Buyer Cancellations
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3 sm:mb-4">
                        Buyers may cancel an order only if it has not yet been
                        marked as "Dispatched" by the seller. Once dispatch has
                        occurred, the buyer must follow the return and refund
                        procedures.
                      </p>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3 sm:mb-4">
                        Cancellations made before dispatch will be processed
                        with full reimbursement to the original payment method
                        within 5–10 business days, excluding delays caused by
                        third-party payment processors. Buyers are responsible
                        for ensuring their payment details are correct.
                      </p>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
                        In terms of the Electronic Communications and
                        Transactions Act, Section 44 does not apply to digital
                        platforms acting as intermediaries and not selling goods
                        directly. Therefore, no automatic 7-day cooling-off
                        period is enforceable unless otherwise stated.
                      </p>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        2.2 Seller Cancellations
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3 sm:mb-4">
                        Sellers may cancel a transaction only under exceptional
                        circumstances, including stock unavailability or listing
                        errors. Cancellations must occur within 48 hours of
                        order receipt, and the seller must notify the buyer via
                        platform messaging and the ReBooked support email.
                      </p>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3 sm:mb-4">
                        Frequent or unjustified cancellations by sellers may
                        result in:
                      </p>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li>Temporary suspension of selling privileges</li>
                        <li>Penalties, including administrative fees</li>
                        <li>
                          Permanent account termination in severe or repeat
                          cases
                        </li>
                      </ul>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mt-3">
                        ReBooked Solutions reserves the right to cancel any
                        order at its sole discretion, especially where fraud,
                        abuse, or system manipulation is detected.
                      </p>
                    </section>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Shipping & Delivery Policy Tab */}
          {activeTab === "shipping" && (
            <div className="space-y-4 sm:space-y-6">
              <Card>
                <CardHeader className="pb-4 sm:pb-6">
                  <CardTitle className="text-xl sm:text-2xl lg:text-3xl flex items-center gap-2 mb-2 sm:mb-3">
                    <FileText className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 flex-shrink-0" />
                    <span>Shipping & Delivery Policy</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 sm:px-6">
                  <div className="prose max-w-none space-y-4 sm:space-y-6">
                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        3.1 Shipping Responsibility
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3 sm:mb-4">
                        Sellers are solely responsible for dispatching and
                        packaging goods sold on the platform. ReBooked Solutions
                        does not handle physical goods and does not accept
                        liability for loss, damage, or delays during shipping.
                      </p>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
                        All orders must be shipped within three (3) business
                        days of payment confirmation. Sellers must use reliable
                        third-party courier services and are encouraged to use
                        traceable methods (e.g. Courier Guy, Pudo, Fastway,
                        Paxi). Failure to dispatch within the required timeframe
                        may result in forced cancellation and refund.
                      </p>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        3.2 Delivery Timeframes
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3 sm:mb-4">
                        Delivery timeframes range between 2 and 7 business days
                        after dispatch, depending on the courier and regional
                        location. ReBooked Solutions does not guarantee any
                        specific delivery timeline.
                      </p>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3 sm:mb-4">
                        In accordance with CPA Section 19(4), if delivery is not
                        made within the agreed timeframe or within 14 business
                        days, and the delay is not due to the buyer, the buyer
                        may:
                      </p>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li>
                          Cancel the transaction and request a full refund
                        </li>
                        <li>Extend the delivery period, at their discretion</li>
                      </ul>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mt-3">
                        All courier-related disputes (e.g., misdelivery, delays,
                        damaged packaging) must be resolved directly with the
                        courier unless seller error is proven.
                      </p>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        3.3 Failed Deliveries and Returns
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3 sm:mb-4">
                        If a parcel is returned due to:
                      </p>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li>An incorrect or incomplete delivery address</li>
                        <li>Buyer's unavailability</li>
                        <li>Failure to collect from pick-up points</li>
                      </ul>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mt-3">
                        Then the buyer may be liable for any redelivery costs.
                        The platform will not issue refunds for failed
                        deliveries unless the seller is at fault.
                      </p>
                    </section>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Return Policy Tab */}
          {activeTab === "returns" && (
            <div className="space-y-4 sm:space-y-6">
              <Card>
                <CardHeader className="pb-4 sm:pb-6">
                  <CardTitle className="text-xl sm:text-2xl lg:text-3xl flex items-center gap-2 mb-2 sm:mb-3">
                    <FileText className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 flex-shrink-0" />
                    <span>Return Policy</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 sm:px-6">
                  <div className="prose max-w-none space-y-4 sm:space-y-6">
                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        4.1 Return Grounds
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3 sm:mb-4">
                        Returns are accepted only in the following cases:
                      </p>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li>
                          Incorrect item delivered (e.g., different title,
                          author, or edition)
                        </li>
                        <li>Severe damage not disclosed in the listing</li>
                        <li>Item deemed counterfeit or illegal reproduction</li>
                      </ul>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mt-3 mb-3 sm:mb-4">
                        Returns must be initiated within five (5) calendar days
                        of receipt. Items returned without prior written
                        approval will not be accepted or refunded.
                      </p>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
                        Buyers must retain all original packaging and use a
                        trackable return method. Return shipping costs are borne
                        by the buyer unless the seller is found to be at fault.
                      </p>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        4.2 Return Exclusions
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3 sm:mb-4">
                        Returns are not allowed in the following instances:
                      </p>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li>Book condition disputes over minor flaws</li>
                        <li>Buyer's personal dissatisfaction after usage</li>
                        <li>Items marked as "non-returnable"</li>
                        <li>
                          Books damaged after delivery due to buyer negligence
                        </li>
                      </ul>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mt-3">
                        Upon successful return and inspection, ReBooked
                        Solutions will process any applicable refund within 5–10
                        business days. Refunds will not include original
                        shipping costs unless otherwise specified.
                      </p>
                    </section>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Dispute Resolution Policy Tab */}
          {activeTab === "disputes" && (
            <div className="space-y-4 sm:space-y-6">
              <Card>
                <CardHeader className="pb-4 sm:pb-6">
                  <CardTitle className="text-xl sm:text-2xl lg:text-3xl flex items-center gap-2 mb-2 sm:mb-3">
                    <FileText className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 flex-shrink-0" />
                    <span>Dispute Resolution Policy</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 sm:px-6">
                  <div className="prose max-w-none space-y-4 sm:space-y-6">
                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        5.1 Dispute Submission
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3 sm:mb-4">
                        Buyers or sellers may raise a formal dispute by
                        submitting an email to support@rebookedsolutions.co.za
                        within seven (7) calendar days of the disputed event.
                      </p>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3 sm:mb-4">
                        The complaint must include:
                      </p>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li>Order number</li>
                        <li>Names of both parties</li>
                        <li>Description of the issue</li>
                        <li>
                          All supporting documentation (photos, tracking,
                          communication)
                        </li>
                      </ul>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mt-3">
                        Failure to provide sufficient evidence may result in
                        dismissal of the dispute without further investigation.
                      </p>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        5.2 Internal Resolution
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3 sm:mb-4">
                        ReBooked Solutions will assess disputes within 7–10
                        business days and may request further evidence from both
                        parties. The platform's decision will be based on:
                      </p>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li>Consumer Protection Act principles of fairness</li>
                        <li>Objective review of evidence</li>
                        <li>Transaction history and user behaviour</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        5.3 Platform Limitation of Liability
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3 sm:mb-4">
                        As per Section 56 of the CPA, remedies for defective
                        goods are enforceable against the seller, not the
                        platform. ReBooked Solutions is a digital facilitator
                        and assumes no liability for:
                      </p>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li>Goods condition, legality, or delivery</li>
                        <li>Buyer or seller conduct</li>
                        <li>Courier issues</li>
                        <li>Consequential losses or damages</li>
                      </ul>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mt-3 mb-3 sm:mb-4">
                        ReBooked Solutions' total liability in any dispute shall
                        not exceed the commission earned on the disputed
                        transaction. Under no circumstances will the platform be
                        liable for:
                      </p>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li>Loss of income or profits</li>
                        <li>Emotional distress</li>
                        <li>Indirect, incidental, or special damages</li>
                      </ul>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mt-3">
                        Users accept that ReBooked Solutions acts only as a
                        venue and not as a contracting party to the sale.
                      </p>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        5.4 External Remedies
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3 sm:mb-4">
                        If either party is dissatisfied with the internal
                        resolution outcome, they may escalate to:
                      </p>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li>The National Consumer Commission (NCC)</li>
                        <li>The Consumer Goods and Services Ombud (CGSO)</li>
                        <li>Formal legal channels under South African law</li>
                      </ul>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mt-3">
                        ReBooked Solutions will comply with all lawful requests
                        but will not be responsible for legal expenses incurred
                        by users.
                      </p>
                    </section>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Contact Section */}
        <Card className="mt-6 sm:mt-8">
          <CardHeader className="pb-4 sm:pb-6">
            <CardTitle className="text-lg sm:text-xl lg:text-2xl flex items-center gap-2">
              <Mail className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
              <span>Contact Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6">
              <p className="text-blue-700 mb-3 sm:mb-4 text-sm sm:text-base">
                All queries, complaints, and policy-related matters must be
                directed to:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <p className="text-blue-700 text-sm sm:text-base">
                    <strong>Email:</strong>{" "}
                    <span className="break-all">
                      support@rebookedsolutions.co.za
                    </span>
                  </p>
                  <p className="text-blue-700 text-sm sm:text-base">
                    <strong>Business Hours:</strong> Monday–Friday, 09:00–17:00
                    (SAST)
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-blue-700 text-sm sm:text-base">
                    <strong>Website:</strong>{" "}
                    <span className="break-all">
                      www.rebookedsolutions.co.za
                    </span>
                  </p>
                  <p className="text-blue-700 text-sm sm:text-base">
                    <strong>Company:</strong> ReBooked Solutions (Pty) Ltd
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Policies;
