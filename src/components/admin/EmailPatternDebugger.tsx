import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Search, Database, RefreshCw } from 'lucide-react';

interface EmailPattern {
  subject: string;
  count: number;
  status_breakdown: { [key: string]: number };
  latest_created: string;
  sample_ids: string[];
}

const EmailPatternDebugger: React.FC = () => {
  const [patterns, setPatterns] = useState<EmailPattern[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recentOrdersInfo, setRecentOrdersInfo] = useState<any>(null);

  const analyzeEmailPatterns = async () => {
    setIsAnalyzing(true);
    try {
      const recentDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      // Get all recent emails
      const { data: recentEmails, error: emailError } = await supabase
        .from('mail_queue')
        .select('id, subject, status, created_at, user_id')
        .gte('created_at', recentDate)
        .order('created_at', { ascending: false });

      if (emailError) {
        toast.error(`Failed to fetch emails: ${emailError.message}`);
        return;
      }

      // Get recent orders for comparison
      const { data: recentOrders, error: orderError } = await supabase
        .from('orders')
        .select('id, created_at, buyer_id, seller_id, status')
        .gte('created_at', recentDate)
        .order('created_at', { ascending: false });

      if (orderError) {
        console.warn('Could not fetch orders:', orderError);
      }

      // Analyze email patterns
      const patternMap = new Map<string, EmailPattern>();
      
      recentEmails?.forEach(email => {
        const subject = email.subject;
        if (!patternMap.has(subject)) {
          patternMap.set(subject, {
            subject,
            count: 0,
            status_breakdown: {},
            latest_created: email.created_at,
            sample_ids: []
          });
        }
        
        const pattern = patternMap.get(subject)!;
        pattern.count++;
        pattern.status_breakdown[email.status] = (pattern.status_breakdown[email.status] || 0) + 1;
        
        if (new Date(email.created_at) > new Date(pattern.latest_created)) {
          pattern.latest_created = email.created_at;
        }
        
        if (pattern.sample_ids.length < 3) {
          pattern.sample_ids.push(email.id);
        }
      });

      const sortedPatterns = Array.from(patternMap.values())
        .sort((a, b) => b.count - a.count);

      setPatterns(sortedPatterns);
      setRecentOrdersInfo({
        totalEmails: recentEmails?.length || 0,
        totalOrders: recentOrders?.length || 0,
        orderStatuses: recentOrders?.reduce((acc, order) => {
          acc[order.status] = (acc[order.status] || 0) + 1;
          return acc;
        }, {} as { [key: string]: number }) || {}
      });

      toast.success(`Analyzed ${recentEmails?.length || 0} emails and found ${sortedPatterns.length} unique patterns`);

    } catch (error) {
      toast.error('Failed to analyze email patterns');
      console.error('Email pattern analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const isOrderRelated = (subject: string) => {
    const orderKeywords = [
      'order confirmed', 'new order', 'action required', 'thank you',
      'order', 'purchase', 'commit', 'sale'
    ];
    return orderKeywords.some(keyword => 
      subject.toLowerCase().includes(keyword.toLowerCase())
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="w-5 h-5" />
          Email Pattern Analysis
        </CardTitle>
        <p className="text-sm text-gray-600">
          Analyze recent email patterns to debug order email triggers
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={analyzeEmailPatterns}
          disabled={isAnalyzing}
          className="w-full flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
          {isAnalyzing ? 'Analyzing...' : 'Analyze Email Patterns'}
        </Button>

        {recentOrdersInfo && (
          <Alert>
            <Database className="w-4 h-4" />
            <AlertDescription>
              <strong>Recent Activity (24h):</strong> {recentOrdersInfo.totalEmails} emails, {recentOrdersInfo.totalOrders} orders
              <br />
              <strong>Order Statuses:</strong> {Object.entries(recentOrdersInfo.orderStatuses).map(([status, count]) => 
                `${status}: ${count}`
              ).join(', ')}
            </AlertDescription>
          </Alert>
        )}

        {patterns.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold">Email Patterns Found ({patterns.length})</h3>
            
            {patterns.map((pattern, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{pattern.subject}</h4>
                    <p className="text-xs text-gray-500">
                      Latest: {new Date(pattern.latest_created).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isOrderRelated(pattern.subject) && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">
                        Order Related
                      </Badge>
                    )}
                    <Badge variant="secondary">
                      {pattern.count} emails
                    </Badge>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-1 mt-2">
                  {Object.entries(pattern.status_breakdown).map(([status, count]) => (
                    <Badge key={status} className={getStatusColor(status)}>
                      {status}: {count}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {patterns.length === 0 && !isAnalyzing && (
          <div className="text-center py-8 text-gray-500">
            Click "Analyze Email Patterns" to see recent email activity
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EmailPatternDebugger;
