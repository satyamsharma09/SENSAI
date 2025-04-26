"use client";

import React, { useState, useRef } from "react";
import MDEditor from "@uiw/react-md-editor";
import { Button } from "@/components/ui/button";
import { Download, Edit, Loader2, Save, Monitor } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import html2pdf from "html2pdf.js";

const CoverLetterPreview = ({
  content: initialContent,
  onSave,
  isSaving,
  isGenerating,
  onGeneratePDF,
}) => {
  const [activeTab, setActiveTab] = useState("preview");
  const [editMode, setEditMode] = useState(false);
  const [markdownContent, setMarkdownContent] = useState(initialContent || "");
  const previewRef = useRef(null);

  const handleSaveClick = () => {
    onSave(markdownContent);
    setEditMode(false);
  };

  const generatePDF = () => {
    if (onGeneratePDF) {
      onGeneratePDF(markdownContent);
      return;
    }

    const element = previewRef.current;
    if (!element) return;

    const opt = {
      margin: 0, // No margin to match preview exactly
      filename: 'cover-letter.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2,
        letterRendering: true,
        width: element.offsetWidth,
        windowWidth: element.scrollWidth,
        useCORS: true
      },
      jsPDF: { 
        unit: 'px', // Using pixels to match web layout
        format: [element.offsetWidth, element.scrollHeight],
        orientation: 'portrait'
      }
    };

    // Clone with all styles intact
    const clonedElement = element.cloneNode(true);
    clonedElement.style.boxShadow = 'none'; // Remove shadow for PDF
    
    html2pdf()
      .set(opt)
      .from(clonedElement)
      .save()
      .catch(err => console.error('PDF generation error:', err));
  };

  return (
    <div className="py-4 space-y-4">
      <div className="flex justify-end space-x-2">
        <Button 
          size="sm" 
          onClick={generatePDF} 
          disabled={isGenerating}
          className="ml-2"
        >
          <Download className="h-4 w-4 mr-2" />
          Download PDF
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="edit">Edit</TabsTrigger>
        </TabsList>
        
        <TabsContent value="preview">
          <div 
            ref={previewRef} 
            className="mx-auto bg-white p-6 rounded-lg shadow-sm"
            style={{
              width: '210mm',
              minHeight: '297mm',
              boxSizing: 'border-box'
            }}
          >
            <MDEditor.Markdown
              source={markdownContent}
              style={{ 
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                fontSize: '12pt',
                lineHeight: '1.5',
                fontFamily: 'Arial, sans-serif',
                margin: 0,
                padding: 0
              }}
            />
          </div>
        </TabsContent>
        
        <TabsContent value="edit">
          <div className="overflow-hidden rounded-lg">
            <MDEditor
              value={markdownContent}
              onChange={setMarkdownContent}
              preview="edit"
              height={800}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CoverLetterPreview;