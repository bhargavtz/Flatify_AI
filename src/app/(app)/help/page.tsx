
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Lightbulb, Palette, Settings, Users, BookOpen, HelpCircle as PageIcon, Edit3 } from 'lucide-react'; // Added Edit3

export default function HelpPage() {
  return (
    <div className="min-h-screen pt-20 pb-16 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-purple-900/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="max-w-4xl mx-auto shadow-xl border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-xl overflow-hidden">
          <CardHeader className="pb-4 bg-transparent">
            <div className="flex items-center gap-3 mb-2">
              <PageIcon className="w-16 h-16 text-primary" />
              <div>
                <CardTitle className="text-3xl font-bold text-gray-900 dark:text-white">Help & Documentation</CardTitle>
                <CardDescription className="text-lg text-gray-600 dark:text-gray-300 mt-1">
                  Welcome to Flatify AI! Find answers and learn how to make the most of our logo generator.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 px-6 md:px-8 pb-8">
            <Accordion type="single" collapsible className="w-full" defaultValue="what-is">
              {/* Section: What is Flatify AI? */}
              <AccordionItem value="what-is" className="border-b border-border/70">
                <AccordionTrigger className="text-xl font-semibold hover:no-underline py-4">
                  <div className="flex items-center gap-3">
                    <Lightbulb className="w-6 h-6 text-accent" />
                    What is Flatify AI?
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-base text-muted-foreground leading-relaxed pt-2 pb-4 pl-1">
                  Flatify AI is an innovative application designed to help you generate unique, professional flat design logos for your business or projects. Using advanced AI, it simplifies the logo creation process, offering various modes to suit different needs.
                </AccordionContent>
              </AccordionItem>

              {/* Section: How It Works - General */}
              <AccordionItem value="how-it-works-general" className="border-b border-border/70">
                <AccordionTrigger className="text-xl font-semibold hover:no-underline py-4">
                   <div className="flex items-center gap-3">
                     <Settings className="w-6 h-6 text-accent" />
                     How It Works (General)
                   </div>
                </AccordionTrigger>
                <AccordionContent className="text-base text-muted-foreground leading-relaxed pt-2 pb-4 pl-1 space-y-3">
                  <p>Flatify AI uses generative AI models to create logos based on your input. You provide details about your business, design preferences, or even an existing image, and the AI generates a visual representation in the flat design style.</p>
                  <p>Key principles of flat design emphasized by our AI include:</p>
                  <ul className="list-disc list-inside pl-5 space-y-1.5 marker:text-primary">
                    <li><strong>Minimalism:</strong> Clean and uncluttered designs.</li>
                    <li><strong>Bold Geometric Shapes:</strong> Simple, clear forms.</li>
                    <li><strong>Vibrant Colors:</strong> Often using a bright and distinct color palette.</li>
                    <li><strong>Clean Typography:</strong> Legible and modern fonts.</li>
                    <li><strong>No 3D Effects:</strong> Absence of gradients, shadows, or textures that create depth.</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              {/* Section: For Novice Users */}
              <AccordionItem value="for-novices" className="border-b border-border/70">
                <AccordionTrigger className="text-xl font-semibold hover:no-underline py-4">
                  <div className="flex items-center gap-3">
                    <Users className="w-6 h-6 text-accent" />
                    For Small Business Owners (Novice Mode)
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-base text-muted-foreground leading-relaxed pt-2 pb-4 pl-1 space-y-3">
                  <p>If you're a small business owner, the "Novice" mode offers a guided experience:</p>
                  <ul className="list-disc list-inside pl-5 space-y-1.5 marker:text-primary">
                    <li><strong>Business Name:</strong> Enter the name of your business.</li>
                    <li><strong>Business Description/Slogan:</strong> Describe your business, its services, or its core values. This helps the AI understand the context.</li>
                    <li><strong>Optional Colors:</strong> You can suggest primary and secondary colors to guide the AI's color choices.</li>
                    <li><strong>Generate:</strong> Click "Generate Logo," and the AI will create a logo based on your input, emphasizing flat design.</li>
                  </ul>
                  <p>The goal is to provide a simple, straightforward path to a professional-looking logo without needing design expertise.</p>
                </AccordionContent>
              </AccordionItem>

              {/* Section: For Professional Users */}
              <AccordionItem value="for-professionals" className="border-b border-border/70">
                <AccordionTrigger className="text-xl font-semibold hover:no-underline py-4">
                  <div className="flex items-center gap-3">
                    <Palette className="w-6 h-6 text-accent" />
                    For Freelance Designers (Professional Mode)
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-base text-muted-foreground leading-relaxed pt-2 pb-4 pl-1 space-y-3">
                  <p>Freelance designers can leverage the "Professional" mode for more control and rapid ideation:</p>
                  <ul className="list-disc list-inside pl-5 space-y-1.5 marker:text-primary">
                    <li><strong>Detailed Prompting:</strong> Write specific, detailed prompts describing the desired logo. You can specify elements, style nuances (within flat design), imagery, and more.</li>
                    <li><strong>Prompt Library:</strong> Select from example prompts to get started quickly.</li>
                    <li><strong>Refine Prompt:</strong> Use the "Refine Prompt" feature to let the AI enhance your initial prompt.</li>
                    <li><strong>Direct Generation:</strong> Generate logos directly from your original or refined prompts.</li>
                    <li><strong>Prompt History:</strong> Access a history of your recently used prompts (saved to your account if logged in).</li>
                  </ul>
                  <p>This mode is designed for users who have a clearer vision or want to experiment with more nuanced AI inputs.</p>
                </AccordionContent>
              </AccordionItem>
              
              {/* Section: For Image-Based Generation */}
              <AccordionItem value="for-image-editor" className="border-b border-border/70">
                <AccordionTrigger className="text-xl font-semibold hover:no-underline py-4">
                  <div className="flex items-center gap-3">
                    <Edit3 className="w-6 h-6 text-accent" />
                    Image-Based Generator (Remix Mode)
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-base text-muted-foreground leading-relaxed pt-2 pb-4 pl-1 space-y-3">
                  <p>The "Image-Based Generator" mode allows you to create a new logo inspired by an existing image:</p>
                  <ul className="list-disc list-inside pl-5 space-y-1.5 marker:text-primary">
                    <li><strong>Upload Image:</strong> Upload a source image (e.g., a mood board item, an old logo, or an inspirational graphic). Max file size is 4MB.</li>
                    <li><strong>Business Name & Description:</strong> Provide your business name and a description. The AI will tailor the new logo to this information while drawing inspiration from the uploaded image.</li>
                    <li><strong>Generate:</strong> The AI will analyze the uploaded image's style, colors, and elements, then generate a *new and distinct* flat design logo suitable for your specified business.</li>
                  </ul>
                  <p>This mode is perfect for when you have a visual starting point and want the AI to reinterpret it into a fresh logo concept.</p>
                </AccordionContent>
              </AccordionItem>


               {/* Section: Logo Generation Tips */}
              <AccordionItem value="generation-tips" className="border-b border-border/70">
                <AccordionTrigger className="text-xl font-semibold hover:no-underline py-4">
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-6 h-6 text-accent" />
                    Tips for Great Logos
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-base text-muted-foreground leading-relaxed pt-2 pb-4 pl-1 space-y-3">
                  <ul className="list-disc list-inside pl-5 space-y-1.5 marker:text-primary">
                      <li><strong>Be Descriptive:</strong> The more context you give the AI (especially in Professional Mode and for image-based generation), the better it can understand your needs.</li>
                      <li><strong>Keywords are Key:</strong> Use relevant keywords related to your industry, style (e.g., "minimalist," "geometric," "modern"), and desired imagery.</li>
                      <li><strong>Iterate:</strong> Don't expect the perfect logo on the first try. Experiment with different descriptions, prompts, and colors. Use the "Save Logo" feature to keep track of good results.</li>
                      <li><strong>Understand Flat Design:</strong> Keep the principles of flat design in mind. The AI is tuned for this style. Avoid requesting elements like complex gradients, 3D shadows, or photorealism.</li>
                      <li><strong>Color Choices:</strong> While the AI can pick colors, specifying a color palette (especially in Novice mode or via prompt in Pro mode) can help align the logo with your brand.</li>
                      <li><strong>Image Uploads (Remix Mode):</strong> Clear, high-quality source images tend to yield better inspirational results. The AI aims to capture the essence, not directly copy.</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
              
              {/* Section: Technical Details */}
              <AccordionItem value="tech-details" className="border-border/70">
                <AccordionTrigger className="text-xl font-semibold hover:no-underline py-4">
                  <div className="flex items-center gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent w-6 h-6"><path d="M12 20V10M18 20V4M6 20V16"/></svg>
                    Powered By
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-base text-muted-foreground leading-relaxed pt-2 pb-4 pl-1">
                  Flatify AI leverages cutting-edge technology to bring your logo ideas to life. Our backend is powered by <strong>Genkit</strong>, a framework for building AI-powered applications, and utilizes Google's <strong>Gemini</strong> models for high-quality image generation and language understanding. Data is stored securely using MongoDB.
                </AccordionContent>
              </AccordionItem>

            </Accordion>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
