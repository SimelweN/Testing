import { toast } from "sonner";

export const copyEmailToClipboard = async (email: string): Promise<void> => {
  try {
    await navigator.clipboard.writeText(email);
    toast.success("Email address copied to clipboard");
  } catch (error) {
    // Fallback for older browsers
    const textArea = document.createElement("textarea");
    textArea.value = email;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      document.execCommand("copy");
      toast.success("Email address copied to clipboard");
    } catch (fallbackError) {
      console.error("Fallback copy failed:", fallbackError);
      toast.error("Failed to copy email address");
    } finally {
      document.body.removeChild(textArea);
    }
  }
};
