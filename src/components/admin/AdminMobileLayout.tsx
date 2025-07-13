import { ReactNode } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

interface AdminMobileLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

const AdminMobileLayout = ({
  children,
  title,
  description,
}: AdminMobileLayoutProps) => {
  const isMobile = useIsMobile();

  if (!isMobile) {
    return <>{children}</>;
  }

  return (
    <div className="admin-mobile min-h-screen">
      {title && (
        <div className="bg-white border-b border-gray-200 p-4">
          <h1 className="text-lg font-semibold text-gray-900 truncate">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-gray-600 mt-1 truncate">{description}</p>
          )}
        </div>
      )}
      <div className="p-4 space-y-4">{children}</div>
    </div>
  );
};

export default AdminMobileLayout;
