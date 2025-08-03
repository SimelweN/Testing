import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const FAQ = () => {
  const faqs = [
    {
      question: "What is ReBooked Solutions?",
      answer: "ReBooked Solutions is a South African platform where students, parents, and educators can buy and sell pre-owned academic books safely and affordably. We also offer bursary tools, study resources, and more via ReBooked Campus."
    },
    {
      question: "How do I buy a book?",
      answer: "Click \"Buy Now\" on the book you want, make a secure payment, and wait for the seller to confirm the sale. If they don't confirm within 48 hours, you'll be refunded automatically."
    },
    {
      question: "How do I sell a book?",
      answer: "Create a free account, upload your book's details, set a price, and publish. Once someone clicks \"Buy Now\", you'll be notified to confirm the sale within 48 hours."
    },
    {
      question: "What happens if a seller doesn't confirm the sale?",
      answer: "If the seller does not respond within 48 hours of a buyer clicking \"Buy Now\", ReBooked automatically cancels the order and the buyer is fully refunded."
    },
    {
      question: "How are books delivered?",
      answer: "We partner with The Courier Guy to handle deliveries. Once the seller confirms the sale, shipping is arranged and tracking is provided."
    },
    {
      question: "Can I track my delivery?",
      answer: "Yes. As soon as shipping is booked with Courier Guy, a tracking link will be sent to your email and visible in your dashboard."
    },
    {
      question: "Is ReBooked Solutions safe to use?",
      answer: "Absolutely. All payments are processed securely through Paystack, and sellers only receive funds after confirming the sale. Your safety is our priority."
    },
    {
      question: "What kinds of books can I list?",
      answer: "We accept academic, school, and university-level books, as well as exam prep guides and study material. Books must be genuine and in good condition."
    },
    {
      question: "Do I need to pay to list a book?",
      answer: "No. Listing is completely free. We only charge a 10% service fee on completed sales, which is included in the price buyers see."
    },
    {
      question: "What is ReBooked Campus?",
      answer: "ReBooked Campus is our student resource hub offering bursary listings, university info, APS calculators, blog articles, and more — all free and tailored for South African students."
    },
    {
      question: "Can I remove or change my book listing?",
      answer: "Yes. Log in to your dashboard to update, pause, or delete any of your active book listings."
    },
    {
      question: "How do I get in touch with support?",
      answer: "You can email us at support@rebookedsolutions.co.za or use the support form on our website."
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
