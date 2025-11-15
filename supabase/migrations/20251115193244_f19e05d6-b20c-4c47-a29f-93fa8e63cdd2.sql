-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  age INTEGER,
  height_cm INTEGER,
  current_weight_kg DECIMAL(5,2),
  goal_weight_kg DECIMAL(5,2),
  starting_weight_kg DECIMAL(5,2),
  activity_level TEXT CHECK (activity_level IN ('inactive', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active')),
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  daily_calorie_goal INTEGER,
  daily_protein_goal INTEGER,
  daily_carbs_goal INTEGER,
  daily_fats_goal INTEGER,
  daily_steps_goal INTEGER DEFAULT 10000,
  daily_water_goal_ml INTEGER DEFAULT 2000,
  add_burned_calories BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create foods table (standard food database)
CREATE TABLE public.foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  brand TEXT,
  serving_size DECIMAL(10,2) NOT NULL,
  serving_unit TEXT NOT NULL,
  calories INTEGER NOT NULL,
  protein DECIMAL(10,2) NOT NULL,
  carbs DECIMAL(10,2) NOT NULL,
  fats DECIMAL(10,2) NOT NULL,
  fiber DECIMAL(10,2) DEFAULT 0,
  sugar DECIMAL(10,2) DEFAULT 0,
  sodium DECIMAL(10,2) DEFAULT 0,
  barcode TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create custom_foods table (user-created foods)
CREATE TABLE public.custom_foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  serving_size DECIMAL(10,2) NOT NULL,
  serving_unit TEXT NOT NULL,
  calories INTEGER NOT NULL,
  protein DECIMAL(10,2) NOT NULL,
  carbs DECIMAL(10,2) NOT NULL,
  fats DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create recipes table
CREATE TABLE public.recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  prep_time_minutes INTEGER,
  meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  calories INTEGER,
  protein DECIMAL(10,2),
  carbs DECIMAL(10,2),
  fats DECIMAL(10,2),
  servings INTEGER DEFAULT 1,
  is_popular BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create meals table
CREATE TABLE public.meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  meal_type TEXT,
  logged_at TIMESTAMPTZ DEFAULT now(),
  photo_url TEXT,
  notes TEXT,
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create meal_items table (foods in each meal)
CREATE TABLE public.meal_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id UUID NOT NULL REFERENCES public.meals(id) ON DELETE CASCADE,
  food_id UUID REFERENCES public.foods(id),
  custom_food_id UUID REFERENCES public.custom_foods(id),
  quantity DECIMAL(10,2) NOT NULL,
  calories INTEGER NOT NULL,
  protein DECIMAL(10,2) NOT NULL,
  carbs DECIMAL(10,2) NOT NULL,
  fats DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create water_logs table
CREATE TABLE public.water_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_ml INTEGER NOT NULL,
  logged_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create weight_logs table
CREATE TABLE public.weight_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  weight_kg DECIMAL(5,2) NOT NULL,
  logged_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create step_logs table
CREATE TABLE public.step_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  steps INTEGER NOT NULL,
  logged_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.water_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weight_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.step_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.foods ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS Policies for custom_foods
CREATE POLICY "Users can view own custom foods"
  ON public.custom_foods FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own custom foods"
  ON public.custom_foods FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own custom foods"
  ON public.custom_foods FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own custom foods"
  ON public.custom_foods FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for meals
CREATE POLICY "Users can view own meals"
  ON public.meals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own meals"
  ON public.meals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meals"
  ON public.meals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own meals"
  ON public.meals FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for meal_items
CREATE POLICY "Users can view own meal items"
  ON public.meal_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.meals 
    WHERE meals.id = meal_items.meal_id 
    AND meals.user_id = auth.uid()
  ));

CREATE POLICY "Users can create own meal items"
  ON public.meal_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.meals 
    WHERE meals.id = meal_items.meal_id 
    AND meals.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own meal items"
  ON public.meal_items FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.meals 
    WHERE meals.id = meal_items.meal_id 
    AND meals.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own meal items"
  ON public.meal_items FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.meals 
    WHERE meals.id = meal_items.meal_id 
    AND meals.user_id = auth.uid()
  ));

-- RLS Policies for water_logs
CREATE POLICY "Users can view own water logs"
  ON public.water_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own water logs"
  ON public.water_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own water logs"
  ON public.water_logs FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for weight_logs
CREATE POLICY "Users can view own weight logs"
  ON public.weight_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own weight logs"
  ON public.weight_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own weight logs"
  ON public.weight_logs FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for step_logs
CREATE POLICY "Users can view own step logs"
  ON public.step_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own step logs"
  ON public.step_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own step logs"
  ON public.step_logs FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for recipes (public read)
CREATE POLICY "Anyone can view recipes"
  ON public.recipes FOR SELECT
  USING (true);

-- RLS Policies for foods (public read)
CREATE POLICY "Anyone can view foods"
  ON public.foods FOR SELECT
  USING (true);

-- Create trigger function for updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Add trigger to profiles table
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create profile after signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, created_at)
  VALUES (NEW.id, now());
  RETURN NEW;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Add some sample recipes
INSERT INTO public.recipes (name, description, meal_type, prep_time_minutes, calories, protein, carbs, fats, is_popular) VALUES
('Grilled Chicken Quinoa', 'Healthy grilled chicken with quinoa and vegetables', 'lunch', 30, 520, 45, 55, 12, true),
('Berry Yogurt Bowl', 'Greek yogurt with mixed berries and granola', 'breakfast', 15, 425, 25, 60, 15, true),
('Lemon Herb Chicken', 'Fresh lemon herb grilled chicken with salad', 'dinner', 35, 670, 55, 45, 28, true);

-- Add some common foods
INSERT INTO public.foods (name, serving_size, serving_unit, calories, protein, carbs, fats, is_verified) VALUES
('Chicken Breast', 100, 'g', 165, 31, 0, 3.6, true),
('Brown Rice', 100, 'g', 112, 2.6, 24, 0.9, true),
('Spinach', 100, 'g', 23, 2.9, 3.6, 0.4, true),
('Avocado', 100, 'g', 160, 2, 8.5, 14.7, true),
('Almonds', 28, 'g', 164, 6, 6, 14, true),
('Tomato', 100, 'g', 18, 0.9, 3.9, 0.2, true),
('Carrot', 100, 'g', 41, 0.9, 10, 0.2, true),
('Water', 1000, 'ml', 0, 0, 0, 0, true);