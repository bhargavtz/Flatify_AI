
"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { generateInitialLogo } from '@/ai/flows/generate-initial-logo';
import { refineLogoPrompt } from '@/ai/flows/refine-logo-prompt';
import { useToast } from '@/hooks/use-toast';
import { LogoDisplayArea } from './LogoDisplayArea';
import { Wand2, Sparkles, Copy, RotateCcw, Trash2, ListChecks, BookOpen, History, Save } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from './LoadingSpinner';

const MAX_HISTORY_ITEMS_LOCALSTORAGE = 10; 

const examplePrompts = [
  { id: "tech", name: "Tech Startup", value: "A minimalist flat design logo for a tech startup named 'InnovateX', using shades of blue and teal, with a subtle abstract geometric shape representing connectivity." },
  { id: "coffee", name: "Coffee Shop", value: "A friendly, modern flat design logo for a coffee shop 'The Daily Grind', featuring a stylized coffee bean and warm, earthy tones." },
  { id: "eco", name: "Eco Brand", value: "An organic, clean flat design logo for an eco-friendly brand 'GreenLeaf Essentials', using leaf motifs and shades of green and brown." },
  { id: "fitness", name: "Fitness App", value: "A dynamic and energetic flat design logo for a fitness app 'FitFlow', incorporating an abstract representation of movement with vibrant orange and grey." },
  { id: "bookstore", name: "Bookstore", value: "A classic yet modern flat design logo for a bookstore 'Readers' Nook', featuring an open book icon and deep burgundy and cream colors." },
  { id: "bakery", name: "Artisan Bakery", value: "A charming flat design logo for 'The Sweet Spot Bakery', featuring a stylized whisk or cupcake, in pastel pinks and blues." },
  { id: "consulting", name: "Business Consulting", value: "A professional and trustworthy flat design logo for 'Stratagem Consulting', using strong geometric shapes and a corporate blue and silver palette." },
  { id: "travel", name: "Travel Agency", value: "An adventurous flat design logo for 'Wanderlust Travels', depicting a stylized globe or compass, with bright, inviting colors." }
];

