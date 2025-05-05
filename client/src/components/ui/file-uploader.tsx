import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { XCircle, Upload, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export interface FileUploaderProps {
  maxFiles?: number;
  acceptedFileTypes?: string[];
  maxSizeMB?: number;
  endpoint: string;
  onUploadsComplete?: (urls: string[]) => void;
  className?: string;
}

export function FileUploader({
  maxFiles = 5,
  acceptedFileTypes = ["image/*"],
  maxSizeMB = 5,
  endpoint,
  onUploadsComplete,
  className,
}: FileUploaderProps) {
  const [uploadedFiles, setUploadedFiles] = useState<Array<{
    id: string;
    name: string;
    size: number;
    progress: number;
    status: "uploading" | "success" | "error";
    url: string;
  }>>([]);
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  const { toast } = useToast();

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      // Check if we already have the maximum number of files
      if (uploadedFiles.length + acceptedFiles.length > maxFiles) {
        toast({
          title: "Maximum files exceeded",
          description: `You can only upload up to ${maxFiles} files.`,
          variant: "destructive",
        });
        return;
      }

      // Add files to the list with progress 0
      const newFiles = acceptedFiles.map((file) => ({
        id: `${file.name}-${Date.now()}`,
        name: file.name,
        size: file.size,
        progress: 0,
        status: "uploading" as const,
        url: "",
      }));

      setUploadedFiles((prev) => [...prev, ...newFiles]);

      // Upload each file
      const uploadPromises = acceptedFiles.map(async (file, index) => {
        const formData = new FormData();
        formData.append("file", file);

        try {
          const xhr = new XMLHttpRequest();
          
          // Update progress as the upload proceeds
          xhr.upload.addEventListener("progress", (event) => {
            if (event.lengthComputable) {
              const progress = Math.round((event.loaded * 100) / event.total);
              setUploadedFiles((prev) =>
                prev.map((f) =>
                  f.id === newFiles[index].id ? { ...f, progress } : f
                )
              );
            }
          });

          // Create a promise that resolves when the upload is complete
          const uploadPromise = new Promise<string>((resolve, reject) => {
            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                const response = JSON.parse(xhr.responseText);
                resolve(response.url);
              } else {
                reject(new Error(`Upload failed with status ${xhr.status}`));
              }
            };
            xhr.onerror = () => reject(new Error("Network error"));
          });

          xhr.open("POST", endpoint);
          xhr.send(formData);

          // Wait for the upload to complete
          const url = await uploadPromise;
          
          // Update the file status to success
          setUploadedFiles((prev) =>
            prev.map((f) =>
              f.id === newFiles[index].id
                ? { ...f, status: "success", url, progress: 100 }
                : f
            )
          );
          
          return url;
        } catch (error) {
          // Update the file status to error
          setUploadedFiles((prev) =>
            prev.map((f) =>
              f.id === newFiles[index].id
                ? { ...f, status: "error", progress: 0 }
                : f
            )
          );
          
          toast({
            title: "Upload failed",
            description: `Failed to upload ${file.name}: ${error.message}`,
            variant: "destructive",
          });
          
          return null;
        }
      });

      // Wait for all uploads to complete
      const urls = (await Promise.all(uploadPromises)).filter(
        (url): url is string => url !== null
      );
      
      // Call the callback with the successful upload URLs
      if (onUploadsComplete) {
        const allUrls = [
          ...uploadedFiles.filter((f) => f.status === "success").map((f) => f.url),
          ...urls,
        ];
        onUploadsComplete(allUrls);
      }
    },
    [uploadedFiles, maxFiles, endpoint, onUploadsComplete, toast]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes.reduce((acc, type) => {
      acc[type] = [];
      return acc;
    }, {}),
    maxSize: maxSizeBytes,
    maxFiles,
    onDropRejected: (fileRejections) => {
      fileRejections.forEach((rejection) => {
        const { file, errors } = rejection;
        let errorMessage = "File rejected: ";
        
        errors.forEach((error) => {
          if (error.code === "file-too-large") {
            errorMessage = `File too large. Max size is ${maxSizeMB}MB.`;
          } else if (error.code === "file-invalid-type") {
            errorMessage = "Invalid file type.";
          } else {
            errorMessage += error.message;
          }
        });
        
        toast({
          title: "File rejected",
          description: `${file.name}: ${errorMessage}`,
          variant: "destructive",
        });
      });
    },
  });

  const removeFile = (id: string) => {
    setUploadedFiles((prev) => {
      const updatedFiles = prev.filter((file) => file.id !== id);
      
      // Update the callback with the new list of successful uploads
      if (onUploadsComplete) {
        const successfulUrls = updatedFiles
          .filter((f) => f.status === "success")
          .map((f) => f.url);
        onUploadsComplete(successfulUrls);
      }
      
      return updatedFiles;
    });
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 cursor-pointer transition-colors duration-200 text-center",
          isDragActive
            ? "border-primary bg-primary/10"
            : "border-border hover:border-primary/50 hover:bg-muted",
          uploadedFiles.length >= maxFiles && "opacity-50 cursor-not-allowed"
        )}
      >
        <input {...getInputProps()} disabled={uploadedFiles.length >= maxFiles} />
        <div className="flex flex-col items-center justify-center">
          <Upload className="h-10 w-10 text-muted-foreground mb-4" />
          <p className="text-sm font-medium mb-1">
            {isDragActive ? "Drop files here" : "Drag & drop files here or click to browse"}
          </p>
          <p className="text-xs text-muted-foreground">
            {acceptedFileTypes.join(", ")} (Max: {maxFiles} files, {maxSizeMB}MB each)
          </p>
        </div>
      </div>
      
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium">Uploaded files</div>
          <ul className="space-y-2">
            {uploadedFiles.map((file) => (
              <li
                key={file.id}
                className="bg-muted p-2 rounded flex items-center justify-between"
              >
                <div className="flex items-center flex-grow mr-2">
                  {file.status === "success" ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                  ) : file.status === "error" ? (
                    <XCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
                  ) : (
                    <div className="h-5 w-5 mr-2 flex-shrink-0" />
                  )}
                  <div className="truncate flex-grow">
                    <div className="text-sm truncate">{file.name}</div>
                    {file.status === "uploading" && (
                      <Progress value={file.progress} className="h-1 mt-1" />
                    )}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(file.id);
                  }}
                >
                  <XCircle className="h-4 w-4" />
                  <span className="sr-only">Remove</span>
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}