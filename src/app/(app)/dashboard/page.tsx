"use client";

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { History, Palette, Edit3, Sparkles, ImageOff, Download, Trash2, ArrowUpRight } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { DeleteConfirmationDialog } from '@/components/DeleteConfirmationDialog';
import Link from 'next/link';

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
  const { user, isLoaded, isSignedIn } = useUser();
  const { toast } = useToast();

  const [textPromptHistory, setTextPromptHistory] = useState<TextPromptHistoryItem[]>([]);
  const [noviceGenerations, setNoviceGenerations] = useState<NoviceGeneration[]>([]);
  const [professionalGenerations, setProfessionalGenerations] = useState<ProfessionalGeneration[]>([]);
  const [imageEditorGenerations, setImageEditorGenerations] = useState<ImageEditorGeneration[]>([]);
  
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isLoadingNovice, setIsLoadingNovice] = useState(true);
  const [isLoadingProfessional, setIsLoadingProfessional] = useState(true);
  const [isLoadingImageEditor, setIsLoadingImageEditor] = useState(true);

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; type: 'novice' | 'professional' | 'imageEditor' | 'textPrompt' } | null>(null);

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
      }
    } catch (e) {
      console.warn("Failed to fetch text prompt history");
    } finally {
      setIsLoadingHistory(false);
    }

    try {
      const noviceRes = await fetch(`/api/generations/novice?userId=${userId}`);
      const noviceData = await noviceRes.json();
      if (noviceData.success) {
        setNoviceGenerations(noviceData.data);
      }
    } catch (e) {
      console.warn("Failed to fetch novice logos");
    } finally {
      setIsLoadingNovice(false);
    }

    try {
      const proRes = await fetch(`/api/generations/professional?userId=${userId}`);
      const proData = await proRes.json();
      if (proData.success) {
        setProfessionalGenerations(proData.data);
      }
    } catch (e) {
      console.warn("Failed to fetch pro logos");
    } finally {
      setIsLoadingProfessional(false);
    }
    
    try {
      const imgEditRes = await fetch(`/api/generations/image-editor?userId=${userId}`);
      const imgEditData = await imgEditRes.json();
      if (imgEditData.success) {
        setImageEditorGenerations(imgEditData.data);
      }
    } catch (e) {
      console.warn("Failed to fetch image editor logos");
    } finally {
      setIsLoadingImageEditor(false);
    }
  };

  useEffect(() => {
    if (isLoaded && isSignedIn && user?.id) {
      fetchAllData(user.id);
    } else if (isLoaded && !isSignedIn) {
      setIsLoadingHistory(false);
      setIsLoadingNovice(false);
      setIsLoadingProfessional(false);
      setIsLoadingImageEditor(false);
    }
  }, [user, isLoaded, isSignedIn]);

  const handleDeleteConfirmation = (id: string, type: 'novice' | 'professional' | 'imageEditor' | 'textPrompt') => {
    setItemToDelete({ id, type });
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete || !user?.id) return;

    setIsDeleteConfirmOpen(false);
    const { id, type } = itemToDelete;
    let endpoint = '';
    let successMessage = '';
    let errorMessage = '';

    switch (type) {
      case 'novice':
        endpoint = `/api/generations/novice?id=${id}`;
        successMessage = 'Logo deleted successfully.';
        errorMessage = 'Failed to delete logo.';
        break;
      case 'professional':
        endpoint = `/api/generations/professional?id=${id}`;
        successMessage = 'Pro logo deleted successfully.';
        errorMessage = 'Failed to delete pro logo.';
        break;
      case 'imageEditor':
        endpoint = `/api/generations/image-editor?id=${id}`;
        successMessage = 'Image logo deleted successfully.';
        errorMessage = 'Failed to delete image logo.';
        break;
      case 'textPrompt':
        endpoint = `/api/user/prompt-history?prompt=${encodeURIComponent(textPromptHistory[Number(id)] ?? "")}`;
        successMessage = 'Prompt deleted successfully.';
        errorMessage = 'Failed to delete prompt.';
        break;
    }

    try {
      const res = await fetch(endpoint, { method: 'DELETE' });
      const data = await res.json();

      if (data.success) {
        toast({ title: "Success", description: successMessage });
        if (type === 'novice') setNoviceGenerations(prev => prev.filter(item => item._id !== id));
        else if (type === 'professional') setProfessionalGenerations(prev => prev.filter(item => item._id !== id));
        else if (type === 'imageEditor') setImageEditorGenerations(prev => prev.filter(item => item._id !== id));
        else if (type === 'textPrompt') {
          setTextPromptHistory(prev => prev.filter((_, index) => index.toString() !== id));
        }
      } else {
        toast({ title: "Error", description: data.message || errorMessage, variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Network Error", description: `Could not delete item.`, variant: "destructive" });
    } finally {
      setItemToDelete(null);
    }
  };

  const downloadLogo = (logoDataUri: string, filenamePrefix: string = "logo") => {
    const link = document.createElement('a');
    link.href = logoDataUri;
    const safeFileName = filenamePrefix.replace(/[^a-z0-9_]/gi, '_').toLowerCase();
    link.download = `${safeFileName}_flatify_ai.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Downloading...", description: "Your logo is downloading."});
  };

  if (!isLoaded || (isLoaded && !isSignedIn)) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center p-4">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  return (
    <div className="relative min-h-dvh min-w-0 overflow-x-hidden bg-ink p-4 text-chalk selection:bg-cobalt selection:text-chalk sm:p-8">
      <div className="grain" />

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        {/* Header Title Section */}
        <div className="glass-card flex flex-col items-start justify-between gap-6 rounded-3xl border border-white/10 p-6 md:flex-row md:items-center md:p-8">
          <div className="min-w-0 space-y-2">
            <div className="inline-flex items-center gap-2 rounded-md border border-cobalt/30 bg-cobalt/15 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-saffron">
              <Sparkles className="w-3.5 h-3.5 text-saffron" />
              Flatify AI Studio Dashboard
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight text-balance">
              Welcome back, <span className="text-saffron">{user?.firstName || "there"}</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Manage your AI generations, exported SVG logos, prompt history, and studio assets.
            </p>
          </div>

          <Link href="/generate" className="w-full md:w-auto">
            <Button className="btn-press flex w-full items-center justify-center gap-2 rounded-md bg-cobalt px-6 py-6 text-xs font-semibold text-chalk hover:bg-[#4A70FF] md:w-auto">
              <Sparkles className="w-4 h-4" />
              <span>New AI Generation</span>
              <ArrowUpRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-card p-5 rounded-2xl border border-white/5">
            <div className="text-xs text-slate-400 mb-1">Small Business Logos</div>
            <div className="text-2xl font-black text-white">{noviceGenerations.length}</div>
          </div>
          <div className="glass-card p-5 rounded-2xl border border-white/5">
            <div className="text-xs text-slate-400 mb-1">Professional Designs</div>
            <div className="text-2xl font-black text-white">{professionalGenerations.length}</div>
          </div>
          <div className="glass-card p-5 rounded-2xl border border-white/5">
            <div className="text-xs text-slate-400 mb-1">Image-Based Exports</div>
            <div className="text-2xl font-black text-white">{imageEditorGenerations.length}</div>
          </div>
          <div className="glass-card p-5 rounded-2xl border border-white/5">
            <div className="text-xs text-slate-400 mb-1">Saved Text Prompts</div>
            <div className="text-2xl font-black text-white">{textPromptHistory.length}</div>
          </div>
        </div>

        {/* Studio Content Tabs */}
        <Tabs defaultValue="novice" className="w-full space-y-6">
          <TabsList className="glass-panel grid h-auto w-full grid-cols-2 gap-1 rounded-2xl border border-white/10 p-1.5 md:grid-cols-4">
            <TabsTrigger
              value="novice"
              className="flex min-h-11 items-center justify-center gap-1 rounded-md px-1 py-3 text-[10px] font-semibold text-mist transition-colors duration-200 ease-out data-[state=active]:bg-cobalt data-[state=active]:text-chalk sm:gap-2 sm:text-xs"
            >
              <Palette className="h-4 w-4 shrink-0" />
              <span className="truncate">Business</span>
            </TabsTrigger>
            <TabsTrigger
              value="professional"
              className="flex min-h-11 items-center justify-center gap-1 rounded-md px-1 py-3 text-[10px] font-semibold text-mist transition-colors duration-200 ease-out data-[state=active]:bg-cobalt data-[state=active]:text-chalk sm:gap-2 sm:text-xs"
            >
              <Sparkles className="h-4 w-4 shrink-0" />
              <span className="truncate">Pro</span>
            </TabsTrigger>
            <TabsTrigger
              value="imageEditor"
              className="flex min-h-11 items-center justify-center gap-1 rounded-md px-1 py-3 text-[10px] font-semibold text-mist transition-colors duration-200 ease-out data-[state=active]:bg-cobalt data-[state=active]:text-chalk sm:gap-2 sm:text-xs"
            >
              <Edit3 className="h-4 w-4 shrink-0" />
              <span className="truncate">Image</span>
            </TabsTrigger>
            <TabsTrigger
              value="textHistory"
              className="flex min-h-11 items-center justify-center gap-1 rounded-md px-1 py-3 text-[10px] font-semibold text-mist transition-colors duration-200 ease-out data-[state=active]:bg-cobalt data-[state=active]:text-chalk sm:gap-2 sm:text-xs"
            >
              <History className="h-4 w-4 shrink-0" />
              <span className="truncate">Prompts</span>
            </TabsTrigger>
          </TabsList>

          {/* Novice Tab */}
          <TabsContent value="novice" className="space-y-4 focus-visible:outline-none">
            {isLoadingNovice ? (
              <div className="flex justify-center p-12 glass-card rounded-2xl"><LoadingSpinner size="lg" /></div>
            ) : noviceGenerations.length === 0 ? (
              <div className="text-center p-12 glass-card rounded-2xl space-y-3">
                <ImageOff className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-sm text-slate-400">No Small Business logos generated yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {noviceGenerations.map((gen) => (
                  <Card key={gen._id} className="glass-card border-white/10 rounded-2xl overflow-hidden flex flex-col justify-between">
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="truncate text-base text-white">{gen.businessName}</CardTitle>
                      <CardDescription className="text-xs text-slate-400 line-clamp-2">{gen.businessDescription}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 flex items-center justify-center bg-slate-950/60 my-2">
                      <Image src={gen.logoDataUri} alt={gen.businessName} width={200} height={200} className="object-contain max-h-44 rounded-lg" />
                    </CardContent>
                    <CardFooter className="p-4 pt-2 flex items-center justify-between border-t border-white/5 text-xs text-slate-400">
                      <span>{format(new Date(gen.createdAt), 'MMM d, yyyy')}</span>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => downloadLogo(gen.logoDataUri, gen.businessName)} className="h-8 px-2 text-cobalt hover:text-chalk">
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDeleteConfirmation(gen._id, 'novice')} className="h-8 px-2 text-rose-400 hover:text-rose-300">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Pro Tab */}
          <TabsContent value="professional" className="space-y-4 focus-visible:outline-none">
            {isLoadingProfessional ? (
              <div className="flex justify-center p-12 glass-card rounded-2xl"><LoadingSpinner size="lg" /></div>
            ) : professionalGenerations.length === 0 ? (
              <div className="text-center p-12 glass-card rounded-2xl space-y-3">
                <ImageOff className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-sm text-slate-400">No Pro Studio designs generated yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {professionalGenerations.map((gen) => (
                  <Card key={gen._id} className="glass-card border-white/10 rounded-2xl overflow-hidden flex flex-col justify-between">
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-sm text-white line-clamp-1">Prompt: &quot;{gen.usedPrompt}&quot;</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 flex items-center justify-center bg-slate-950/60 my-2">
                      <Image src={gen.logoDataUri} alt="Pro Logo" width={200} height={200} className="object-contain max-h-44 rounded-lg" />
                    </CardContent>
                    <CardFooter className="p-4 pt-2 flex items-center justify-between border-t border-white/5 text-xs text-slate-400">
                      <span>{format(new Date(gen.createdAt), 'MMM d, yyyy')}</span>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => downloadLogo(gen.logoDataUri, "pro_logo")} className="h-8 px-2 text-cobalt hover:text-chalk">
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDeleteConfirmation(gen._id, 'professional')} className="h-8 px-2 text-rose-400 hover:text-rose-300">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Image Editor Tab */}
          <TabsContent value="imageEditor" className="space-y-4 focus-visible:outline-none">
            {isLoadingImageEditor ? (
              <div className="flex justify-center p-12 glass-card rounded-2xl"><LoadingSpinner size="lg" /></div>
            ) : imageEditorGenerations.length === 0 ? (
              <div className="text-center p-12 glass-card rounded-2xl space-y-3">
                <ImageOff className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-sm text-slate-400">No Image Editor generations yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {imageEditorGenerations.map((gen) => (
                  <Card key={gen._id} className="glass-card border-white/10 rounded-2xl overflow-hidden flex flex-col justify-between">
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="truncate text-base text-white">{gen.businessName}</CardTitle>
                      <CardDescription className="text-xs text-slate-400 line-clamp-1">{gen.businessDescription}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 flex items-center justify-center bg-slate-950/60 my-2">
                      <Image src={gen.logoDataUri} alt={gen.businessName} width={200} height={200} className="object-contain max-h-44 rounded-lg" />
                    </CardContent>
                    <CardFooter className="p-4 pt-2 flex items-center justify-between border-t border-white/5 text-xs text-slate-400">
                      <span>{format(new Date(gen.createdAt), 'MMM d, yyyy')}</span>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => downloadLogo(gen.logoDataUri, gen.businessName)} className="h-8 px-2 text-cobalt hover:text-chalk">
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDeleteConfirmation(gen._id, 'imageEditor')} className="h-8 px-2 text-rose-400 hover:text-rose-300">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Prompt History Tab */}
          <TabsContent value="textHistory" className="space-y-4 focus-visible:outline-none">
            {isLoadingHistory ? (
              <div className="flex justify-center p-12 glass-card rounded-2xl"><LoadingSpinner size="lg" /></div>
            ) : textPromptHistory.length === 0 ? (
              <div className="text-center p-12 glass-card rounded-2xl space-y-3">
                <History className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-sm text-slate-400">No prompt history saved yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {textPromptHistory.map((promptText, idx) => (
                  <div key={idx} className="glass-card flex min-w-0 items-center justify-between gap-3 rounded-xl border border-white/5 p-4 text-xs text-slate-200">
                    <span className="min-w-0 flex-1 truncate font-mono">{promptText}</span>
                    <Button size="sm" variant="ghost" onClick={() => handleDeleteConfirmation(idx.toString(), 'textPrompt')} className="h-8 shrink-0 px-2 text-rose-400 hover:text-rose-300">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Delete Confirmation Dialog */}
        <DeleteConfirmationDialog
          isOpen={isDeleteConfirmOpen}
          onClose={() => setIsDeleteConfirmOpen(false)}
          onConfirm={handleConfirmDelete}
          title="Delete Saved Generation"
          description="Are you sure you want to delete this item? This action cannot be undone."
        />
      </div>
    </div>
  );
}
