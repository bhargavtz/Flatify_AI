
"use client";

import { useState, useRef, ChangeEvent } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { generateSimilarLogo, type GenerateSimilarLogoInput } from '@/ai/flows/generate-similar-logo';
import { useToast } from '@/hooks/use-toast';
import { LogoDisplayArea } from './LogoDisplayArea';
import { UploadCloud, Wand2, Save, ImageUp } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { LoadingSpinner } from './LoadingSpinner';

export function ImageEditorGeneratorView() {
  const [sourceImageFile, setSourceImageFile] = useState<File | null>(null);
  const [sourceImagePreview, setSourceImagePreview] = useState<string | null>(null);
  const [sourceImageDataUri, setSourceImageDataUri] = useState<string | null>(null);
  
  const [businessName, setBusinessName] = useState('');
  const [businessDescription, setBusinessDescription] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [generatedLogoSrc, setGeneratedLogoSrc] = useState<string | null>(null);
  
  const { toast } = useToast();
  const { user } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) { 
        toast({
          title: "Image Too Large",
          description: "Please upload an image smaller than 4MB.",
          variant: "destructive",
        });
        setSourceImageFile(null);
        setSourceImagePreview(null);
        setSourceImageDataUri(null);
        if(fileInputRef.current) fileInputRef.current.value = ""; 
        return;
      }
      setSourceImageFile(file);
      setSourceImagePreview(URL.createObjectURL(file));

      const reader = new FileReader();
      reader.onloadend = () => {
        setSourceImageDataUri(reader.result as string);
      };
      reader.readAsDataURL(file);
      setGeneratedLogoSrc(null); 
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!sourceImageDataUri) {
      toast({ title: "No Image", description: "Please upload a source image.", variant: "destructive" });
      return;
    }
    if (!businessName.trim()) {
      toast({ title: "Missing Info", description: "Business name is required.", variant: "destructive" });
      return;
    }
    if (!businessDescription.trim()) {
      toast({ title: "Missing Info", description: "Business description is required.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setGeneratedLogoSrc(null);

    const input: GenerateSimilarLogoInput = {
      sourceImageUri: sourceImageDataUri,
      businessName,
      businessDescription,
    };

    try {
      const result = await generateSimilarLogo(input);
      setGeneratedLogoSrc(result.logoDataUri);
      toast({ title: "Success!", description: "Your new logo has been generated." });
    } catch (error: any) {
      console.error("Error generating similar logo:", error);
      toast({ 
        title: "Generation Error", 
        description: error.message || "Failed to generate logo. Please try again.", 
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveImageEditorGeneration = async () => {
    if (!generatedLogoSrc || !user?.id || !sourceImageDataUri) {
      toast({ title: "Cannot Save", description: "Missing data, logo not generated, or not logged in.", variant: "destructive" });
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/generations/image-editor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          sourceImageUri: sourceImageDataUri,
          sourceImageOriginalName: sourceImageFile?.name || "uploaded_image",
          businessName,
          businessDescription,
          logoDataUri: generatedLogoSrc,
        }),
      });
      const data = await response.json();
      if (data.success) {
        toast({ title: "Logo Saved!", description: "Your image-based logo generation has been saved." });
      } else {
        toast({ title: "Save Error", description: data.message || "Could not save logo.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Failed to save image-editor logo:", error);
      toast({ title: "Save Error", description: "An unexpected error occurred while saving.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="py-4 px-4 sm:px-6 lg:px-8 w-full">
      <Card className="shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
            <ImageUp className="w-7 h-7 text-primary" /> Image-Based Logo Generator
          </CardTitle>
          <CardDescription className="text-sm">
            Upload an image, describe your business, and get a new AI-generated logo inspired by your upload.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              <div className="space-y-2">
                <Label htmlFor="sourceImageUpload" className="text-sm">Upload Source Image (Max 4MB)</Label>
                <Input
                  id="sourceImageUpload"
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleImageUpload}
                  ref={fileInputRef}
                  className="text-xs file:mr-2 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                />
                {sourceImagePreview && (
                  <div className="mt-2 p-1 border rounded-md bg-secondary/30 aspect-square flex items-center justify-center">
                    <Image
                      src={sourceImagePreview}
                      alt="Source preview"
                      width={200}
                      height={200}
                      className="rounded-md object-contain max-h-[200px]"
                      data-ai-hint="uploaded image"
                    />
                  </div>
                )}
                {!sourceImagePreview && (
                   <div className="mt-2 p-1 border border-dashed rounded-md bg-secondary/30 aspect-square flex flex-col items-center justify-center text-muted-foreground text-sm">
                    <UploadCloud className="w-10 h-10 mb-1" />
                    <p className="text-xs">Image preview will appear here.</p>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="businessNameImage" className="text-sm">Business Name</Label>
                  <Input
                    id="businessNameImage"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g., Your New Brand"
                    required
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="businessDescriptionImage" className="text-sm">Business Description</Label>
                  <Textarea
                    id="businessDescriptionImage"
                    value={businessDescription}
                    onChange={(e) => setBusinessDescription(e.target.value)}
                    placeholder="Describe what your business does or its style. This will guide the new logo."
                    required
                    rows={3}
                    className="text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
               <h3 className="text-lg font-semibold mb-1 text-center">Generated Logo</h3>
              <LogoDisplayArea logoSrc={generatedLogoSrc} isLoading={isLoading} businessName={businessName} />
            </div>

          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row justify-center items-center gap-3 py-4">
            <Button type="submit" size="sm" disabled={isLoading || !sourceImageDataUri} className="w-full sm:w-auto text-base">
              {isLoading ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : (
                <Wand2 className="mr-2 h-4 w-4" />
              )}
              Generate Similar Logo
            </Button>
            {user && generatedLogoSrc && (
              <Button onClick={handleSaveImageEditorGeneration} variant="outline" size="sm" className="w-full sm:w-auto text-base" disabled={isLoading}>
                <Save className="mr-2 h-4 w-4" />
                Save Logo
              </Button>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
