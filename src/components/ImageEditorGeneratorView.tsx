
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
import { useAuth } from '@/contexts/AuthContext';
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
  const { currentUser } = useAuth();
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
    if (!generatedLogoSrc || !currentUser || !currentUser.id || !sourceImageDataUri) {
      toast({ title: "Cannot Save", description: "Missing data, logo not generated, or not logged in.", variant: "destructive" });
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/generations/image-editor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
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
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-4xl mx-auto shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold flex items-center justify-center gap-2">
            <ImageUp className="w-8 h-8 text-primary" /> Image-Based Logo Generator
          </CardTitle>
          <CardDescription>
            Upload an image, describe your business, and get a new AI-generated logo inspired by your upload.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              <div className="space-y-3">
                <Label htmlFor="sourceImageUpload">Upload Source Image (Max 4MB)</Label>
                <Input
                  id="sourceImageUpload"
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleImageUpload}
                  ref={fileInputRef}
                  className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                />
                {sourceImagePreview && (
                  <div className="mt-4 p-2 border rounded-md bg-secondary/30 aspect-square flex items-center justify-center">
                    <Image 
                      src={sourceImagePreview} 
                      alt="Source preview" 
                      width={250} 
                      height={250} 
                      className="rounded-md object-contain max-h-[250px]"
                      data-ai-hint="uploaded image"
                    />
                  </div>
                )}
                {!sourceImagePreview && (
                   <div className="mt-4 p-2 border border-dashed rounded-md bg-secondary/30 aspect-square flex flex-col items-center justify-center text-muted-foreground">
                    <UploadCloud className="w-12 h-12 mb-2" />
                    <p className="text-sm">Image preview will appear here.</p>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="businessNameImage">Business Name</Label>
                  <Input
                    id="businessNameImage"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g., Your New Brand"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="businessDescriptionImage">Business Description</Label>
                  <Textarea
                    id="businessDescriptionImage"
                    value={businessDescription}
                    onChange={(e) => setBusinessDescription(e.target.value)}
                    placeholder="Describe what your business does or its style. This will guide the new logo."
                    required
                    rows={4}
                  />
                </div>
              </div>
            </div>
            
            <div className="pt-4">
               <h3 className="text-xl font-semibold mb-2 text-center">Generated Logo</h3>
              <LogoDisplayArea logoSrc={generatedLogoSrc} isLoading={isLoading} businessName={businessName} />
            </div>

          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row justify-center items-center gap-4 py-6">
            <Button type="submit" size="lg" disabled={isLoading || !sourceImageDataUri} className="w-full sm:w-auto text-lg">
              {isLoading ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : (
                <Wand2 className="mr-2 h-5 w-5" />
              )}
              Generate Similar Logo
            </Button>
            {currentUser && generatedLogoSrc && (
              <Button onClick={handleSaveImageEditorGeneration} variant="outline" size="lg" className="w-full sm:w-auto text-lg" disabled={isLoading}>
                <Save className="mr-2 h-5 w-5" />
                Save Logo
              </Button>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
