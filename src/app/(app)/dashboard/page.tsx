
"use client";

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutDashboard, History, AlertCircle, Palette, Edit3, Sparkles, ImageOff, Download } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';

interface NoviceGeneration {
  _id: string;
  businessName: string;
  businessDescription: string;
  primaryColor?: string;
  secondaryColor?: string;
  logoDataUri: string;
  createdAt: string;
}

interface ProfessionalGeneration {
  _id: string;
  originalPrompt?: string;
  refinedPrompt?: string;
  usedPrompt: string;
  logoDataUri: string;
  createdAt: string;
}

interface ImageEditorGeneration {
  _id: string;
  sourceImageUri: string;
  sourceImageOriginalName?: string;
  businessName: string;
  businessDescription: string;
  logoDataUri: string;
  createdAt: string;
}

type TextPromptHistoryItem = string; 

export default function DashboardPage() {
  const { currentUser, isLoadingAuth } = useAuth();
  const { toast } = useToast();

  const [textPromptHistory, setTextPromptHistory] = useState<TextPromptHistoryItem[]>([]);
  const [noviceGenerations, setNoviceGenerations] = useState<NoviceGeneration[]>([]);
  const [professionalGenerations, setProfessionalGenerations] = useState<ProfessionalGeneration[]>([]);
  const [imageEditorGenerations, setImageEditorGenerations] = useState<ImageEditorGeneration[]>([]);
  
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isLoadingNovice, setIsLoadingNovice] = useState(true);
  const [isLoadingProfessional, setIsLoadingProfessional] = useState(true);
  const [isLoadingImageEditor, setIsLoadingImageEditor] = useState(true);

  const fetchAllData = async (userId: string) => {
    setIsLoadingHistory(true);
    setIsLoadingNovice(true);
    setIsLoadingProfessional(true);
    setIsLoadingImageEditor(true);

    try {
      const historyRes = await fetch(`/api/user/prompt-history?userId=${userId}`);
      const historyData = await historyRes.json();
      if (historyData.success && historyData.promptHistory) {
        setTextPromptHistory(historyData.promptHistory);
      } else {
        // toast({ title: "Error fetching text history", description: historyData.message, variant: "destructive" });
        console.warn("Failed to fetch text prompt history:", historyData.message);
      }
    } catch (e) { toast({ title: "Network Error", description: "Could not fetch text prompt history.", variant: "destructive"}); }
    finally { setIsLoadingHistory(false); }

    try {
      const noviceRes = await fetch(`/api/generations/novice?userId=${userId}`);
      const noviceData = await noviceRes.json();
      if (noviceData.success) {
        setNoviceGenerations(noviceData.data);
      } else {
        // toast({ title: "Error fetching Novice logos", description: noviceData.message, variant: "destructive" });
         console.warn("Failed to fetch novice logos:", noviceData.message);
      }
    } catch (e) { toast({ title: "Network Error", description: "Could not fetch Novice logos.", variant: "destructive"});}
    finally { setIsLoadingNovice(false); }

    try {
      const proRes = await fetch(`/api/generations/professional?userId=${userId}`);
      const proData = await proRes.json();
      if (proData.success) {
        setProfessionalGenerations(proData.data);
      } else {
        // toast({ title: "Error fetching Pro logos", description: proData.message, variant: "destructive" });
        console.warn("Failed to fetch pro logos:", proData.message);
      }
    } catch (e) { toast({ title: "Network Error", description: "Could not fetch Pro logos.", variant: "destructive"});}
    finally { setIsLoadingProfessional(false); }
    
    try {
      const imgEditRes = await fetch(`/api/generations/image-editor?userId=${userId}`);
      const imgEditData = await imgEditRes.json();
      if (imgEditData.success) {
        setImageEditorGenerations(imgEditData.data);
      } else {
        // toast({ title: "Error fetching Image Editor logos", description: imgEditData.message, variant: "destructive" });
        console.warn("Failed to fetch image editor logos:", imgEditData.message);
      }
    } catch (e) { toast({ title: "Network Error", description: "Could not fetch Image Editor logos.", variant: "destructive"});}
    finally { setIsLoadingImageEditor(false); }
  };

  useEffect(() => {
    if (!isLoadingAuth && currentUser && currentUser.id) {
      fetchAllData(currentUser.id);
    } else if (!isLoadingAuth && !currentUser) {
      setIsLoadingHistory(false);
      setIsLoadingNovice(false);
      setIsLoadingProfessional(false);
      setIsLoadingImageEditor(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, isLoadingAuth]); // Removed toast from deps

  const downloadLogo = (logoDataUri: string, filenamePrefix: string = "logo") => {
    const link = document.createElement('a');
    link.href = logoDataUri;
    const safeFileName = filenamePrefix.replace(/[^a-z0-9_]/gi, '_').toLowerCase();
    link.download = `${safeFileName}_flatify_ai_saved.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Downloading...", description: "Your logo will be downloaded shortly."});
  };

  if (isLoadingAuth) {
    return (
      <div className="flex items-center justify-center flex-grow p-4">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center flex-grow p-4 text-center">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Access Denied</h2>
        <p className="text-muted-foreground">Please log in to view your dashboard.</p>
      </div>
    );
  }
  
  const isOverallLoading = isLoadingHistory || isLoadingNovice || isLoadingProfessional || isLoadingImageEditor;

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-6xl mx-auto shadow-xl border-2 border-primary/10 rounded-xl overflow-hidden">
        <CardHeader className="pb-4 bg-card">
          <div className="flex items-center gap-3 mb-2">
            <LayoutDashboard className="w-10 h-10 text-primary" />
            <div>
              <CardTitle className="text-3xl sm:text-4xl font-bold">My Dashboard</CardTitle>
              <CardDescription className="text-md sm:text-lg text-muted-foreground mt-1">
                Welcome back, {currentUser.name}! Review your creations and prompt history.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-8">
          {isOverallLoading && (
             <div className="flex flex-col items-center justify-center p-10 min-h-[400px]">
                <LoadingSpinner size="xl" />
                <p className="mt-4 text-lg text-muted-foreground">Loading your creative work...</p>
              </div>
          )}

          {!isOverallLoading && (
            <Tabs defaultValue="novice_logos" className="w-full">
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 mb-6 bg-muted/60 p-1.5 rounded-lg">
                <TabsTrigger value="novice_logos" className="gap-2 py-2.5"><Palette className="w-5 h-5" /> Novice</TabsTrigger>
                <TabsTrigger value="pro_logos" className="gap-2 py-2.5"><Sparkles className="w-5 h-5" />Pro</TabsTrigger>
                <TabsTrigger value="image_editor_logos" className="gap-2 py-2.5"><Edit3 className="w-5 h-5" />Image-Based</TabsTrigger>
                <TabsTrigger value="text_prompts" className="gap-2 py-2.5"><History className="w-5 h-5" />Text Prompts</TabsTrigger>
              </TabsList>

              <TabsContent value="novice_logos">
                <section>
                  <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2"><Palette className="w-7 h-7 text-accent" /> Novice Logos</h2>
                  {noviceGenerations.length === 0 ? (
                    <div className="text-center py-10 px-4 border-2 border-dashed rounded-lg bg-card">
                      <ImageOff className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <p className="text-lg text-muted-foreground">No logos found from the Novice generator.</p>
                      <p className="text-sm text-muted-foreground mt-1">Try creating some in the "Generate" section!</p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[600px] p-1 -m-1">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {noviceGenerations.map((item) => (
                          <Card key={item._id} className="overflow-hidden group transition-all hover:shadow-xl">
                            <CardContent className="p-0 aspect-square flex items-center justify-center bg-secondary/20 group-hover:bg-secondary/30 transition-colors">
                              <Image src={item.logoDataUri} alt={`Logo for ${item.businessName}`} width={250} height={250} className="object-contain max-h-full max-w-full p-3 transition-transform group-hover:scale-105" data-ai-hint="generated logo" />
                            </CardContent>
                            <CardHeader className="p-3 space-y-0.5">
                              <CardTitle className="text-base font-semibold truncate" title={item.businessName}>{item.businessName}</CardTitle>
                              <CardDescription className="text-xs text-muted-foreground truncate" title={item.businessDescription}>
                                {item.businessDescription.substring(0,100)}{item.businessDescription.length > 100 ? '...' : ''}
                              </CardDescription>
                              {(item.primaryColor || item.secondaryColor) && (
                                <div className="flex items-center gap-1.5 pt-1">
                                  {item.primaryColor && <div className="w-3.5 h-3.5 rounded-full border border-border" style={{backgroundColor: item.primaryColor}} title={`Primary: ${item.primaryColor}`}></div>}
                                  {item.secondaryColor && <div className="w-3.5 h-3.5 rounded-full border border-border" style={{backgroundColor: item.secondaryColor}} title={`Secondary: ${item.secondaryColor}`}></div>}
                                </div>
                              )}
                            </CardHeader>
                            <CardFooter className="p-3 flex justify-between items-center text-xs text-muted-foreground border-t">
                              <span>{format(new Date(item.createdAt), "MMM d, yyyy")}</span>
                              <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => downloadLogo(item.logoDataUri, item.businessName)} title="Download Logo">
                                <Download className="w-4 h-4" />
                              </Button>
                            </CardFooter>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </section>
              </TabsContent>

              <TabsContent value="pro_logos">
                 <section>
                  <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2"><Sparkles className="w-7 h-7 text-accent" /> Professional Logos</h2>
                  {professionalGenerations.length === 0 ? (
                    <div className="text-center py-10 px-4 border-2 border-dashed rounded-lg bg-card">
                       <ImageOff className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <p className="text-lg text-muted-foreground">No logos found from the Professional generator.</p>
                    </div>
                  ) : (
                     <ScrollArea className="h-[600px] p-1 -m-1">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {professionalGenerations.map((item) => (
                          <Card key={item._id} className="overflow-hidden group transition-all hover:shadow-xl">
                            <CardContent className="p-0 aspect-square flex items-center justify-center bg-secondary/20 group-hover:bg-secondary/30 transition-colors">
                              <Image src={item.logoDataUri} alt={`Professional Logo based on: ${item.usedPrompt.substring(0,30)}...`} width={250} height={250} className="object-contain max-h-full max-w-full p-3 transition-transform group-hover:scale-105" data-ai-hint="pro generated logo" />
                            </CardContent>
                             <CardHeader className="p-3 space-y-0.5">
                              <CardTitle className="text-base font-semibold truncate" title={item.usedPrompt}>Used Prompt</CardTitle>
                              <CardDescription className="text-xs text-muted-foreground truncate" title={item.usedPrompt}>
                                {item.usedPrompt.substring(0,100)}{item.usedPrompt.length > 100 ? '...' : ''}
                              </CardDescription>
                            </CardHeader>
                            <CardFooter className="p-3 flex justify-between items-center text-xs text-muted-foreground border-t">
                              <span>{format(new Date(item.createdAt), "MMM d, yyyy")}</span>
                              <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => downloadLogo(item.logoDataUri, "pro_logo")} title="Download Logo">
                                <Download className="w-4 h-4" />
                              </Button>
                            </CardFooter>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </section>
              </TabsContent>

              <TabsContent value="image_editor_logos">
                 <section>
                  <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2"><Edit3 className="w-7 h-7 text-accent" /> Image-Based Logos</h2>
                  {imageEditorGenerations.length === 0 ? (
                     <div className="text-center py-10 px-4 border-2 border-dashed rounded-lg bg-card">
                       <ImageOff className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <p className="text-lg text-muted-foreground">No logos found from the Image-Based generator.</p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[600px] p-1 -m-1">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {imageEditorGenerations.map((item) => (
                          <Card key={item._id} className="overflow-hidden group transition-all hover:shadow-xl">
                             <CardContent className="p-0 aspect-square flex items-center justify-center bg-secondary/20 group-hover:bg-secondary/30 transition-colors">
                              <Image src={item.logoDataUri} alt={`Logo for ${item.businessName} (image-based)`} width={250} height={250} className="object-contain max-h-full max-w-full p-3 transition-transform group-hover:scale-105" data-ai-hint="image based logo" />
                            </CardContent>
                            <CardHeader className="p-3 space-y-0.5">
                              <CardTitle className="text-base font-semibold truncate" title={item.businessName}>{item.businessName}</CardTitle>
                              <CardDescription className="text-xs text-muted-foreground truncate" title={item.businessDescription}>
                                {item.businessDescription.substring(0,70)}{item.businessDescription.length > 70 ? '...' : ''}
                              </CardDescription>
                               <CardDescription className="text-xs text-muted-foreground truncate mt-0.5" title={item.sourceImageOriginalName || 'Uploaded source image'}>
                                Src: {item.sourceImageOriginalName ? item.sourceImageOriginalName.substring(0,30) : 'Uploaded Image'}{item.sourceImageOriginalName && item.sourceImageOriginalName.length > 30 ? '...' : ''}
                              </CardDescription>
                            </CardHeader>
                            <CardFooter className="p-3 flex justify-between items-center text-xs text-muted-foreground border-t">
                              <span>{format(new Date(item.createdAt), "MMM d, yyyy")}</span>
                               <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => downloadLogo(item.logoDataUri, item.businessName)} title="Download Logo">
                                <Download className="w-4 h-4" />
                              </Button>
                            </CardFooter>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </section>
              </TabsContent>

              <TabsContent value="text_prompts">
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <History className="w-7 h-7 text-accent" />
                    <h2 className="text-2xl font-semibold">Text Prompt History (Pro)</h2>
                  </div>
                  {textPromptHistory.length === 0 ? (
                    <div className="text-center py-10 px-4 border-2 border-dashed rounded-lg bg-card">
                      <History className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <p className="text-lg text-muted-foreground">No text prompts used in the Professional Generator yet.</p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[500px] p-4 border rounded-lg bg-card shadow-inner">
                      <ul className="space-y-3">
                        {textPromptHistory.map((prompt, index) => (
                          <li 
                            key={index} 
                            className="p-3.5 bg-background border rounded-md shadow-sm hover:shadow-md transition-shadow"
                          >
                            <p className="text-sm text-foreground leading-relaxed">{prompt}</p>
                          </li>
                        ))}
                      </ul>
                    </ScrollArea>
                  )}
                </section>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
