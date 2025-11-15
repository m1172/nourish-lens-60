import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Barcode } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import BottomNav from '@/components/BottomNav';

export default function AddBarcode() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [barcode, setBarcode] = useState('');

  const scanBarcode = () => {
    toast({
      title: "Coming Soon",
      description: "Barcode scanning will be available in a future update",
    });
  };

  const lookupBarcode = async () => {
    if (!barcode.trim()) return;
    
    toast({
      title: "Coming Soon",
      description: "Barcode lookup will be available in a future update",
    });
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-screen-sm mx-auto p-4 space-y-4">
        <h1 className="text-2xl font-bold">Scan Barcode</h1>

        <Card className="p-6">
          <div className="text-center space-y-4">
            <Barcode className="h-24 w-24 mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">
              This feature uses the device camera to scan product barcodes
            </p>
            <Button onClick={scanBarcode} className="w-full">
              Open Camera Scanner
            </Button>
          </div>
        </Card>

        <div className="text-center text-sm text-muted-foreground">or</div>

        <Card className="p-4 space-y-4">
          <div>
            <label className="text-sm text-muted-foreground">Enter barcode manually</label>
            <Input
              placeholder="123456789012"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && lookupBarcode()}
            />
          </div>
          <Button onClick={lookupBarcode} className="w-full">
            Look Up Product
          </Button>
        </Card>

        <Button variant="outline" onClick={() => navigate('/add')} className="w-full">
          Back
        </Button>
      </div>

      <BottomNav />
    </div>
  );
}
