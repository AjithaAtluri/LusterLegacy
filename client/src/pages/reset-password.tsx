import { useState, useEffect } from "react";
import { useLocation, useSearch, Link } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

// Validation schema for reset password form
const resetPasswordSchema = z.object({
  newPassword: z.string()
    .min(8, "Password must be at least 8 characters long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string()
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const { toast } = useToast();
  const [token, setToken] = useState<string | null>(null);
  const [isVerifyingToken, setIsVerifyingToken] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [userInfo, setUserInfo] = useState<{ email?: string; name?: string }>({});

  // Initialize form with empty values
  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: ""
    }
  });

  // Extract token from URL and verify it
  useEffect(() => {
    const params = new URLSearchParams(search);
    const tokenParam = params.get("token");

    if (!tokenParam) {
      setIsVerifyingToken(false);
      toast({
        title: "Invalid Request",
        description: "No reset token provided. Please request a new password reset link.",
        variant: "destructive"
      });
      return;
    }

    setToken(tokenParam);

    // Verify the token
    const verifyToken = async () => {
      try {
        const response = await fetch(`/api/reset-password/verify-token?token=${tokenParam}`);
        const data = await response.json();

        if (response.ok && data.success) {
          // Token is valid
          setIsTokenValid(true);
          setUserInfo({
            email: data.email,
            name: data.name
          });
        } else {
          // Token is invalid or expired
          setIsTokenValid(false);
          toast({
            title: "Invalid or Expired Token",
            description: "Your password reset link has expired or is invalid. Please request a new one.",
            variant: "destructive"
          });
        }
      } catch (error) {
        setIsTokenValid(false);
        toast({
          title: "Verification Failed",
          description: "Failed to verify your reset token. Please try again or request a new link.",
          variant: "destructive"
        });
      } finally {
        setIsVerifyingToken(false);
      }
    };

    verifyToken();
  }, [search, toast]);

  // Handle form submission
  const onSubmit = async (values: ResetPasswordFormValues) => {
    if (!token || !isTokenValid) {
      toast({
        title: "Invalid Token",
        description: "Your password reset link has expired or is invalid. Please request a new one.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsResettingPassword(true);

      const response = await fetch('/api/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          newPassword: values.newPassword
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Password reset successful
        setResetSuccess(true);
        form.reset();
        
        toast({
          title: "Password Reset Successful",
          description: "Your password has been successfully reset. You can now log in with your new password.",
        });
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate("/auth");
        }, 3000);
      } else {
        // Password reset failed
        toast({
          title: "Password Reset Failed",
          description: data.message || "Failed to reset your password. Please try again or request a new link.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Reset Failed",
        description: "An error occurred while resetting your password. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsResettingPassword(false);
    }
  };

  // Render loading state
  if (isVerifyingToken) {
    return (
      <div className="container mx-auto max-w-md py-12">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Verifying Reset Link</CardTitle>
            <CardDescription className="text-center">
              Please wait while we verify your password reset link...
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center p-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render invalid token state
  if (!isTokenValid) {
    return (
      <div className="container mx-auto max-w-md py-12">
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-destructive">Invalid Reset Link</CardTitle>
            <CardDescription className="text-center">
              Your password reset link is invalid or has expired.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center p-6">
            <XCircle className="h-16 w-16 text-destructive mb-4" />
            <p className="text-center text-muted-foreground mb-4">
              Please request a new password reset link from the login page.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center pb-6">
            <Button asChild>
              <Link href="/auth">Return to Login</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Render success state
  if (resetSuccess) {
    return (
      <div className="container mx-auto max-w-md py-12">
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-primary">Password Reset Successfully</CardTitle>
            <CardDescription className="text-center">
              Your password has been successfully reset.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center p-6">
            <CheckCircle className="h-16 w-16 text-primary mb-4" />
            <p className="text-center text-muted-foreground mb-4">
              You can now log in with your new password. Redirecting to login page...
            </p>
          </CardContent>
          <CardFooter className="flex justify-center pb-6">
            <Button asChild>
              <Link href="/auth">Login Now</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Render reset password form
  return (
    <div className="container mx-auto max-w-md py-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-center">Reset Your Password</CardTitle>
          <CardDescription className="text-center">
            {userInfo.name ? `Hello ${userInfo.name}, please` : 'Please'} create a new password for your account
            {userInfo.email ? ` (${userInfo.email})` : ''}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Enter your new password"
                        {...field}
                        disabled={isResettingPassword}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Confirm your new password"
                        {...field}
                        disabled={isResettingPassword}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={isResettingPassword}
              >
                {isResettingPassword ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resetting Password...
                  </>
                ) : (
                  "Reset Password"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button variant="ghost" asChild>
            <Link href="/auth">Cancel and Return to Login</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}