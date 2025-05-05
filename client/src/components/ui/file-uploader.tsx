import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { X, Upload, FileImage, FileCheck, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "./button";
import { Progress } from "./progress";
import { cn } from "@/lib/utils";

interface FileUploaderProps {
  onUploadComplete: (fileUrls: string[]) => void;
  maxFiles?: number;
  acceptedFileTypes?: string[];
  maxSizeMB?: number;
  uploadPath?: string;
  className?: string;
  existingFiles?: string[];
}

export function FileUploader({
  onUploadComplete,
  maxFiles = 5,
  acceptedFileTypes = ["image/jpeg", "image/png", "image/jpg"],
  maxSizeMB = 5,
  uploadPath = "uploads",
  className,
  existingFiles = [],
}: FileUploaderProps) {
  const { toast } = useToast();
  const [files, setFiles] = useState<
    Array<{
      file: File;
      preview: string;
      progress: number;
      uploaded: boolean;
      error?: string;
      url?: string;
    }>
  >([]);
  
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      // Check if adding these files would exceed the max file limit
      if (files.length + acceptedFiles.length + existingFiles.length > maxFiles) {
        toast({
          title: "Too many files",
          description: `You can only upload up to ${maxFiles} files in total.`,
          variant: "destructive",
        });
        return;
      }

      // Filter out files that exceed the size limit
      const validFiles = acceptedFiles.filter((file) => {
        const isValidSize = file.size <= maxSizeMB * 1024 * 1024;
        if (!isValidSize) {
          toast({
            title: "File too large",
            description: `${file.name} exceeds the ${maxSizeMB}MB limit.`,
            variant: "destructive",
          });
          return false;
        }
        return true;
      });

      // Add the valid files to the state
      const newFiles = validFiles.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
        progress: 0,
        uploaded: false,
      }));

      setFiles((prev) => [...prev, ...newFiles]);
    },
    [files.length, existingFiles.length, maxFiles, maxSizeMB, toast]
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } =
    useDropzone({
      onDrop,
      accept: acceptedFileTypes.reduce((acc, type) => {
        acc[type] = [];
        return acc;
      }, {} as Record<string, string[]>),
      maxSize: maxSizeMB * 1024 * 1024,
      maxFiles,
      disabled: files.length + existingFiles.length >= maxFiles || isUploading,
    });

  const uploadFiles = async () => {
    if (files.length === 0) return;
    
    setIsUploading(true);
    
    const uploadedUrls: string[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const fileObj = files[i];
      
      // Skip already uploaded files
      if (fileObj.uploaded) {
        if (fileObj.url) uploadedUrls.push(fileObj.url);
        continue;
      }
      
      try {
        // Create a FormData instance for the file
        const formData = new FormData();
        formData.append("file", fileObj.file);
        formData.append("path", uploadPath);
        
        // Start uploading
        setFiles((prev) => {
          const newFiles = [...prev];
          newFiles[i] = { ...newFiles[i], progress: 10 };
          return newFiles;
        });
        
        // Simulate progress updates (in a real app, you'd get this from the fetch API)
        const progressInterval = setInterval(() => {
          setFiles((prev) => {
            const newFiles = [...prev];
            // Don't go to 100% until we have the response
            if (newFiles[i].progress < 90) {
              newFiles[i] = { 
                ...newFiles[i], 
                progress: Math.min(newFiles[i].progress + 10, 90) 
              };
            }
            return newFiles;
          });
        }, 300);
        
        // Upload the file
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        
        clearInterval(progressInterval);
        
        if (!response.ok) {
          throw new Error(`Upload failed: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Update the file with the URL and mark as uploaded
        setFiles((prev) => {
          const newFiles = [...prev];
          newFiles[i] = { 
            ...newFiles[i], 
            progress: 100, 
            uploaded: true,
            url: data.url,
          };
          return newFiles;
        });
        
        uploadedUrls.push(data.url);
      } catch (error) {
        setFiles((prev) => {
          const newFiles = [...prev];
          newFiles[i] = { 
            ...newFiles[i], 
            progress: 0, 
            error: error instanceof Error ? error.message : "Upload failed",
          };
          return newFiles;
        });
        
        toast({
          title: "Upload failed",
          description: error instanceof Error ? error.message : "Failed to upload file",
          variant: "destructive",
        });
      }
    }
    
    setIsUploading(false);
    
    // Call the onUploadComplete callback with all uploaded URLs
    if (uploadedUrls.length > 0) {
      onUploadComplete(uploadedUrls);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const newFiles = [...prev];
      
      // Release the object URL to avoid memory leaks
      URL.revokeObjectURL(newFiles[index].preview);
      
      // Remove the file from the array
      newFiles.splice(index, 1);
      return newFiles;
    });
  };
  
  const removeExistingFile = (index: number) => {
    const newExistingFiles = [...existingFiles];
    newExistingFiles.splice(index, 1);
    onUploadComplete(newExistingFiles);
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition-colors",
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-gray-300 hover:border-primary/50",
          (files.length + existingFiles.length >= maxFiles || isUploading) &&
            "opacity-50 cursor-not-allowed",
          className
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center space-y-2">
          <Upload className="h-8 w-8 text-gray-400" />
          <p className="text-sm text-gray-600">
            {isDragActive
              ? "Drop the files here..."
              : files.length + existingFiles.length >= maxFiles
              ? `Maximum ${maxFiles} files reached`
              : isUploading
              ? "Uploading in progress..."
              : `Drag & drop files here, or click to select files`}
          </p>
          <p className="text-xs text-gray-400">
            {acceptedFileTypes.join(", ")} (max {maxSizeMB}MB)
          </p>
        </div>
      </div>

      {/* Error messages */}
      {fileRejections.length > 0 && (
        <div className="text-red-500 text-sm">
          {fileRejections.map(({ file, errors }) => (
            <div key={file.name} className="mt-1">
              <span className="font-medium">{file.name}:</span>{" "}
              {errors.map((e) => e.message).join(", ")}
            </div>
          ))}
        </div>
      )}

      {/* Existing files preview */}
      {existingFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Existing Files</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {existingFiles.map((fileUrl, index) => (
              <div
                key={`existing-${index}`}
                className="relative group border rounded-md p-2 bg-gray-50"
              >
                <div className="aspect-square w-full relative overflow-hidden rounded-md">
                  <img
                    src={fileUrl}
                    alt={`Uploaded file ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeExistingFile(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Remove file</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Files preview */}
      {files.length > 0 && (
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Selected Files</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {files.map((fileObj, index) => (
                <div
                  key={index}
                  className="relative group border rounded-md p-2 bg-gray-50"
                >
                  <div className="aspect-square w-full relative overflow-hidden rounded-md">
                    {fileObj.error ? (
                      <div className="h-full w-full flex flex-col items-center justify-center text-red-500">
                        <AlertCircle className="h-8 w-8 mb-2" />
                        <p className="text-xs text-center px-2">{fileObj.error}</p>
                      </div>
                    ) : fileObj.uploaded ? (
                      <>
                        <img
                          src={fileObj.preview}
                          alt={fileObj.file.name}
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20">
                          <FileCheck className="h-8 w-8 text-green-500" />
                        </div>
                      </>
                    ) : (
                      <>
                        <img
                          src={fileObj.preview}
                          alt={fileObj.file.name}
                          className="h-full w-full object-cover"
                        />
                        {fileObj.progress > 0 && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-40">
                            <p className="text-white text-sm font-medium mb-1">
                              {fileObj.progress}%
                            </p>
                            <div className="w-3/4">
                              <Progress value={fileObj.progress} />
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  <div className="mt-1 text-xs truncate text-gray-500" title={fileObj.file.name}>
                    {fileObj.file.name}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    disabled={isUploading}
                    className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    <X className="h-3 w-3" />
                    <span className="sr-only">Remove file</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Upload button */}
          <Button
            type="button"
            onClick={uploadFiles}
            disabled={
              files.length === 0 ||
              files.every((f) => f.uploaded) ||
              isUploading
            }
            className="w-full"
          >
            {isUploading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Uploading...
              </>
            ) : files.every((f) => f.uploaded) ? (
              "All files uploaded"
            ) : (
              "Upload files"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}