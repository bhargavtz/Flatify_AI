
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { generateInitialLogo, type GenerateInitialLogoInput } from '@/ai/flows/generate-initial-logo';
import { useToast } from '@/hooks/use-toast';
import { LogoDisplayArea } from './LogoDisplayArea';
import { Wand2, Palette, Info, Save } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { useUser } from '@clerk/nextjs';
import { LoadingSpinner } from './LoadingSpinner';

const SimpleColorPicker = ({ label, color, setColor }: { label: string, color: string, setColor: (color: string) => void }) => (
  <div className="flex items-center gap-2">
    <Label htmlFor={`${label}-color-picker`} className="text-sm">{label}:</Label>
    <Input
      type="color"
      id={`${label}-color-picker`}
      value={color}
      onChange={(e) => setColor(e.target.value)}
      className="w-10 h-10 p-1 rounded-md"
    />
    <span className="text-xs text-muted-foreground">{color}</span>
  </div>
);


export function NoviceGeneratorView() {
  const [businessName, setBusinessName] = useState('');
  const [businessDescription, setBusinessDescription] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#3F51B5');
  const [secondaryColor, setSecondaryColor] = useState('#7E57C2');

  const [isLoading, setIsLoading] = useState(false);
  const [logoSrc, setLogoSrc] = useState<string | null>(null);
  const [currentFullDescription, setCurrentFullDescription] = useState(''); // To store description used for generation

  const { toast } = useToast();
  const { user } = useUser();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!businessName.trim()) {
      toast({ title: "Uh oh!", description: "Business name is required.", variant: "destructive" });
      return;
    }
    if (!businessDescription.trim()) {
      toast({ title: "Uh oh!", description: "Business description is required.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setLogoSrc(null);

    let fullDescription = businessDescription;
    if (primaryColor || secondaryColor) {
      fullDescription += ` The logo should feature colors like ${primaryColor} (primary) and ${secondaryColor} (secondary).`;
    }
    fullDescription += " Ensure the logo is a flat design, simple, modern, and professional.";
    setCurrentFullDescription(fullDescription); // Save for potential saving

    const input: GenerateInitialLogoInput = {
      businessName,
      businessDescription: fullDescription,
    };

    try {
      const result = await generateInitialLogo(input);
      setLogoSrc(result.logoDataUri);
      toast({ title: "Success!", description: "Your logo has been generated." });
    } catch (error) {
      console.error("Error generating logo:", error);
      toast({ title: "Error", description: "Failed to generate logo. Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveNoviceGeneration = async () => {
    if (!logoSrc || !user?.id) {
      toast({ title: "Cannot Save", description: "No logo generated or not logged in.", variant: "destructive" });
      return;
    }

    setIsLoading(true); // Use a different loading state or manage combined states if needed
    try {
      const response = await fetch('/api/generations/novice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          businessName,
          businessDescription: currentFullDescription, // Use the description that was sent to AI
          primaryColor,
          secondaryColor,
          logoDataUri: logoSrc,
        }),
      });
      const data = await response.json();
      if (data.success) {
        toast({ title: "Logo Saved!", description: "Your novice logo generation has been saved." });
      } else {
        toast({ title: "Save Error", description: data.message || "Could not save novice logo.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Failed to save novice logo:", error);
      toast({ title: "Save Error", description: "An unexpected error occurred while saving.", variant: "destructive" });
    } finally {
      setIsLoading(false); // Reset general loading state
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-4xl mx-auto shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold flex items-center justify-center gap-2">
            <Wand2 className="w-8 h-8 text-primary" /> Create Your Logo
          </CardTitle>
          <CardDescription>
            Tell us about your business, and we'll craft a unique flat design logo for you.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="businessNameNovice" className="flex items-center gap-1">
                  Business Name
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>The official name of your business.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <Input
                  id="businessNameNovice"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g., Sparkle Clean Co."
                  required
                  className="text-base"
                />
              </div>
              <div className="space-y-2">
                 <Label htmlFor="businessDescriptionNovice" className="flex items-center gap-1">
                  Business Description / Slogan
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="font-medium mb-1">Describe your business clearly.</p>
                        <p className="text-xs text-muted-foreground mb-2">
                          What does it do? What's its style or main product? The more descriptive you are, the better the AI can tailor the logo!
                        </p>
                        <p className="text-xs font-semibold mb-1">Examples:</p>
                        <ul className="list-disc list-inside text-xs space-y-0.5 text-muted-foreground">
                          <li>"Modern software development for startups"</li>
                          <li>"Handmade jewelry with natural gemstones"</li>
                          <li>"Friendly local pet grooming service"</li>
                          <li>"Bold and adventurous travel agency"</li>
                        </ul>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <Textarea
                  id="businessDescriptionNovice"
                  value={businessDescription}
                  onChange={(e) => setBusinessDescription(e.target.value)}
                  placeholder="e.g., 'Artisan coffee shop with a cozy vibe' or 'Tech startup focusing on sustainable solutions'"
                  required
                  className="text-base min-h-[108px]"
                />
              </div>
            </div>

            <div className="space-y-3 p-4 border rounded-md bg-secondary/30">
              <div className="flex items-center gap-2">
                 <Palette className="w-5 h-5 text-primary" />
                 <h4 className="font-medium">Choose Your Colors (Optional)</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SimpleColorPicker label="Primary Color" color={primaryColor} setColor={setPrimaryColor} />
                <SimpleColorPicker label="Secondary Color" color={secondaryColor} setColor={setSecondaryColor} />
              </div>
               <p className="text-xs text-muted-foreground">These colors will guide the AI in generating your logo.</p>
            </div>

            <div className="pt-4">
              <LogoDisplayArea logoSrc={logoSrc} isLoading={isLoading} businessName={businessName} />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row justify-center items-center gap-4 py-6">
            <Button type="submit" size="lg" disabled={isLoading} className="w-full sm:w-auto text-lg">
              {isLoading ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : (
                <Wand2 className="mr-2 h-5 w-5" />
              )}
              Generate Logo
            </Button>
            {user && logoSrc && (
              <Button onClick={handleSaveNoviceGeneration} variant="outline" size="lg" className="w-full sm:w-auto text-lg" disabled={isLoading}>
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
