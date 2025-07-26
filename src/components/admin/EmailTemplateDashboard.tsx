import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Mail, 
  Send, 
  Eye, 
  Code, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle,
  Info,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { 
  EMAIL_TEMPLATES, 
  getTemplateById, 
  getTemplatesByCategory, 
  getAllTemplateCategories 
} from '@/utils/emailTemplateRegistry';
import type { EmailTemplate } from '@/utils/emailStyles';

const EmailTemplateDashboard: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [templateData, setTemplateData] = useState<Record<string, any>>({});
  const [testEmail, setTestEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [previewMode, setPreviewMode] = useState<'html' | 'text'>('html');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = getAllTemplateCategories();
  const filteredTemplates = selectedCategory === 'all' 
    ? EMAIL_TEMPLATES 
    : getTemplatesByCategory(selectedCategory);

  const handleTemplateSelect = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setTemplateData(template.defaultData);
  };

  const updateTemplateData = (field: string, value: any) => {
    setTemplateData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const generatePreview = () => {
    if (!selectedTemplate) return { html: '', text: '', subject: '' };
    
    try {
      return selectedTemplate.generator(templateData);
    } catch (error) {
      console.error('Error generating preview:', error);
      return {
        html: '<p>Error generating preview</p>',
        text: 'Error generating preview',
        subject: 'Error'
      };
    }
  };

  const sendTestEmail = async () => {
    if (!selectedTemplate || !testEmail) {
      toast.error('Please select a template and enter test email');
      return;
    }

    setIsSending(true);
    try {
      const { html, text, subject } = generatePreview();

      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to: testEmail,
          subject: `[TEST] ${subject}`,
          html: html,
          text: text,
          from: 'noreply@rebookedsolutions.co.za'
        }
      });

      if (error) {
        console.error('Email send error:', error);
        toast.error('Failed to send test email', {
          description: error.message || 'Please check your email configuration'
        });
      } else {
        toast.success('Test email sent successfully!', {
          description: `Sent to ${testEmail}`
        });
      }
    } catch (error) {
      console.error('Error sending test email:', error);
      toast.error('Failed to send test email', {
        description: 'Please check your connection and try again'
      });
    } finally {
      setIsSending(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'orders': return '📦';
      case 'auth': return '🔐';
      case 'notifications': return '🔔';
      case 'banking': return '🏦';
      case 'general': return '📧';
      default: return '✉️';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'orders': return 'bg-blue-100 text-blue-800';
      case 'auth': return 'bg-green-100 text-green-800';
      case 'notifications': return 'bg-yellow-100 text-yellow-800';
      case 'banking': return 'bg-purple-100 text-purple-800';
      case 'general': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const preview = generatePreview();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Email Template Dashboard</h2>
          <p className="text-gray-600 mt-1">
            Test and preview all email templates in the system
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-3 py-1">
          {EMAIL_TEMPLATES.length} Templates
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Template Selection */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Templates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Filter by Category</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {getCategoryIcon(category)} {category.charAt(0).toUpperCase() + category.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredTemplates.map((template) => (
                  <Card 
                    key={template.id}
                    className={`cursor-pointer transition-all ${
                      selectedTemplate?.id === template.id 
                        ? 'border-green-500 bg-green-50' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{template.name}</h4>
                          <p className="text-xs text-gray-600 mt-1">{template.description}</p>
                        </div>
                        <Badge className={`${getCategoryColor(template.category)} text-xs`}>
                          {getCategoryIcon(template.category)} {template.category}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Template Configuration */}
        <div className="space-y-4">
          {selectedTemplate ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    Template Data
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedTemplate.requiredFields.map((field) => (
                    <div key={field}>
                      <Label htmlFor={field} className="capitalize">
                        {field.replace(/([A-Z])/g, ' $1').trim()}
                        {selectedTemplate.requiredFields.includes(field) && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </Label>
                      {field.includes('Url') || field.includes('url') ? (
                        <Input
                          id={field}
                          type="url"
                          value={templateData[field] || ''}
                          onChange={(e) => updateTemplateData(field, e.target.value)}
                          placeholder={`Enter ${field}`}
                        />
                      ) : field.includes('items') ? (
                        <Textarea
                          id={field}
                          value={JSON.stringify(templateData[field] || [], null, 2)}
                          onChange={(e) => {
                            try {
                              updateTemplateData(field, JSON.parse(e.target.value));
                            } catch {
                              // Invalid JSON, ignore
                            }
                          }}
                          placeholder="JSON array of items"
                          rows={4}
                        />
                      ) : (
                        <Input
                          id={field}
                          value={templateData[field] || ''}
                          onChange={(e) => updateTemplateData(field, e.target.value)}
                          placeholder={`Enter ${field}`}
                        />
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Send className="h-5 w-5" />
                    Send Test Email
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="testEmail">Test Email Address</Label>
                    <Input
                      id="testEmail"
                      type="email"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      placeholder="Enter email to test"
                    />
                  </div>
                  
                  <Button 
                    onClick={sendTestEmail}
                    disabled={isSending || !testEmail}
                    className="w-full"
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Test Email
                      </>
                    )}
                  </Button>

                  <Alert className="border-blue-200 bg-blue-50">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      Test emails will be sent with [TEST] prefix in the subject line.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Mail className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">
                  Select an Email Template
                </h3>
                <p className="text-gray-500">
                  Choose a template from the list to configure and preview it.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Preview */}
        <div className="space-y-4">
          {selectedTemplate ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Preview
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={previewMode === 'html' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPreviewMode('html')}
                    >
                      HTML
                    </Button>
                    <Button
                      variant={previewMode === 'text' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPreviewMode('text')}
                    >
                      Text
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Subject Line:</Label>
                    <div className="bg-gray-100 p-2 rounded text-sm font-mono">
                      {preview.subject}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">
                      {previewMode === 'html' ? 'HTML Preview:' : 'Text Preview:'}
                    </Label>
                    {previewMode === 'html' ? (
                      <div className="border rounded-lg overflow-hidden">
                        <iframe
                          srcDoc={preview.html}
                          className="w-full h-96 border-0"
                          title="Email Preview"
                        />
                      </div>
                    ) : (
                      <pre className="bg-gray-100 p-4 rounded text-sm font-mono whitespace-pre-wrap h-96 overflow-y-auto">
                        {preview.text}
                      </pre>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Eye className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">
                  Email Preview
                </h3>
                <p className="text-gray-500">
                  Select a template to see the preview here.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Template Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map(category => {
              const count = getTemplatesByCategory(category).length;
              return (
                <div key={category} className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl mb-1">{getCategoryIcon(category)}</div>
                  <div className="text-2xl font-bold text-gray-900">{count}</div>
                  <div className="text-sm text-gray-600 capitalize">{category}</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailTemplateDashboard;
