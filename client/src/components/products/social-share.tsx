import { useState } from "react";
import { 
  Facebook, 
  Twitter, 
  Linkedin, 
  Mail, 
  Link as LinkIcon, 
  ShareIcon,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";

interface SocialShareProps {
  productName: string;
  productDescription: string;
  productUrl: string;
  imageUrl: string;
}

export function SocialShare({ 
  productName, 
  productDescription, 
  productUrl, 
  imageUrl 
}: SocialShareProps) {
  const [copied, setCopied] = useState(false);
  
  // Encode for URL
  const encodedName = encodeURIComponent(productName);
  const encodedUrl = encodeURIComponent(productUrl);
  const shortDescription = encodeURIComponent(
    productDescription.length > 100 
      ? productDescription.substring(0, 97) + "..." 
      : productDescription
  );

  // Social sharing URLs
  const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
  const twitterShareUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${shortDescription}`;
  const linkedinShareUrl = `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedName}&summary=${shortDescription}`;
  const emailShareUrl = `mailto:?subject=${encodedName}&body=${shortDescription}%0A%0A${encodedUrl}`;

  // Handle copy to clipboard
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(productUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link: ", err);
    }
  };

  // Handle share button click to open in new window
  const handleShare = (url: string) => {
    window.open(url, "_blank", "width=600,height=400");
  };

  return (
    <div className="flex flex-col space-y-3">
      <div className="flex items-center mb-1">
        <ShareIcon className="mr-2 h-4 w-4" />
        <span className="text-sm font-medium">Share this piece</span>
      </div>
      
      <div className="flex flex-wrap gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-full p-2 h-9 w-9"
                onClick={() => handleShare(facebookShareUrl)}
              >
                <Facebook className="h-4 w-4" />
                <span className="sr-only">Share on Facebook</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Share on Facebook</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-full p-2 h-9 w-9"
                onClick={() => handleShare(twitterShareUrl)}
              >
                <Twitter className="h-4 w-4" />
                <span className="sr-only">Share on Twitter</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Share on Twitter</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-full p-2 h-9 w-9"
                onClick={() => handleShare(linkedinShareUrl)}
              >
                <Linkedin className="h-4 w-4" />
                <span className="sr-only">Share on LinkedIn</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Share on LinkedIn</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-full p-2 h-9 w-9"
                onClick={() => window.location.href = emailShareUrl}
              >
                <Mail className="h-4 w-4" />
                <span className="sr-only">Share via Email</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Share via Email</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-full p-2 h-9 w-9"
                onClick={handleCopyLink}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <LinkIcon className="h-4 w-4" />
                )}
                <span className="sr-only">Copy Link</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{copied ? "Link Copied!" : "Copy Link"}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}