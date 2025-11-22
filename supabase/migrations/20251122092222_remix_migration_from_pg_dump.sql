CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.7

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, created_at)
  VALUES (NEW.id, now());
  RETURN NEW;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: custom_foods; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.custom_foods (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    serving_size numeric(10,2) NOT NULL,
    serving_unit text NOT NULL,
    calories integer NOT NULL,
    protein numeric(10,2) NOT NULL,
    carbs numeric(10,2) NOT NULL,
    fats numeric(10,2) NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: foods; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.foods (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    brand text,
    serving_size numeric(10,2) NOT NULL,
    serving_unit text NOT NULL,
    calories integer NOT NULL,
    protein numeric(10,2) NOT NULL,
    carbs numeric(10,2) NOT NULL,
    fats numeric(10,2) NOT NULL,
    fiber numeric(10,2) DEFAULT 0,
    sugar numeric(10,2) DEFAULT 0,
    sodium numeric(10,2) DEFAULT 0,
    barcode text,
    is_verified boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: meal_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.meal_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    meal_id uuid NOT NULL,
    food_id uuid,
    custom_food_id uuid,
    quantity numeric(10,2) NOT NULL,
    calories integer NOT NULL,
    protein numeric(10,2) NOT NULL,
    carbs numeric(10,2) NOT NULL,
    fats numeric(10,2) NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: meals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.meals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text,
    meal_type text,
    logged_at timestamp with time zone DEFAULT now(),
    photo_url text,
    notes text,
    is_favorite boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    age integer,
    height_cm integer,
    current_weight_kg numeric(5,2),
    goal_weight_kg numeric(5,2),
    starting_weight_kg numeric(5,2),
    activity_level text,
    gender text,
    daily_calorie_goal integer,
    daily_protein_goal integer,
    daily_carbs_goal integer,
    daily_fats_goal integer,
    daily_steps_goal integer DEFAULT 10000,
    daily_water_goal_ml integer DEFAULT 2000,
    add_burned_calories boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT profiles_activity_level_check CHECK ((activity_level = ANY (ARRAY['inactive'::text, 'lightly_active'::text, 'moderately_active'::text, 'very_active'::text, 'extremely_active'::text]))),
    CONSTRAINT profiles_gender_check CHECK ((gender = ANY (ARRAY['male'::text, 'female'::text, 'other'::text])))
);


--
-- Name: recipes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.recipes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    image_url text,
    prep_time_minutes integer,
    meal_type text,
    calories integer,
    protein numeric(10,2),
    carbs numeric(10,2),
    fats numeric(10,2),
    servings integer DEFAULT 1,
    is_popular boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT recipes_meal_type_check CHECK ((meal_type = ANY (ARRAY['breakfast'::text, 'lunch'::text, 'dinner'::text, 'snack'::text])))
);


--
-- Name: step_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.step_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    steps integer NOT NULL,
    logged_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: water_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.water_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    amount_ml integer NOT NULL,
    logged_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: weight_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.weight_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    weight_kg numeric(5,2) NOT NULL,
    logged_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: custom_foods custom_foods_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.custom_foods
    ADD CONSTRAINT custom_foods_pkey PRIMARY KEY (id);


--
-- Name: foods foods_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.foods
    ADD CONSTRAINT foods_pkey PRIMARY KEY (id);


--
-- Name: meal_items meal_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meal_items
    ADD CONSTRAINT meal_items_pkey PRIMARY KEY (id);


--
-- Name: meals meals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meals
    ADD CONSTRAINT meals_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: recipes recipes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recipes
    ADD CONSTRAINT recipes_pkey PRIMARY KEY (id);


--
-- Name: step_logs step_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.step_logs
    ADD CONSTRAINT step_logs_pkey PRIMARY KEY (id);


--
-- Name: water_logs water_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.water_logs
    ADD CONSTRAINT water_logs_pkey PRIMARY KEY (id);


