import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { BookOpen, RefreshCw, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const RestoreBooks: React.FC = () => {
  const { user } = useAuth();
  const [isRestoring, setIsRestoring] = useState(false);

  const sampleBooks = [
    {
      title: "Introduction to Computer Science",
      author: "John Smith",
      isbn: "978-0134444321",
      description: "Comprehensive introduction to computer science fundamentals including programming, algorithms, and data structures.",
      price: 350,
      condition: "Good",
      subject: "Computer Science",
      university: "University of Cape Town",
      course_code: "CSC1015F",
      edition: "3rd Edition",
      category: "Textbook"
    },
    {
      title: "Calculus: Early Transcendentals",
      author: "James Stewart",
      isbn: "978-1285741550",
      description: "Essential calculus textbook covering limits, derivatives, integrals, and applications.",
      price: 420,
      condition: "Very Good",
      subject: "Mathematics",
      university: "University of the Witwatersrand",
      course_code: "MATH101",
      edition: "8th Edition",
      category: "Textbook"
    },
    {
      title: "Principles of Economics",
      author: "N. Gregory Mankiw",
      isbn: "978-1305585126",
      description: "Introduction to economic principles including microeconomics and macroeconomics.",
      price: 380,
      condition: "Fair",
      subject: "Economics",
      university: "Stellenbosch University",
      course_code: "ECO111",
      edition: "7th Edition",
      category: "Textbook"
    },
    {
      title: "General Chemistry",
      author: "Petrucci, Harwood, Herring",
      isbn: "978-0132931281",
      description: "Comprehensive general chemistry textbook with problem-solving approach.",
      price: 450,
      condition: "Good",
      subject: "Chemistry",
      university: "University of Pretoria",
      course_code: "CHM171",
      edition: "11th Edition",
      category: "Textbook"
    },
    {
      title: "Campbell Biology",
      author: "Jane B. Reece, Lisa A. Urry",
      isbn: "978-0134093413",
      description: "Leading biology textbook covering molecular biology, genetics, evolution, and ecology.",
      price: 520,
      condition: "Very Good",
      subject: "Biology",
      university: "Rhodes University",
      course_code: "BIO111",
      edition: "11th Edition",
      category: "Textbook"
    },
    {
      title: "Physics for Scientists and Engineers",
      author: "Raymond A. Serway",
      isbn: "978-1337553278",
      description: "Comprehensive physics textbook covering mechanics, thermodynamics, and electromagnetism.",
      price: 480,
      condition: "Good",
      subject: "Physics",
      university: "University of KwaZulu-Natal",
      course_code: "PHYS130",
      edition: "10th Edition",
      category: "Textbook"
    },
    {
      title: "Constitutional Law of South Africa",
      author: "Matthew Chaskalson",
      isbn: "978-0409053524",
      description: "Comprehensive guide to South African constitutional law and legal principles.",
      price: 650,
      condition: "Excellent",
      subject: "Law",
      university: "University of Cape Town",
      course_code: "LAW1004F",
      edition: "2nd Edition",
      category: "Textbook"
    },
    {
      title: "Financial Accounting: An Introduction",
      author: "Jacqui Kew",
      isbn: "978-0702172564",
      description: "Introduction to financial accounting principles and practices in South African context.",
      price: 390,
      condition: "Good",
      subject: "Accounting",
      university: "University of the Witwatersrand",
      course_code: "ACCN1011",
      edition: "6th Edition",
      category: "Textbook"
    }
  ];

  const restoreBooks = async () => {
    if (!user) {
      toast.error('Please log in to restore books');
      return;
    }

    setIsRestoring(true);
    
    try {
      const promises = sampleBooks.map(book => 
        supabase.from('books').insert({
          ...book,
          seller_id: user.id,
          sold: false,
          verified: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      );

      const results = await Promise.allSettled(promises);
      const successful = results.filter(result => result.status === 'fulfilled').length;
      const failed = results.filter(result => result.status === 'rejected').length;

      if (successful > 0) {
        toast.success(`Successfully restored ${successful} books to the marketplace!`);
        
        // Redirect to books page after a delay
        setTimeout(() => {
          window.location.href = '/books';
        }, 2000);
      }
      
      if (failed > 0) {
        toast.warning(`${failed} books failed to restore`);
      }
      
    } catch (error) {
      console.error('Error restoring books:', error);
      toast.error('Failed to restore books');
    } finally {
      setIsRestoring(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto p-6 max-w-md">
        <Alert>
          <AlertDescription>
            Please log in to restore books to the marketplace.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Restore Sample Books
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              This will add {sampleBooks.length} sample textbooks back to the marketplace. 
              All books will be listed under your account as the seller.
            </AlertDescription>
          </Alert>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Books to be restored:</h4>
            <ul className="text-sm space-y-1">
              {sampleBooks.slice(0, 5).map((book, index) => (
                <li key={index} className="flex justify-between">
                  <span>{book.title}</span>
                  <span className="text-gray-600">R{book.price}</span>
                </li>
              ))}
              <li className="text-gray-500 italic">...and {sampleBooks.length - 5} more books</li>
            </ul>
          </div>
          
          <Button 
            onClick={restoreBooks}
            disabled={isRestoring}
            className="w-full"
          >
            {isRestoring ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Restoring Books...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Restore {sampleBooks.length} Sample Books
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default RestoreBooks;