export function ProfessionalGeneratorView() {
  const [prompt, setPrompt] = useState<string>(examplePrompts[0].value);
  const [refinedPrompt, setRefinedPrompt] = useState<string>('');
  const [currentUsedPrompt, setCurrentUsedPrompt] = useState<string>(''); // Store the prompt used for current generation

  const [isLoading, setIsLoading] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [logoSrc, setLogoSrc] = useState<string | null>(null);
  const [promptHistory, setPromptHistory] = useState<string[]>([]);
  const { toast } = useToast();
  const { currentUser } = useAuth(); 

  useEffect(() => {
    const loadHistory = async () => {
      if (currentUser && currentUser.id) {
        try {
          const response = await fetch(`/api/user/prompt-history?userId=${currentUser.id}`);
          const data = await response.json();
          if (data.success && data.promptHistory) {
            setPromptHistory(data.promptHistory);
          } else {
            loadHistoryFromLocalStorage();
          }
        } catch (error) {
          console.error("Failed to load prompt history from API:", error);
          loadHistoryFromLocalStorage(); 
        }
      } else {
        loadHistoryFromLocalStorage();
      }
    };
    loadHistory();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);
  
  const loadHistoryFromLocalStorage = () => {
    try {
      const storedHistory = localStorage.getItem('flatify_promptHistory');
      if (storedHistory) {
        setPromptHistory(JSON.parse(storedHistory));
      }
    } catch (error) {
      console.error("Failed to load prompt history from localStorage:", error);
    }
  };


  const updatePromptHistory = async (newPrompt: string) => {
    if (currentUser && currentUser.id) {
      try {
        const response = await fetch('/api/user/prompt-history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentUser.id, prompt: newPrompt }),
        });
        const data = await response.json();
        if (data.success && data.promptHistory) {
          setPromptHistory(data.promptHistory);
        } else {
          toast({ title: "History Error", description: "Could not save prompt to cloud history.", variant: "destructive" });
          setPromptHistory(prev => [newPrompt, ...prev.filter(p => p !== newPrompt)].slice(0, MAX_HISTORY_ITEMS_LOCALSTORAGE));
        }
      } catch (error) {
        console.error("Failed to save prompt history to API:", error);
        toast({ title: "History Error", description: "Network error saving prompt to cloud history.", variant: "destructive" });
        setPromptHistory(prev => [newPrompt, ...prev.filter(p => p !== newPrompt)].slice(0, MAX_HISTORY_ITEMS_LOCALSTORAGE));
      }
    } else {
      const updatedHistory = [newPrompt, ...promptHistory.filter(p => p !== newPrompt)].slice(0, MAX_HISTORY_ITEMS_LOCALSTORAGE);
      setPromptHistory(updatedHistory);
      try {
        localStorage.setItem('flatify_promptHistory', JSON.stringify(updatedHistory));
      } catch (error) {
        console.error("Failed to save prompt history to localStorage:", error);
      }
    }
  };

  const handleClearHistory = async () => {
    if (currentUser && currentUser.id) {
      try {
        const response = await fetch(`/api/user/prompt-history?userId=${currentUser.id}`, { method: 'DELETE' });
        const data = await response.json();
        if (data.success) {
          setPromptHistory([]);
          toast({ title: "History Cleared", description: "Your prompt history has been cleared from the cloud." });
        } else {
          toast({ title: "Error", description: data.message || "Failed to clear cloud history.", variant: "destructive" });
        }
      } catch (error) {
        toast({ title: "Error", description: "Network error clearing cloud history.", variant: "destructive" });
      }
    } else {
      setPromptHistory([]);
      localStorage.removeItem('flatify_promptHistory');
      toast({ title: "Local History Cleared" });
    }
  };


  const handleRefinePrompt = async () => {
    if (!prompt.trim()) {
      toast({ title: "Prompt is empty", description: "Please enter a prompt to refine.", variant: "destructive" });
      return;
    }
    setIsRefining(true);
    setRefinedPrompt('');
    try {
      const result = await refineLogoPrompt({ prompt });
      setRefinedPrompt(result.refinedPrompt);
      toast({ title: "Prompt Refined!", description: "The AI has suggested improvements." });
    } catch (error) {
      console.error("Error refining prompt:", error);
      toast({ title: "Error", description: "Failed to refine prompt. Please try again.", variant: "destructive" });
    } finally {
      setIsRefining(false);
    }
  };

  const handleGenerateLogo = async (usePrompt: string) => {
    if (!usePrompt.trim()) {
      toast({ title: "Prompt is empty", description: "Please enter or refine a prompt.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    setLogoSrc(null);
    setCurrentUsedPrompt(usePrompt); // Store the prompt that will be used for generation
    await updatePromptHistory(usePrompt); 

    try {
      const businessNameMatch = usePrompt.match(/named '([^']+)'/i) || usePrompt.match(/named "([^"]+)"/i);
      const businessName = businessNameMatch ? businessNameMatch[1] : "CustomLogo";

      const result = await generateInitialLogo({
        businessName: businessName,
        businessDescription: usePrompt, // The entire prompt is the description here
      });
      setLogoSrc(result.logoDataUri);
      toast({ title: "Logo Generated!", description: "Your custom logo is ready." });
    } catch (error) {
      console.error("Error generating logo:", error);
      toast({ title: "Error", description: "Failed to generate logo. Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfessionalGeneration = async () => {
    if (!logoSrc || !currentUser || !currentUser.id) {
      toast({ title: "Cannot Save", description: "No logo generated or not logged in.", variant: "destructive" });
      return;
    }
    if (!currentUsedPrompt) {
      toast({ title: "Cannot Save", description: "No prompt was recorded for this generation.", variant: "destructive" });
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/generations/professional', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          originalPrompt: prompt, // The prompt currently in the textarea
          refinedPrompt: refinedPrompt, // The refined prompt if it exists
          usedPrompt: currentUsedPrompt, // The prompt that was actually sent to AI
          logoDataUri: logoSrc,
        }),
      });
      const data = await response.json();
      if (data.success) {
        toast({ title: "Logo Saved!", description: "Your professional logo generation has been saved." });
      } else {
        toast({ title: "Save Error", description: data.message || "Could not save professional logo.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Failed to save professional logo:", error);
      toast({ title: "Save Error", description: "An unexpected error occurred while saving.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };


  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => toast({ title: "Copied!", description: "Prompt copied to clipboard." }))
      .catch(() => toast({ title: "Error", description: "Failed to copy prompt.", variant: "destructive" }));
  };

  return (
    <div className="container mx-auto py-8 px-4">
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-3xl font-bold flex items-center gap-2">
              <Sparkles className="w-8 h-8 text-primary" /> Advanced Logo Generation
            </CardTitle>
            <CardDescription>
              Craft detailed prompts, use the prompt library, or leverage AI refinement for precise logo designs.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="promptLibrarySelect" className="flex items-center gap-1">
                <BookOpen className="w-4 h-4" />
                Prompt Library (Examples)
              </Label>
              <Select
                onValueChange={(selectedValue) => {
                  if (selectedValue) {
                    setPrompt(selectedValue);
                    setRefinedPrompt(''); // Clear refined prompt if new base prompt is selected
                    setLogoSrc(null); // Clear previous logo
                  }
                }}
              >
                <SelectTrigger id="promptLibrarySelect" className="w-full">
                  <SelectValue placeholder="Select an example prompt..." />
                </SelectTrigger>
                <SelectContent>
                  {examplePrompts.map((exPrompt) => (
                    <SelectItem key={exPrompt.id} value={exPrompt.value}>
                      {exPrompt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="professionalPrompt">Your Detailed Prompt</Label>
              <Textarea
                id="professionalPrompt"
                value={prompt}
                onChange={(e) => {
                  setPrompt(e.target.value);
                  setRefinedPrompt(''); // Clear refined if user edits base prompt
                }}
                placeholder="e.g., A sleek, monochrome flat logo for 'QuantumLeap AI'..."
                rows={5}
                className="text-base"
              />
              <div className="flex flex-wrap gap-2 mt-2">
                <Button onClick={handleRefinePrompt} disabled={isRefining || isLoading} variant="outline">
                  {isRefining ? (
                     <LoadingSpinner size="sm" className="mr-2" />
                  ) : <Sparkles className="mr-2 h-4 w-4" />}
                  Refine Prompt
                </Button>
                <Button onClick={() => handleGenerateLogo(prompt)} disabled={isLoading || isRefining} size="default">
                   {isLoading && !isRefining ? (
                     <LoadingSpinner size="sm" className="mr-2" />
                  ) : <Wand2 className="mr-2 h-4 w-4" />}
                  Generate with this Prompt
                </Button>
              </div>
            </div>

            {refinedPrompt && (
              <div className="space-y-2 p-4 border rounded-md bg-secondary/30">
                <Label htmlFor="refinedPromptResult" className="font-semibold">AI Refined Prompt:</Label>
                <Textarea id="refinedPromptResult" value={refinedPrompt} readOnly rows={4} className="text-base bg-background"/>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Button onClick={() => copyToClipboard(refinedPrompt)} variant="ghost" size="sm">
                    <Copy className="mr-2 h-4 w-4" /> Copy
                  </Button>
                  <Button onClick={() => { setPrompt(refinedPrompt); setRefinedPrompt(''); }} variant="ghost" size="sm">
                    <RotateCcw className="mr-2 h-4 w-4" /> Use Refined Prompt
                  </Button>
                   <Button onClick={() => handleGenerateLogo(refinedPrompt)} disabled={isLoading || isRefining} variant="outline" size="sm">
                    <Wand2 className="mr-2 h-4 w-4" /> Generate with Refined
                  </Button>
                </div>
              </div>
            )}
            
            <div className="pt-4">
              <LogoDisplayArea logoSrc={logoSrc} isLoading={isLoading} businessName="Custom Design" />
            </div>
          </CardContent>
          <CardFooter className="flex justify-center py-6">
            {currentUser && logoSrc && (
              <Button onClick={handleSaveProfessionalGeneration} variant="outline" size="lg" className="w-full sm:w-auto text-lg" disabled={isLoading}>
                <Save className="mr-2 h-5 w-5" />
                Save Professional Logo
              </Button>
            )}
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <History className="w-6 h-6 text-primary" /> Prompt History
            </CardTitle>
            <CardDescription>
              {currentUser ? "Your recently used text prompts (saved to your account)." : "Recently used text prompts (saved locally)."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {promptHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground">No text prompts in history yet.</p>
            ) : (
              <ScrollArea className="h-[300px] pr-3">
                <ul className="space-y-2">
                  {promptHistory.map((p, index) => (
                    <li key={index} 
                        className="text-xs p-2 border rounded-md hover:bg-secondary/50 cursor-pointer transition-colors"
                        onClick={() => {
                            setPrompt(p);
                            setRefinedPrompt('');
                            setLogoSrc(null);
                        }}
                        title="Click to use this prompt"
                    >
                      {p.length > 100 ? `${p.substring(0, 100)}...` : p}
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            )}
            {promptHistory.length > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-4 w-full" 
                onClick={handleClearHistory}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Clear History
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
