import { useState } from 'react';
import BottomNav from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Camera, Mic, Search, Barcode } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Add() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-screen-sm mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">Add Food</h1>

        <div className="space-y-4">
          <Card 
            className="p-6 flex items-center gap-4 cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => navigate('/add/photo')}
          >
            <div className="bg-primary/10 p-4 rounded-full">
              <Camera className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Take a Photo</h3>
              <p className="text-sm text-muted-foreground">AI will detect food and estimate calories</p>
            </div>
          </Card>

          <Card 
            className="p-6 flex items-center gap-4 cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => navigate('/add/search')}
          >
            <div className="bg-accent/10 p-4 rounded-full">
              <Search className="h-6 w-6 text-accent" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Search Foods</h3>
              <p className="text-sm text-muted-foreground">Browse our food database</p>
            </div>
          </Card>

          <Card 
            className="p-6 flex items-center gap-4 cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => navigate('/add/barcode')}
          >
            <div className="bg-success/10 p-4 rounded-full">
              <Barcode className="h-6 w-6 text-success" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Scan Barcode</h3>
              <p className="text-sm text-muted-foreground">Scan packaged food labels</p>
            </div>
          </Card>

          <Card 
            className="p-6 flex items-center gap-4 cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => navigate('/add/voice')}
          >
            <div className="bg-fats/10 p-4 rounded-full">
              <Mic className="h-6 w-6 text-nutrition-fats" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Voice Input</h3>
              <p className="text-sm text-muted-foreground">Say what you ate</p>
            </div>
          </Card>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
