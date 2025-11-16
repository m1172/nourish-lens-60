import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
// BottomNav moved to App layout

export default function AddVoice() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [processing, setProcessing] = useState(false);

  const startListening = () => {
    if (
      !('webkitSpeechRecognition' in window) &&
      !('SpeechRecognition' in window)
    ) {
      toast({
        variant: 'destructive',
        title: 'Not Supported',
        description: 'Speech recognition is not supported in your browser',
      });
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript('');
    };

    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
      processVoiceInput(text);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to recognize speech',
      });
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const processVoiceInput = async (text: string) => {
    if (!user) return;
    setProcessing(true);

    try {
      const LOVABLE_API_KEY = import.meta.env.VITE_LOVABLE_API_KEY;

      // Call Lovable AI to parse the voice input
      const response = await fetch(
        'https://ai.gateway.lovable.dev/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              {
                role: 'system',
                content:
                  'Extract food items from user speech. Return JSON array with: [{name, quantity, unit, estimated_calories}]. Be reasonable with calorie estimates.',
              },
              {
                role: 'user',
                content: text,
              },
            ],
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to process voice input');

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '[]';

      let items = [];
      try {
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        items = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
      } catch {
        console.error('Failed to parse AI response:', content);
      }

      if (items.length === 0) {
        toast({
          title: 'No food detected',
          description: 'Try speaking more clearly about what you ate',
        });
        return;
      }

      // Save to database
      const { data: meal, error: mealError } = await supabase
        .from('meals')
        .insert({
          user_id: user.id,
          name: 'Voice logged meal',
          logged_at: new Date().toISOString(),
        })
        .select('*')
        .single();

      if (mealError) throw mealError;

      const itemsPayload = items.map((item: any) => ({
        meal_id: meal.id,
        calories: item.estimated_calories || 0,
        protein: 0,
        carbs: 0,
        fats: 0,
        quantity: item.quantity || 1,
      }));

      const { error: itemsError } = await supabase
        .from('meal_items')
        .insert(itemsPayload);

      if (itemsError) throw itemsError;

      toast({
        title: 'Success',
        description: 'Meal saved to your diary',
      });

      navigate('/');
    } catch (err: any) {
      console.error(err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.message,
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className='min-h-screen bg-background pb-20'>
      <div className='max-w-screen-sm mx-auto p-4 space-y-4'>
        <h1 className='text-2xl font-bold'>Voice Input</h1>

        <Card className='p-6'>
          <div className='text-center space-y-4'>
            <div className='mx-auto w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center'>
              {isListening ? (
                <MicOff className='h-16 w-16 text-primary animate-pulse' />
              ) : processing ? (
                <Loader2 className='h-16 w-16 text-primary animate-spin' />
              ) : (
                <Mic className='h-16 w-16 text-primary' />
              )}
            </div>

            {isListening && (
              <p className='text-sm text-muted-foreground animate-pulse'>
                Listening...
              </p>
            )}

            {processing && (
              <p className='text-sm text-muted-foreground'>Processing...</p>
            )}

            {transcript && !processing && (
              <Card className='p-4 bg-muted'>
                <p className='text-sm'>{transcript}</p>
              </Card>
            )}

            {!isListening && !processing && (
              <>
                <p className='text-muted-foreground'>
                  Tap the button and say what you ate
                </p>
                <p className='text-sm text-muted-foreground'>
                  Example: "Two eggs and a slice of toast"
                </p>
              </>
            )}

            <Button
              onClick={startListening}
              disabled={isListening || processing}
              size='lg'
              className='w-full'
            >
              {isListening
                ? 'Listening...'
                : processing
                ? 'Processing...'
                : 'Start Recording'}
            </Button>
          </div>
        </Card>

        <Button
          variant='outline'
          onClick={() => navigate('/add')}
          className='w-full'
        >
          Back
        </Button>
      </div>

      {/* BottomNav rendered globally in App.tsx */}
    </div>
  );
}
