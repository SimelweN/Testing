import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface ReportFiltersProps {
  activeTab: "pending" | "resolved" | "dismissed" | "suspended" | "all";
  onTabChange: (
    tab: "pending" | "resolved" | "dismissed" | "suspended" | "all",
  ) => void;
  isMobile?: boolean;
}

const ReportFilters = ({
  activeTab,
  onTabChange,
  isMobile = false,
}: ReportFiltersProps) => {
  const handleTabChange = (value: string) => {
    onTabChange(
      value as "pending" | "resolved" | "dismissed" | "suspended" | "all",
    );
  };

  if (isMobile) {
    return (
      <div className="space-y-3">
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3 h-auto gap-1 p-1">
            <TabsTrigger value="pending" className="text-xs px-2 py-2 relative">
              Pending
            </TabsTrigger>
            <TabsTrigger value="resolved" className="text-xs px-2 py-2">
              Resolved
            </TabsTrigger>
            <TabsTrigger value="dismissed" className="text-xs px-2 py-2">
              Dismissed
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 h-auto gap-1 p-1">
            <TabsTrigger value="suspended" className="text-xs px-2 py-2">
              Suspended
            </TabsTrigger>
            <TabsTrigger value="all" className="text-xs px-2 py-2">
              All Reports
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    );
  }

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-5 h-auto">
        <TabsTrigger value="pending" className="relative">
          Pending Reports
        </TabsTrigger>
        <TabsTrigger value="resolved">Resolved</TabsTrigger>
        <TabsTrigger value="dismissed">Dismissed</TabsTrigger>
        <TabsTrigger value="suspended">Suspended Users</TabsTrigger>
        <TabsTrigger value="all">All Reports</TabsTrigger>
      </TabsList>
    </Tabs>
  );
};

export default ReportFilters;
