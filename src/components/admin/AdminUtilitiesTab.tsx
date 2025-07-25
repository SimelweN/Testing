import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AdminUtilityService,
  BulkDeleteResult,
} from "@/services/admin/adminUtilityService";
import { DatabaseInitService } from "@/services/admin/databaseInitService";
import { clearAllBooks } from "@/utils/clearAllBooks";
import { toast } from "sonner";
import {
  Trash2,
  Database,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  Users,
  BookOpen,
  Lightbulb,
  FileText,
} from "lucide-react";

interface AdminUtilitiesTabProps {
  className?: string;
}

const AdminUtilitiesTab = ({ className }: AdminUtilitiesTabProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
  const [showDeleteDemoDialog, setShowDeleteDemoDialog] = useState(false);
  const [showClearBooksDialog, setShowClearBooksDialog] = useState(false);
  const [lastResult, setLastResult] = useState<BulkDeleteResult | null>(null);
  const [clearBooksResult, setClearBooksResult] = useState<{
    success: boolean;
    message: string;
    deletedCount: number;
  } | null>(null);
  const [dbStats, setDbStats] = useState({
    totalBooks: 0,
    totalUsers: 0,
    totalStudyResources: 0,
    totalStudyTips: 0,
    activeListings: 0,
    soldBooks: 0,
  });
  const [dbStatus, setDbStatus] = useState({
    studyResourcesExists: false,
    studyTipsExists: false,
    allTablesExist: false,
    missingTables: [] as string[],
  });
  const [initResult, setInitResult] = useState<{
    success: boolean;
    message: string;
    tablesCreated: string[];
    errors: string[];
  } | null>(null);

  // Load database statistics
  const loadDatabaseStats = async () => {
    setIsLoading(true);
    try {
      const [stats, status] = await Promise.all([
        AdminUtilityService.getDatabaseStats(),
        DatabaseInitService.getDatabaseStatus(),
      ]);
      setDbStats(stats);
      setDbStatus(status);
    } catch (error) {
      console.error("Error loading database stats:", error);
      toast.error("Failed to load database statistics");
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize database tables
  const handleInitializeDatabase = async () => {
    setIsLoading(true);
    try {
      const result = await DatabaseInitService.initializeDatabase();
      setInitResult(result);

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }

      // Refresh status and stats
      await loadDatabaseStats();
    } catch (error) {
      console.error("Error initializing database:", error);
      toast.error("Failed to initialize database");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle delete all books
  const handleDeleteAllBooks = async () => {
    setIsLoading(true);
    try {
      const result = await AdminUtilityService.deleteAllBooks();
      setLastResult(result);

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }

      // Refresh stats
      await loadDatabaseStats();
    } catch (error) {
      console.error(
        "Error deleting all books:",
        error instanceof Error ? error.message : String(error),
      );
      toast.error("Failed to delete books");
    } finally {
      setIsLoading(false);
      setShowDeleteAllDialog(false);
    }
  };

  // Handle delete demo books (immediate action)
  const handleDeleteDemoBooks = async () => {
    setIsLoading(true);
    try {
      const result = await AdminUtilityService.deleteDemoBooks();
      setLastResult(result);

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }

      // Refresh stats
      await loadDatabaseStats();
    } catch (error) {
      console.error(
        "Error deleting demo books:",
        error instanceof Error ? error.message : String(error),
      );
      toast.error("Failed to delete demo books");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle delete demo books (with confirmation dialog)
  const handleDeleteDemoBooksConfirm = async () => {
    setIsLoading(true);
    try {
      const result = await AdminUtilityService.deleteDemoBooks();
      setLastResult(result);

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }

      // Refresh stats
      await loadDatabaseStats();
    } catch (error) {
      console.error(
        "Error deleting demo books:",
        error instanceof Error ? error.message : String(error),
      );
      toast.error("Failed to delete demo books");
    } finally {
      setIsLoading(false);
      setShowDeleteDemoDialog(false);
    }
  };

  // Handle clear all books
  const handleClearAllBooks = async () => {
    setIsLoading(true);
    try {
      const result = await clearAllBooks();
      setClearBooksResult(result);

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }

      // Refresh stats
      await loadDatabaseStats();
    } catch (error) {
      console.error(
        "Error clearing all books:",
        error instanceof Error ? error.message : String(error),
      );
      toast.error("Failed to clear all books");
    } finally {
      setIsLoading(false);
      setShowClearBooksDialog(false);
    }
  };

  // Load stats on component mount
  useEffect(() => {
    loadDatabaseStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Admin Utilities</h2>
          <p className="text-gray-600">
            Bulk operations and database management tools
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => setShowClearBooksDialog(true)}
            disabled={isLoading}
            variant="destructive"
            size="sm"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Clear All Books
          </Button>
          <Button
            onClick={handleDeleteDemoBooks}
            disabled={isLoading}
            variant="destructive"
            size="sm"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Delete Demo Books Now
          </Button>
          <Button
            onClick={loadDatabaseStats}
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Database className="h-4 w-4 mr-2" />
            )}
            Refresh Stats
          </Button>
                </div>
      </div>

      {/* Database Diagnostics */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700">
            <Database className="h-5 w-5" />
            Database Diagnostics
          </CardTitle>
          <CardDescription>
            System health and connectivity status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-blue-700">
            <p>Database diagnostics available through system utilities</p>
          </div>
        </CardContent>
      </Card>

      {/* Database Status */}
      <Card
        className={
          !dbStatus.allTablesExist
            ? "border-yellow-200 bg-yellow-50"
            : "border-green-200 bg-green-50"
        }
      >
        <CardHeader>
          <CardTitle
            className={`flex items-center gap-2 ${!dbStatus.allTablesExist ? "text-yellow-700" : "text-green-700"}`}
          >
            <Database className="h-5 w-5" />
            Database Status
          </CardTitle>
          <CardDescription>
            {dbStatus.allTablesExist
              ? "All required database tables are available"
              : `Missing tables: ${dbStatus.missingTables.join(", ")}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span className="font-medium">Study Resources Table</span>
                <div className="flex items-center gap-2">
                  {dbStatus.studyResourcesExists ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <span
                    className={`text-sm ${dbStatus.studyResourcesExists ? "text-green-700" : "text-red-700"}`}
                  >
                    {dbStatus.studyResourcesExists ? "Exists" : "Missing"}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span className="font-medium">Study Tips Table</span>
                <div className="flex items-center gap-2">
                  {dbStatus.studyTipsExists ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <span
                    className={`text-sm ${dbStatus.studyTipsExists ? "text-green-700" : "text-red-700"}`}
                  >
                    {dbStatus.studyTipsExists ? "Exists" : "Missing"}
                  </span>
                </div>
              </div>
            </div>

            {!dbStatus.allTablesExist && (
              <div className="p-4 bg-yellow-100 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <h4 className="font-medium text-yellow-800">
                    Database Setup Required
                  </h4>
                </div>
                <p className="text-sm text-yellow-700 mb-4">
                  The study resources and tips features require database tables
                  that are currently missing. Please run the SQL script manually
                  in your Supabase dashboard.
                </p>
                <div className="space-y-3">
                  <div className="p-3 bg-white border border-yellow-300 rounded text-xs">
                    <p className="font-medium text-gray-800 mb-2">
                      Manual Setup Instructions:
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-gray-700">
                      <li>Go to your Supabase project dashboard</li>
                      <li>Open the SQL Editor</li>
                      <li>
                        Copy and paste the SQL from{" "}
                        <code>database_setup.sql</code>
                      </li>
                      <li>Run the script</li>
                      <li>Refresh this page</li>
                    </ol>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleInitializeDatabase}
                      disabled={isLoading}
                      variant="outline"
                      size="sm"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Database className="h-4 w-4 mr-2" />
                      )}
                      Try Auto-Setup
                    </Button>
                    <Button
                      onClick={loadDatabaseStats}
                      disabled={isLoading}
                      variant="outline"
                      size="sm"
                    >
                      <Database className="h-4 w-4 mr-2" />
                      Check Again
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Database Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Statistics
          </CardTitle>
          <CardDescription>
            Current database metrics and content overview
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <BookOpen className="h-6 w-6 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-900">
                {dbStats.totalBooks}
              </div>
              <div className="text-sm text-blue-700">Total Books</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-900">
                {dbStats.activeListings}
              </div>
              <div className="text-sm text-green-700">Active Listings</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <XCircle className="h-6 w-6 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-900">
                {dbStats.soldBooks}
              </div>
              <div className="text-sm text-purple-700">Sold Books</div>
            </div>
            <div className="text-center p-4 bg-indigo-50 rounded-lg">
              <Users className="h-6 w-6 text-indigo-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-indigo-900">
                {dbStats.totalUsers}
              </div>
              <div className="text-sm text-indigo-700">Total Users</div>
            </div>
            <div className="text-center p-4 bg-amber-50 rounded-lg">
              <Lightbulb className="h-6 w-6 text-amber-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-amber-900">
                {dbStats.totalStudyTips}
              </div>
              <div className="text-sm text-amber-700">Study Tips</div>
            </div>
            <div className="text-center p-4 bg-rose-50 rounded-lg">
              <FileText className="h-6 w-6 text-rose-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-rose-900">
                {dbStats.totalStudyResources}
              </div>
              <div className="text-sm text-rose-700">Resources</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Database Initialization Result */}
      {initResult && (
        <Card
          className={
            initResult.success
              ? "border-green-200 bg-green-50"
              : "border-red-200 bg-red-50"
          }
        >
          <CardHeader>
            <CardTitle
              className={`flex items-center gap-2 ${initResult.success ? "text-green-700" : "text-red-700"}`}
            >
              {initResult.success ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <XCircle className="h-5 w-5" />
              )}
              Database Initialization Result
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p
                className={
                  initResult.success ? "text-green-800" : "text-red-800"
                }
              >
                {initResult.message}
              </p>
              {initResult.tablesCreated.length > 0 && (
                <p className="text-sm text-gray-600">
                  Tables created:{" "}
                  <Badge variant="outline">
                    {initResult.tablesCreated.join(", ")}
                  </Badge>
                </p>
              )}
              {initResult.errors && initResult.errors.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-red-700 font-medium">Errors:</p>
                  <ul className="list-disc list-inside text-sm text-red-600 space-y-1">
                    {initResult.errors.map((error: string, index: number) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bulk Operations */}
      <Card className="border-2 border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="h-5 w-5" />
            Dangerous Operations
          </CardTitle>
          <CardDescription>
            These operations cannot be undone. Use with extreme caution.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Delete Demo Books */}
            <div className="border border-orange-200 rounded-lg p-4 bg-orange-50">
              <div className="flex items-center gap-2 mb-2">
                <Trash2 className="h-5 w-5 text-orange-600" />
                <h3 className="font-semibold text-orange-900">
                  Delete Demo Books
                </h3>
              </div>
              <p className="text-sm text-orange-700 mb-4">
                Remove all books with "test", "demo", "sample", or similar
                keywords in the title. This is safer than deleting all books.
              </p>
              <Button
                onClick={() => setShowDeleteDemoDialog(true)}
                disabled={isLoading}
                variant="outline"
                className="w-full border-orange-300 text-orange-700 hover:bg-orange-100"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Demo Books (Confirm)
              </Button>
            </div>

            {/* Delete All Books */}
            <div className="border border-red-200 rounded-lg p-4 bg-red-50">
              <div className="flex items-center gap-2 mb-2">
                <Trash2 className="h-5 w-5 text-red-600" />
                <h3 className="font-semibold text-red-900">Delete All Books</h3>
              </div>
              <p className="text-sm text-red-700 mb-4">
                Permanently delete ALL books from the database. This will remove
                all listings, sold books, and user-generated content. USE WITH
                EXTREME CAUTION.
              </p>
              <Button
                onClick={() => setShowDeleteAllDialog(true)}
                disabled={isLoading}
                variant="destructive"
                className="w-full"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete All Books
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Last Operation Result */}
      {lastResult && (
        <Card
          className={
            lastResult.success
              ? "border-green-200 bg-green-50"
              : "border-red-200 bg-red-50"
          }
        >
          <CardHeader>
            <CardTitle
              className={`flex items-center gap-2 ${lastResult.success ? "text-green-700" : "text-red-700"}`}
            >
              {lastResult.success ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <XCircle className="h-5 w-5" />
              )}
              Last Operation Result
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p
                className={
                  lastResult.success ? "text-green-800" : "text-red-800"
                }
              >
                {lastResult.message}
              </p>
              {lastResult.deletedCount > 0 && (
                <p className="text-sm text-gray-600">
                  Items deleted:{" "}
                  <Badge variant="outline">{lastResult.deletedCount}</Badge>
                </p>
              )}
              {lastResult.errors && lastResult.errors.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-red-700 font-medium">Errors:</p>
                  <ul className="list-disc list-inside text-sm text-red-600 space-y-1">
                    {lastResult.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete All Books Confirmation Dialog */}
      <Dialog open={showDeleteAllDialog} onOpenChange={setShowDeleteAllDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              Delete All Books
            </DialogTitle>
            <DialogDescription>
              <div className="space-y-3 mt-2">
                <p className="font-medium text-red-600">
                  This will permanently delete ALL {dbStats.totalBooks} books
                  from the database.
                </p>
                <div className="bg-red-100 p-3 rounded-lg">
                  <ul className="text-sm text-red-800 space-y-1">
                    <li>• All book listings will be removed</li>
                    <li>• All sold book records will be deleted</li>
                    <li>• User purchase history will be affected</li>
                    <li>• This action cannot be undone</li>
                  </ul>
                </div>
                <p className="text-sm text-gray-600">
                  Type{" "}
                  <code className="bg-gray-200 px-1 rounded">
                    CONFIRM DELETE
                  </code>{" "}
                  to proceed.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteAllDialog(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAllBooks}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete All Books
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Demo Books Confirmation Dialog */}
      <Dialog
        open={showDeleteDemoDialog}
        onOpenChange={setShowDeleteDemoDialog}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-700">
              <AlertTriangle className="h-5 w-5" />
              Delete Demo Books
            </DialogTitle>
            <DialogDescription>
              <div className="space-y-3 mt-2">
                <p>
                  This will delete all books with demo/test keywords in their
                  titles.
                </p>
                <div className="bg-orange-100 p-3 rounded-lg">
                  <p className="text-sm text-orange-800 font-medium mb-2">
                    Books matching these patterns will be deleted:
                  </p>
                  <ul className="text-sm text-orange-700 space-y-1">
                    <li>• Titles containing "test"</li>
                    <li>• Titles containing "demo"</li>
                    <li>• Titles containing "sample"</li>
                    <li>• Titles containing "example"</li>
                    <li>• Titles containing "placeholder"</li>
                  </ul>
                </div>
                <p className="text-sm text-gray-600">
                  This is safer than deleting all books but still cannot be
                  undone.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDemoDialog(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteDemoBooksConfirm}
              disabled={isLoading}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete Demo Books
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear All Books Confirmation Dialog */}
      <Dialog
        open={showClearBooksDialog}
        onOpenChange={setShowClearBooksDialog}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              Clear All Books
            </DialogTitle>
            <DialogDescription>
              <div className="space-y-3 mt-2">
                <p className="font-medium text-red-600">
                  This will permanently remove ALL {dbStats.totalBooks} books
                  from the Browse Books section.
                </p>
                <div className="bg-red-100 p-3 rounded-lg">
                  <ul className="text-sm text-red-800 space-y-1">
                    <li>• All book listings will be removed</li>
                    <li>• Users will no longer see any books to purchase</li>
                    <li>• This action cannot be undone</li>
                    <li>• The Browse Books section will be empty</li>
                  </ul>
                </div>
                <p className="text-sm text-gray-600">
                  This action is requested to clear the Browse Books section
                  completely.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowClearBooksDialog(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleClearAllBooks}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Clear All Books
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear Books Result */}
      {clearBooksResult && (
        <Card
          className={
            clearBooksResult.success
              ? "border-green-200 bg-green-50"
              : "border-red-200 bg-red-50"
          }
        >
          <CardHeader>
            <CardTitle
              className={`flex items-center gap-2 ${clearBooksResult.success ? "text-green-700" : "text-red-700"}`}
            >
              {clearBooksResult.success ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <XCircle className="h-5 w-5" />
              )}
              Clear Books Result
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p
                className={
                  clearBooksResult.success ? "text-green-800" : "text-red-800"
                }
              >
                {clearBooksResult.message}
              </p>
              {clearBooksResult.deletedCount > 0 && (
                <p className="text-sm text-gray-600">
                  Books deleted:{" "}
                  <Badge variant="outline">
                    {clearBooksResult.deletedCount}
                  </Badge>
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminUtilitiesTab;