--
-- Name: weight_logs weight_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.weight_logs
    ADD CONSTRAINT weight_logs_pkey PRIMARY KEY (id);


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: custom_foods custom_foods_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.custom_foods
    ADD CONSTRAINT custom_foods_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: meal_items meal_items_custom_food_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meal_items
    ADD CONSTRAINT meal_items_custom_food_id_fkey FOREIGN KEY (custom_food_id) REFERENCES public.custom_foods(id);


--
-- Name: meal_items meal_items_food_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meal_items
    ADD CONSTRAINT meal_items_food_id_fkey FOREIGN KEY (food_id) REFERENCES public.foods(id);


--
-- Name: meal_items meal_items_meal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meal_items
    ADD CONSTRAINT meal_items_meal_id_fkey FOREIGN KEY (meal_id) REFERENCES public.meals(id) ON DELETE CASCADE;


--
-- Name: meals meals_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meals
    ADD CONSTRAINT meals_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: step_logs step_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.step_logs
    ADD CONSTRAINT step_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: water_logs water_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.water_logs
    ADD CONSTRAINT water_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: weight_logs weight_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.weight_logs
    ADD CONSTRAINT weight_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: foods Anyone can view foods; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view foods" ON public.foods FOR SELECT USING (true);


--
-- Name: recipes Anyone can view recipes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view recipes" ON public.recipes FOR SELECT USING (true);


--
-- Name: custom_foods Users can create own custom foods; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own custom foods" ON public.custom_foods FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: meal_items Users can create own meal items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own meal items" ON public.meal_items FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.meals
  WHERE ((meals.id = meal_items.meal_id) AND (meals.user_id = auth.uid())))));


--
-- Name: meals Users can create own meals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own meals" ON public.meals FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: step_logs Users can create own step logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own step logs" ON public.step_logs FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: water_logs Users can create own water logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own water logs" ON public.water_logs FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: weight_logs Users can create own weight logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own weight logs" ON public.weight_logs FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: custom_foods Users can delete own custom foods; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own custom foods" ON public.custom_foods FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: meal_items Users can delete own meal items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own meal items" ON public.meal_items FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.meals
  WHERE ((meals.id = meal_items.meal_id) AND (meals.user_id = auth.uid())))));


--
-- Name: meals Users can delete own meals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own meals" ON public.meals FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: step_logs Users can delete own step logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own step logs" ON public.step_logs FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: water_logs Users can delete own water logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own water logs" ON public.water_logs FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: weight_logs Users can delete own weight logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own weight logs" ON public.weight_logs FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: profiles Users can insert own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = id));


--
-- Name: custom_foods Users can update own custom foods; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own custom foods" ON public.custom_foods FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: meal_items Users can update own meal items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own meal items" ON public.meal_items FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.meals
  WHERE ((meals.id = meal_items.meal_id) AND (meals.user_id = auth.uid())))));


--
-- Name: meals Users can update own meals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own meals" ON public.meals FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: profiles Users can update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = id));


--
-- Name: custom_foods Users can view own custom foods; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own custom foods" ON public.custom_foods FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: meal_items Users can view own meal items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own meal items" ON public.meal_items FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.meals
  WHERE ((meals.id = meal_items.meal_id) AND (meals.user_id = auth.uid())))));


--
-- Name: meals Users can view own meals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own meals" ON public.meals FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: profiles Users can view own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING ((auth.uid() = id));


--
-- Name: step_logs Users can view own step logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own step logs" ON public.step_logs FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: water_logs Users can view own water logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own water logs" ON public.water_logs FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: weight_logs Users can view own weight logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own weight logs" ON public.weight_logs FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: custom_foods; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.custom_foods ENABLE ROW LEVEL SECURITY;

--
-- Name: foods; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.foods ENABLE ROW LEVEL SECURITY;

--
-- Name: meal_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.meal_items ENABLE ROW LEVEL SECURITY;

--
-- Name: meals; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: recipes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;

--
-- Name: step_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.step_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: water_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.water_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: weight_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.weight_logs ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


