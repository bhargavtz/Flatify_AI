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
import { UploadCloud, Wand2, Save, ImageUp, Sparkles, Download, Twitter, Facebook, Linkedin, Brush, Lightbulb } from 'lucide-react'; // Added Lightbulb icon
import { useUser } from '@clerk/nextjs';
import { LoadingSpinner } from './LoadingSpinner';
import { generateSuggestions, type GenerateSuggestionsInput } from '@/ai/flows/generate-suggestions'; // Import the new AI flow
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'; // Import Popover components

export function ImageEditorGeneratorView() {
  const [sourceImageFile, setSourceImageFile] = useState<File | null>(null);
  const [sourceImagePreview, setSourceImagePreview] = useState<string | null>(null);
  const [sourceImageDataUri, setSourceImageDataUri] = useState<string | null>(null);
  
  const [businessName, setBusinessName] = useState('');
  const [businessDescription, setBusinessDescription] = useState('');
  const [suggestedBusinessName, setSuggestedBusinessName] = useState<string | null>(null);
  const [suggestedBusinessDescription, setSuggestedBusinessDescription] = useState<string | null>(null);
  const [selectedColorPalette, setSelectedColorPalette] = useState<string>('');
  const [selectedFontStyle, setSelectedFontStyle] = useState<string>('');
  const [selectedLogoShape, setSelectedLogoShape] = useState<string>('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [generatedLogoSrc, setGeneratedLogoSrc] = useState<string | null>(null);
  const [refinementPrompt, setRefinementPrompt] = useState<string>('');

  const [colorSuggestions, setColorSuggestions] = useState<string[]>([]); // New state for color suggestions
  
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

  const handleSuggest = async (type: 'name' | 'description') => {
    if (!sourceImageDataUri) {
      toast({ title: "No Image", description: "Please upload a source image to get suggestions.", variant: "destructive" });
      return;
    }

    setIsSuggesting(true);
    try {
      const response = await fetch('/api/suggestions/image-editor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceImageUri: sourceImageDataUri,
          type,
        }),
      });
      const data = await response.json();
      if (data.success) {
        if (type === 'name') {
          setSuggestedBusinessName(data.suggestion);
          setBusinessName(data.suggestion); // Also set it as the current value
        } else {
          setSuggestedBusinessDescription(data.suggestion);
          setBusinessDescription(data.suggestion); // Also set it as the current value
        }
        toast({ title: "Suggestion Generated!", description: `New ${type} suggestion available.` });
      } else {
        toast({ title: "Suggestion Error", description: data.message || "Failed to get suggestion.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Error getting suggestion:", error);
      toast({ title: "Suggestion Error", description: "An unexpected error occurred while getting suggestion.", variant: "destructive" });
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleGenerateSuggestions = async (type: GenerateSuggestionsInput['suggestionType']) => {
    if (!businessName.trim()) {
      toast({ title: "Uh oh!", description: "Business name is required to generate suggestions.", variant: "destructive" });
      return;
    }

    setIsSuggesting(true);
    try {
      const result = await generateSuggestions({ businessName, suggestionType: type });
      switch (type) {
        case 'color':
          setColorSuggestions(result.suggestions);
          break;
        default:
          // Handle other suggestion types if needed in the future for this view
          break;
      }
      toast({ title: "Suggestions Generated!", description: `New ${type} suggestions are available.` });
    } catch (error) {
      console.error(`Error generating ${type} suggestions:`, error);
      toast({ title: "Error", description: `Failed to generate ${type} suggestions.`, variant: "destructive" });
    } finally {
      setIsSuggesting(false);
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
      colorPalette: selectedColorPalette,
      fontStyle: selectedFontStyle,
      logoShape: selectedLogoShape,
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

  const handleDownloadLogo = () => {
    if (generatedLogoSrc) {
      const link = document.createElement('a');
      link.href = generatedLogoSrc;
      link.download = `${businessName || 'generated_logo'}.png`; // Default name or use business name
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({ title: "Download Started", description: "Your logo download should begin shortly." });
    } else {
      toast({ title: "No Logo to Download", description: "Please generate a logo first.", variant: "destructive" });
    }
  };

  const handleRefineLogo = async () => {
    if (!generatedLogoSrc) {
      toast({ title: "No Logo to Refine", description: "Please generate a logo first.", variant: "destructive" });
      return;
    }
    if (!refinementPrompt.trim()) {
      toast({ title: "Missing Refinement", description: "Please enter a refinement prompt.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/refine-logo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logoDataUri: generatedLogoSrc,
          refinementPrompt,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setGeneratedLogoSrc(data.refinedLogoDataUri);
        toast({ title: "Logo Refined!", description: "Your logo has been refined." });
        setRefinementPrompt(''); // Clear refinement prompt after successful refinement
      } else {
        toast({ title: "Refinement Error", description: data.message || "Failed to refine logo.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Error refining logo:", error);
      toast({ title: "Refinement Error", description: "An unexpected error occurred during refinement.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleShareLogo = (platform: 'twitter' | 'facebook' | 'linkedin') => {
    if (!generatedLogoSrc) {
      toast({ title: "No Logo to Share", description: "Please generate a logo first.", variant: "destructive" });
      return;
    }

    const logoUrl = encodeURIComponent(generatedLogoSrc);
    const text = encodeURIComponent(`Check out this AI-generated logo for "${businessName}"!`);
    let shareUrl = '';

    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${logoUrl}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${logoUrl}&quote=${text}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/shareArticle?mini=true&url=${logoUrl}&title=${text}`;
        break;
      default:
        return;
    }

    window.open(shareUrl, '_blank');
    toast({ title: "Sharing...", description: `Opening ${platform} for sharing.` });
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
                  <div className="flex items-center gap-2">
                    <Input
                      id="businessNameImage"
                      value={suggestedBusinessName || businessName}
                      onChange={(e) => {
                        setBusinessName(e.target.value);
                        setSuggestedBusinessName(null); // Clear suggestion if user types
                      }}
                      placeholder="e.g., Your New Brand"
                      required
                      className="text-sm"
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="icon" 
                      onClick={() => handleSuggest('name')} 
                      disabled={isSuggesting || !sourceImageDataUri}
                      title="Suggest Business Name"
                    >
                      <Sparkles className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="businessDescriptionImage" className="text-sm">Business Description</Label>
                  <div className="flex items-center gap-2">
                    <Textarea
                      id="businessDescriptionImage"
                      value={suggestedBusinessDescription || businessDescription}
                      onChange={(e) => {
                        setBusinessDescription(e.target.value);
                        setSuggestedBusinessDescription(null); // Clear suggestion if user types
                      }}
                      placeholder="Describe what your business does or its style. This will guide the new logo."
                      required
                      rows={3}
                      className="text-sm"
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="icon" 
                      onClick={() => handleSuggest('description')} 
                      disabled={isSuggesting || !sourceImageDataUri}
                      title="Suggest Business Description"
                    >
                      <Sparkles className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="colorPalette" className="text-sm">Color Palette (Optional)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="colorPalette"
                      value={selectedColorPalette}
                      onChange={(e) => setSelectedColorPalette(e.target.value)}
                      placeholder="e.g., vibrant, pastel, monochrome"
                      className="text-sm"
                    />
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="icon" disabled={isSuggesting || !businessName.trim()} onClick={() => handleGenerateSuggestions('color')} title="Suggest Colors">
                          {isSuggesting ? <LoadingSpinner size="sm" /> : <Lightbulb className="h-4 w-4" />}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80">
                        <div className="grid gap-4">
                          <div className="space-y-2">
                            <h4 className="font-medium leading-none">Color Suggestions</h4>
                            <p className="text-sm text-muted-foreground">
                              Click to use a suggestion.
                            </p>
                          </div>
                          {colorSuggestions.length > 0 ? (
                            <div className="space-y-2 grid grid-cols-2 gap-2">
                              {colorSuggestions.map((color, index) => (
                                <Button key={index} variant="ghost" className="justify-start h-auto text-wrap text-left" onClick={() => setSelectedColorPalette(color)}>
                                  <span className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: color }}></span>
                                  {color}
                                </Button>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">No suggestions yet. Click "Suggest Colors" to generate some!</p>
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <div>
                  <Label htmlFor="fontStyle" className="text-sm">Font Style (Optional)</Label>
                  <Input
                    id="fontStyle"
                    value={selectedFontStyle}
                    onChange={(e) => setSelectedFontStyle(e.target.value)}
                    placeholder="e.g., modern, classic, handwritten"
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="logoShape" className="text-sm">Logo Shape (Optional)</Label>
                  <Input
                    id="logoShape"
                    value={selectedLogoShape}
                    onChange={(e) => setSelectedLogoShape(e.target.value)}
                    placeholder="e.g., circle, square, abstract"
                    className="text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
               <h3 className="text-lg font-semibold mb-1 text-center">Generated Logo</h3>
              <LogoDisplayArea logoSrc={generatedLogoSrc} isLoading={isLoading} businessName={businessName} />
            </div>

            {generatedLogoSrc && (
              <div className="space-y-2 mt-4">
                <Label htmlFor="refinementPrompt" className="text-sm">Refine Logo (Optional)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="refinementPrompt"
                    value={refinementPrompt}
                    onChange={(e) => setRefinementPrompt(e.target.value)}
                    placeholder="e.g., make the colors brighter, add a subtle gradient, change font to serif"
                    className="text-sm"
                    disabled={isLoading}
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="icon" 
                    onClick={handleRefineLogo} 
                    disabled={isLoading || !refinementPrompt.trim()}
                    title="Refine Logo"
                  >
                    <Brush className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

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
              <>
                <Button onClick={handleSaveImageEditorGeneration} variant="outline" size="sm" className="w-full sm:w-auto text-base" disabled={isLoading}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Logo
                </Button>
                <Button onClick={handleDownloadLogo} variant="outline" size="sm" className="w-full sm:w-auto text-base" disabled={isLoading}>
                  <Download className="mr-2 h-4 w-4" />
                  Download Logo
                </Button>
                <Button onClick={() => handleShareLogo('twitter')} variant="outline" size="icon" className="text-base" disabled={isLoading} title="Share on Twitter">
                  <Twitter className="h-4 w-4" />
                </Button>
                <Button onClick={() => handleShareLogo('facebook')} variant="outline" size="icon" className="text-base" disabled={isLoading} title="Share on Facebook">
                  <Facebook className="h-4 w-4" />
                </Button>
                <Button onClick={() => handleShareLogo('linkedin')} variant="outline" size="icon" className="text-base" disabled={isLoading} title="Share on LinkedIn">
                  <Linkedin className="h-4 w-4" />
                </Button>
              </>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
