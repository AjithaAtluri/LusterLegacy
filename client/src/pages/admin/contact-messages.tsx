import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { Loader2, MailOpen, Mail, ExternalLink, UserCircle, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import AdminLayout from "@/components/admin/admin-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ContactMessage {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function AdminContactMessages() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentTab, setCurrentTab] = useState("all");
  
  // Fetch contact messages
  const { data: messages, isLoading, refetch } = useQuery<ContactMessage[]>({
    queryKey: ["/api/admin/contact"],
    staleTime: 1000 * 60, // 1 minute
  });
  
  // Mutation to mark message as read
  const markAsReadMutation = useMutation({
    mutationFn: async (messageId: number) => {
      await apiRequest("PUT", `/api/admin/contact/${messageId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/contact"] });
      toast({
        title: "Success",
        description: "Message marked as read"
      });
    },
    onError: (error) => {
      console.error("Error marking message as read:", error);
      toast({
        title: "Error",
        description: "Failed to mark message as read",
        variant: "destructive"
      });
    }
  });
  
  // Mutation to delete a message
  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId: number) => {
      await apiRequest("DELETE", `/api/admin/contact/${messageId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/contact"] });
      toast({
        title: "Success",
        description: "Message deleted successfully"
      });
    },
    onError: (error) => {
      console.error("Error deleting message:", error);
      toast({
        title: "Error",
        description: "Failed to delete message",
        variant: "destructive"
      });
    }
  });

  // Filter messages based on current tab and search term
  const filteredMessages = messages
    ? messages
        .filter((message) => {
          if (currentTab === "unread") return !message.isRead;
          if (currentTab === "read") return message.isRead;
          return true; // "all" tab
        })
        .filter((message) => {
          if (!searchTerm) return true;
          const term = searchTerm.toLowerCase();
          return (
            message.name.toLowerCase().includes(term) ||
            message.email.toLowerCase().includes(term) ||
            message.message.toLowerCase().includes(term) ||
            (message.phone && message.phone.toLowerCase().includes(term))
          );
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    : [];
    
  const handleMarkAsRead = (id: number) => {
    markAsReadMutation.mutate(id);
  };
  
  const handleDeleteMessage = (id: number) => {
    deleteMessageMutation.mutate(id);
  };
  
  return (
    <AdminLayout title="Contact Messages">
      <Helmet>
        <title>Contact Messages | Admin Dashboard</title>
      </Helmet>
      
      <div className="container mx-auto p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Contact Messages</h1>
            <p className="text-muted-foreground mt-1">
              View and manage customer messages sent through the contact form
            </p>
          </div>
          
          <Button onClick={() => refetch()}>
            Refresh Messages
          </Button>
        </div>
        
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <Input
            placeholder="Search messages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
          
          <Tabs defaultValue="all" value={currentTab} onValueChange={setCurrentTab} className="w-full sm:w-auto">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="unread">Unread</TabsTrigger>
              <TabsTrigger value="read">Read</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredMessages.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-muted-foreground">No messages found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredMessages.map((message) => (
              <Card key={message.id} className={message.isRead ? "opacity-80" : "border-primary"}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between">
                    <div className="flex items-center gap-2">
                      <UserCircle className="h-5 w-5 text-muted-foreground" />
                      <CardTitle className="text-lg">{message.name}</CardTitle>
                      {!message.isRead && (
                        <Badge variant="default" className="ml-2">New</Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(message.createdAt), "MMM d, yyyy h:mm a")}
                    </div>
                  </div>
                  <CardDescription>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-1">
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-1" /> 
                        <a 
                          href={`mailto:${message.email}`} 
                          className="text-primary hover:underline"
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          {message.email}
                        </a>
                      </div>
                      {message.phone && (
                        <div className="flex items-center sm:ml-4">
                          <span className="mr-1">|</span>
                          <a 
                            href={`tel:${message.phone}`} 
                            className="hover:underline"
                          >
                            {message.phone}
                          </a>
                        </div>
                      )}
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted p-4 rounded-md mb-4 whitespace-pre-wrap">
                    {message.message}
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <a 
                        href={`mailto:${message.email}?subject=RE: Your message to Luster Legacy`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        Reply via Email
                      </a>
                    </Button>
                    
                    {!message.isRead && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleMarkAsRead(message.id)}
                        disabled={markAsReadMutation.isPending}
                      >
                        <MailOpen className="h-4 w-4 mr-2" />
                        Mark as Read
                      </Button>
                    )}
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={deleteMessageMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete this message?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This message will be permanently deleted.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDeleteMessage(message.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}