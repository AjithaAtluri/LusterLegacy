import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Helmet } from "react-helmet";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function VerifyEmailPage() {
  const [isVerifying, setIsVerifying] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // Get the token from the URL
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        
        if (!token) {
          setErrorMessage("Verification token is missing");
          setIsVerifying(false);
          return;
        }
        
        // Call the verification API
        const response = await fetch(`/api/verify-email?token=${token}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Verification failed");
        }
        
        // Verification successful
        setIsSuccess(true);
        toast({
          title: "Email Verified",
          description: "Your email has been successfully verified.",
          variant: "default",
        });
      } catch (error) {
        console.error("Verification error:", error);
        setErrorMessage(error.message || "Email verification failed");
      } finally {
        setIsVerifying(false);
      }
    };
    
    verifyEmail();
  }, [toast]);
  
  return (
    <>
      <Helmet>
        <title>Email Verification | Luster Legacy</title>
        <meta name="description" content="Verify your email address for your Luster Legacy account" />
      </Helmet>
      
      <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-200px)] py-12">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">Email Verification</CardTitle>
            <CardDescription>
              Verifying your email address for your Luster Legacy account
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {isVerifying ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
                <p className="text-center text-muted-foreground">Verifying your email address...</p>
              </div>
            ) : isSuccess ? (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-medium mb-2">Verification Complete</h3>
                <p className="text-center text-muted-foreground mb-4">
                  Your email has been successfully verified. You can now enjoy all features of your Luster Legacy account.
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                  <AlertCircle className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="text-xl font-medium mb-2">Verification Failed</h3>
                <p className="text-center text-muted-foreground mb-4">
                  {errorMessage || "We couldn't verify your email address. The verification link may be expired or invalid."}
                </p>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="flex justify-center">
            <Button onClick={() => setLocation("/customer-dashboard")} disabled={isVerifying}>
              Return to Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}