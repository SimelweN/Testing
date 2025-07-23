import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface DatabaseStats {
  totalBooks: number;
  unsoldBooks: number;
  soldBooks: number;
  recentBooks: Array<{
    id: string;
    title: string;
    sold: boolean;
    created_at: string;
  }>;
  error?: string;
}

export const DatabaseDebugger = () => {
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const testDatabase = async () => {
    setIsLoading(true);
    try {
      console.log("🔍 Testing database for real books...");
      
      // Get ALL books (including sold ones)
      const { data: allBooks, error } = await supabase
        .from("books")
        .select("id, title, sold, created_at")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) {
        console.error("❌ Database error:", error);
        setStats({ 
          totalBooks: 0, 
          unsoldBooks: 0, 
          soldBooks: 0, 
          recentBooks: [],
          error: error.message 
        });
        return;
      }

      const totalBooks = allBooks?.length || 0;
      const unsoldBooks = allBooks?.filter(book => !book.sold).length || 0;
      const soldBooks = allBooks?.filter(book => book.sold).length || 0;
      const recentBooks = allBooks?.slice(0, 10) || [];

      console.log(`📊 Found ${totalBooks} total books (${unsoldBooks} available, ${soldBooks} sold)`);
      
      if (recentBooks.length > 0) {
        console.log("📚 Recent books:");
        recentBooks.forEach((book, i) => {
          console.log(`  ${i+1}. "${book.title}" (${book.sold ? 'SOLD' : 'AVAILABLE'})`);
        });
      }

      setStats({
        totalBooks,
        unsoldBooks,
        soldBooks,
        recentBooks
      });

    } catch (error) {
      console.error("❌ Exception testing database:", error);
      setStats({
        totalBooks: 0,
        unsoldBooks: 0,
        soldBooks: 0,
        recentBooks: [],
        error: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    testDatabase();
  }, []);

  if (!stats && isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="text-center">Testing database connection...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full mb-6 border-red-200 bg-red-50">
      <CardHeader>
        <CardTitle className="text-red-800">🔍 Database Debug Information</CardTitle>
      </CardHeader>
      <CardContent>
        {stats?.error ? (
          <div className="text-red-600">
            <strong>Error:</strong> {stats.error}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-white p-3 rounded">
                <div className="text-2xl font-bold text-blue-600">{stats?.totalBooks || 0}</div>
                <div className="text-sm text-gray-600">Total Books</div>
              </div>
              <div className="bg-white p-3 rounded">
                <div className="text-2xl font-bold text-green-600">{stats?.unsoldBooks || 0}</div>
                <div className="text-sm text-gray-600">Available</div>
              </div>
              <div className="bg-white p-3 rounded">
                <div className="text-2xl font-bold text-orange-600">{stats?.soldBooks || 0}</div>
                <div className="text-sm text-gray-600">Sold</div>
              </div>
            </div>
            
            {stats?.recentBooks && stats.recentBooks.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Recent Books in Database:</h4>
                <div className="bg-white p-3 rounded max-h-40 overflow-y-auto">
                  {stats.recentBooks.map((book, i) => (
                    <div key={book.id} className="text-sm py-1 border-b last:border-b-0">
                      <span className="font-medium">{i+1}. {book.title}</span>
                      <span className={`ml-2 px-2 py-1 rounded text-xs ${
                        book.sold ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {book.sold ? 'SOLD' : 'AVAILABLE'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        <Button 
          onClick={testDatabase} 
          disabled={isLoading}
          className="mt-4"
          variant="outline"
        >
          {isLoading ? "Testing..." : "Refresh Database Test"}
        </Button>
      </CardContent>
    </Card>
  );
};
