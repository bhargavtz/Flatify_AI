
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // Added Select components
import { generateInitialLogo, type GenerateInitialLogoInput } from '@/ai/flows/generate-initial-logo';
import { useToast } from '@/hooks/use-toast';
import { LogoDisplayArea } from './LogoDisplayArea';
import { Wand2, Palette, Info, Save, Type, Lightbulb } from 'lucide-react'; // Added Type and Lightbulb icons
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { useUser } from '@clerk/nextjs';
import { LoadingSpinner } from './LoadingSpinner';
import { generateSuggestions, type GenerateSuggestionsInput } from '@/ai/flows/generate-suggestions'; // Import the new AI flow
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'; // Import Popover components

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
  const [selectedFont, setSelectedFont] = useState('Arial');
  const [selectedLayout, setSelectedLayout] = useState('Icon Above Text'); // New state for layout selection

  const [isLoading, setIsLoading] = useState(false);
  const [logoSrc, setLogoSrc] = useState<string | null>(null);
  const [currentFullDescription, setCurrentFullDescription] = useState(''); // To store description used for generation

  const [descriptionSuggestions, setDescriptionSuggestions] = useState<string[]>([]);
  const [sloganSuggestions, setSloganSuggestions] = useState<string[]>([]);
  const [colorSuggestions, setColorSuggestions] = useState<string[]>([]);
  const [iconSuggestions, setIconSuggestions] = useState<string[]>([]);

  const [isSuggesting, setIsSuggesting] = useState(false);

  const availableFonts = ['Arial', 'Verdana', 'Helvetica', 'Times New Roman', 'Georgia', 'Courier New', 'Brush Script MT', 'Impact']; // Example fonts

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
    if (selectedFont) {
      fullDescription += ` Use the font style similar to ${selectedFont}.`;
    }
    if (selectedLayout) {
      fullDescription += ` The logo layout should be: ${selectedLayout}.`;
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

  const handleGenerateSuggestions = async (type: GenerateSuggestionsInput['suggestionType']) => {
    if (!businessName.trim()) {
      toast({ title: "Uh oh!", description: "Business name is required to generate suggestions.", variant: "destructive" });
      return;
    }

    setIsSuggesting(true);
    try {
      const result = await generateSuggestions({ businessName, suggestionType: type });
      switch (type) {
        case 'description':
          setDescriptionSuggestions(result.suggestions);
          break;
        case 'slogan':
          setSloganSuggestions(result.suggestions);
          break;
        case 'color':
          setColorSuggestions(result.suggestions);
          break;
        case 'icon':
          setIconSuggestions(result.suggestions);
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
    <div className="py-4 px-4 sm:px-6 lg:px-8 w-full">
      <Card className="shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
            <Wand2 className="w-7 h-7 text-primary" /> Create Your Logo
          </CardTitle>
          <CardDescription className="text-sm">
            Tell us about your business, and we'll craft a unique flat design logo for you.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="businessNameNovice" className="flex items-center gap-1 text-sm">
                  Business Name
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-3 h-3 text-muted-foreground cursor-help" />
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
                  className="text-sm"
                />
              </div>
              <div className="space-y-1">
                 <Label htmlFor="businessDescriptionNovice" className="flex items-center gap-1 text-sm">
                  Business Description / Slogan
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-3 h-3 text-muted-foreground cursor-help" />
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
                  rows={3}
                  className="text-sm min-h-[80px]"
                />
                <div className="flex gap-2 mt-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full text-xs" disabled={isSuggesting || !businessName.trim()} onClick={() => handleGenerateSuggestions('description')}>
                        {isSuggesting ? <LoadingSpinner size="sm" className="mr-2" /> : <Lightbulb className="mr-2 h-3 w-3" />}
                        Suggest Descriptions
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                      <div className="grid gap-4">
                        <div className="space-y-2">
                          <h4 className="font-medium leading-none">Description Suggestions</h4>
                          <p className="text-sm text-muted-foreground">
                            Click to use a suggestion.
                          </p>
                        </div>
                        {descriptionSuggestions.length > 0 ? (
                          <div className="space-y-2">
                            {descriptionSuggestions.map((desc, index) => (
                              <Button key={index} variant="ghost" className="w-full justify-start h-auto text-wrap text-left" onClick={() => setBusinessDescription(desc)}>
                                {desc}
                              </Button>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No suggestions yet. Click "Suggest Descriptions" to generate some!</p>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full text-xs" disabled={isSuggesting || !businessName.trim()} onClick={() => handleGenerateSuggestions('slogan')}>
                        {isSuggesting ? <LoadingSpinner size="sm" className="mr-2" /> : <Lightbulb className="mr-2 h-3 w-3" />}
                        Suggest Slogans
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                      <div className="grid gap-4">
                        <div className="space-y-2">
                          <h4 className="font-medium leading-none">Slogan Suggestions</h4>
                          <p className="text-sm text-muted-foreground">
                            Click to use a suggestion.
                          </p>
                        </div>
                        {sloganSuggestions.length > 0 ? (
                          <div className="space-y-2">
                            {sloganSuggestions.map((slogan, index) => (
                              <Button key={index} variant="ghost" className="w-full justify-start h-auto text-wrap text-left" onClick={() => setBusinessDescription(slogan)}>
                                {slogan}
                              </Button>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No suggestions yet. Click "Suggest Slogans" to generate some!</p>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            <div className="space-y-2 p-3 border rounded-md bg-secondary/30">
              <div className="flex items-center gap-2">
                 <Palette className="w-4 h-4 text-primary" />
                 <h4 className="font-medium text-sm">Choose Your Colors (Optional)</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <SimpleColorPicker label="Primary Color" color={primaryColor} setColor={setPrimaryColor} />
                <SimpleColorPicker label="Secondary Color" color={secondaryColor} setColor={setSecondaryColor} />
              </div>
               <p className="text-xs text-muted-foreground">These colors will guide the AI in generating your logo.</p>
              <div className="flex gap-2 mt-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full text-xs" disabled={isSuggesting || !businessName.trim()} onClick={() => handleGenerateSuggestions('color')}>
                      {isSuggesting ? <LoadingSpinner size="sm" className="mr-2" /> : <Lightbulb className="mr-2 h-3 w-3" />}
                      Suggest Colors
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
                        <div className="space-y-2">
                          {colorSuggestions.map((color, index) => (
                            <div key={index} className="flex items-center justify-between gap-2">
                              <span className="flex items-center gap-2 text-sm">
                                <span className="w-4 h-4 rounded-full" style={{ backgroundColor: color }}></span>
                                {color}
                              </span>
                              <div className="flex gap-1">
                                <Button variant="outline" size="xs" onClick={() => setPrimaryColor(color)}>Primary</Button>
                                <Button variant="outline" size="xs" onClick={() => setSecondaryColor(color)}>Secondary</Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No suggestions yet. Click "Suggest Colors" to generate some!</p>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full text-xs" disabled={isSuggesting || !businessName.trim()} onClick={() => handleGenerateSuggestions('icon')}>
                      {isSuggesting ? <LoadingSpinner size="sm" className="mr-2" /> : <Lightbulb className="mr-2 h-3 w-3" />}
                      Suggest Icons
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <h4 className="font-medium leading-none">Icon Suggestions</h4>
                        <p className="text-sm text-muted-foreground">
                          Click to add a suggestion to your description.
                        </p>
                      </div>
                      {iconSuggestions.length > 0 ? (
                        <div className="space-y-2">
                          {iconSuggestions.map((icon, index) => (
                            <Button key={index} variant="ghost" className="w-full justify-start h-auto text-wrap text-left" onClick={() => setBusinessDescription(prev => `${prev.trim()} ${icon.trim()}`)}>
                              {icon}
                            </Button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No suggestions yet. Click "Suggest Icons" to generate some!</p>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-2 p-3 border rounded-md bg-secondary/30">
              <div className="flex items-center gap-2">
                <Type className="w-4 h-4 text-primary" />
                <h4 className="font-medium text-sm">Choose Your Font (Optional)</h4>
              </div>
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center gap-2">
                  <Label htmlFor="font-select" className="text-sm">Font Style:</Label>
                  <Select onValueChange={setSelectedFont} defaultValue={selectedFont}>
                    <SelectTrigger id="font-select" className="w-[180px] text-sm">
                      <SelectValue placeholder="Select a font" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableFonts.map((font) => (
                        <SelectItem key={font} value={font} className="text-sm">
                          {font}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Select a font style to influence the logo text.</p>
            </div>

            <div className="space-y-2 p-3 border rounded-md bg-secondary/30">
              <div className="flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-primary" /> {/* Reusing Wand2 for layout, consider a more specific icon if available */}
                <h4 className="font-medium text-sm">Choose Your Layout (Optional)</h4>
              </div>
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center gap-2">
                  <Label htmlFor="layout-select" className="text-sm">Layout Style:</Label>
                  <Select onValueChange={setSelectedLayout} defaultValue={selectedLayout}>
                    <SelectTrigger id="layout-select" className="w-[220px] text-sm">
                      <SelectValue placeholder="Select a layout" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Icon Above Text">Icon Above Text</SelectItem>
                      <SelectItem value="Icon Left of Text">Icon Left of Text</SelectItem>
                      <SelectItem value="Text Only">Text Only</SelectItem>
                      <SelectItem value="Icon Only">Icon Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Choose how the icon and text are arranged in your logo.</p>
            </div>

            <div className="pt-2">
              <LogoDisplayArea logoSrc={logoSrc} isLoading={isLoading} businessName={businessName} />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row justify-center items-center gap-3 py-4">
            <Button type="submit" size="sm" disabled={isLoading} className="w-full sm:w-auto text-base">
              {isLoading ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : (
                <Wand2 className="mr-2 h-4 w-4" />
              )}
              Generate Logo
            </Button>
            {user && logoSrc && (
              <Button onClick={handleSaveNoviceGeneration} variant="outline" size="sm" className="w-full sm:w-auto text-base" disabled={isLoading}>
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
