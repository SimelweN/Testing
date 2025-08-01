import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const FAQ = () => {
  const faqs = [
    {
      question: "How do I sell my textbooks on ReBooked Marketplace?",
      answer: "Simply create an account, click 'Sell a Book', fill in the details about your textbook including photos, condition, and price. Your listing will be live immediately for buyers to see."
    },
    {
      question: "What commission does ReBooked Marketplace charge?",
      answer: "ReBooked Marketplace charges a 10% commission on completed sales. This means if you sell a book for R100, you'll receive R90 and ReBooked Marketplace keeps R10 to maintain the platform."
    },
    {
      question: "How do I get paid when I sell a book?",
      answer: "Once a buyer purchases your book and the transaction is completed, you'll receive 90% of the sale price. Payment details and methods will be provided in your account dashboard."
    },
    {
      question: "What condition should my textbook be in?",
      answer: "We accept textbooks in various conditions from 'New' to 'Below Average'. Be honest about the condition and include clear photos. Books with excessive damage, missing pages, or illegible text may not be suitable for sale."
    },
    {
      question: "How do I contact a seller or buyer?",
      answer: "You can message other users through our secure messaging system. Go to the book listing and click 'Contact Seller' or check your notifications for buyer messages."
    },
    {
      question: "What if there's a problem with my purchase?",
      answer: "If you experience any issues with a purchase, please contact the seller first to resolve the matter. If that doesn't work, you can report the issue through our support system."
    },
    {
      question: "Can I edit my book listing after posting?",
      answer: "Currently, you cannot edit listings after they're posted. If you need to make changes, you'll need to remove the listing and create a new one with the correct information."
    },
    {
      question: "How long do listings stay active?",
      answer: "Listings remain active until the book is sold or you manually remove them. We recommend keeping your listings up to date and removing books that are no longer available."
    },
    {
      question: "What types of books can I sell?",
      answer: "You can sell textbooks for both school (Grade 1-12) and university levels. We accept books in various subjects including science, mathematics, literature, and more."
    },
    {
      question: "Is my personal information safe?",
      answer: "Yes, we take privacy seriously. We only share necessary contact information between buyers and sellers for transaction purposes. Please review our Privacy Policy for full details."
    },
    {
      question: "What payment methods do you accept?",
      answer: "Payment methods and arrangements are typically handled between buyers and sellers. We recommend using secure payment methods and meeting in safe, public locations for exchanges."
    },
    {
      question: "Can I sell books that aren't textbooks?",
      answer: "ReBooked Marketplace is specifically designed for textbooks and educational materials. We focus on school and university textbooks to provide the best experience for students."
    }
  ];

  return (
    <Layout>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <Card className="max-w-4xl mx-auto w-full">
          <CardHeader className="text-center px-4 sm:px-6">
            <CardTitle className="text-2xl sm:text-3xl font-bold text-book-800">Frequently Asked Questions</CardTitle>
            <p className="text-gray-600 mt-2 text-sm sm:text-base">
              Find answers to common questions about using ReBooked Solutions
            </p>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <Accordion type="single" collapsible className="w-full space-y-2 sm:space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="border border-gray-200 rounded-lg px-3 sm:px-4 overflow-hidden">
                  <AccordionTrigger className="text-left hover:no-underline py-3 sm:py-4 min-h-[44px] [&>svg]:w-4 [&>svg]:h-4 [&>svg]:shrink-0 [&>svg]:ml-2 flex justify-between items-start gap-2 w-full">
                    <span className="font-medium text-book-800 text-sm sm:text-base break-words hyphens-auto leading-tight flex-1 min-w-0 max-w-full overflow-hidden text-ellipsis">{faq.question}</span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-3 sm:pb-4">
                    <p className="text-gray-700 leading-relaxed text-sm sm:text-base">{faq.answer}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            <div className="mt-8 sm:mt-12 text-center p-4 sm:p-6 bg-book-50 rounded-lg border border-book-200">
              <h3 className="text-lg sm:text-xl font-semibold text-book-800 mb-2">Still have questions?</h3>
              <p className="text-gray-600 mb-4 text-sm sm:text-base">
                If you couldn't find the answer you're looking for, feel free to contact our support team.
              </p>
              <Link to="/contact">
                <Button className="bg-book-600 hover:bg-book-700 min-h-[44px] px-4 py-2">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  <span className="text-sm sm:text-base">Contact Support</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default FAQ;
