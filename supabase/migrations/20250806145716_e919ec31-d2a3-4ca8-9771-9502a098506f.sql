-- Create user roles enum
CREATE TYPE public.user_role AS ENUM ('admin', 'driver1', 'driver2', 'driver3');

-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role user_role DEFAULT 'driver1',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trips table
CREATE TABLE public.trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  driver_name TEXT NOT NULL,
  driver_number TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_number TEXT NOT NULL,
  from_location TEXT NOT NULL,
  to_location TEXT NOT NULL,
  company TEXT,
  fuel_type TEXT NOT NULL CHECK (fuel_type IN ('Petrol', 'Diesel', 'EV')),
  payment_mode TEXT NOT NULL CHECK (payment_mode IN ('Cash', 'UPI', 'Online', 'Other')),
  driver_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  commission DECIMAL(10,2) NOT NULL DEFAULT 0,
  fuel_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  tolls DECIMAL(10,2) NOT NULL DEFAULT 0,
  trip_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  profit DECIMAL(10,2) GENERATED ALWAYS AS (trip_amount - (driver_amount + commission + fuel_amount + tolls)) STORED,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create maintenance table
CREATE TABLE public.maintenance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  vehicle_number TEXT NOT NULL,
  driver_name TEXT NOT NULL,
  maintenance_type TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role user_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = _user_id
      AND role = _role
  )
$$;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Create policies for trips
CREATE POLICY "Admin can view all trips" 
ON public.trips 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Drivers can view their own trips" 
ON public.trips 
FOR SELECT 
USING (
  NOT public.has_role(auth.uid(), 'admin') 
  AND created_by = auth.uid()
);

CREATE POLICY "Admin can insert all trips" 
ON public.trips 
FOR INSERT 
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Drivers can insert their own trips" 
ON public.trips 
FOR INSERT 
WITH CHECK (
  NOT public.has_role(auth.uid(), 'admin') 
  AND created_by = auth.uid()
);

CREATE POLICY "Admin can update all trips" 
ON public.trips 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Drivers can update their own trips" 
ON public.trips 
FOR UPDATE 
USING (
  NOT public.has_role(auth.uid(), 'admin') 
  AND created_by = auth.uid()
);

CREATE POLICY "Admin can delete all trips" 
ON public.trips 
FOR DELETE 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Drivers can delete their own trips" 
ON public.trips 
FOR DELETE 
USING (
  NOT public.has_role(auth.uid(), 'admin') 
  AND created_by = auth.uid()
);

-- Create policies for maintenance
CREATE POLICY "Admin can view all maintenance" 
ON public.maintenance 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Drivers can view their own maintenance" 
ON public.maintenance 
FOR SELECT 
USING (
  NOT public.has_role(auth.uid(), 'admin') 
  AND created_by = auth.uid()
);

CREATE POLICY "Admin can insert all maintenance" 
ON public.maintenance 
FOR INSERT 
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Drivers can insert their own maintenance" 
ON public.maintenance 
FOR INSERT 
WITH CHECK (
  NOT public.has_role(auth.uid(), 'admin') 
  AND created_by = auth.uid()
);

CREATE POLICY "Admin can update all maintenance" 
ON public.maintenance 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Drivers can update their own maintenance" 
ON public.maintenance 
FOR UPDATE 
USING (
  NOT public.has_role(auth.uid(), 'admin') 
  AND created_by = auth.uid()
);

CREATE POLICY "Admin can delete all maintenance" 
ON public.maintenance 
FOR DELETE 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Drivers can delete their own maintenance" 
ON public.maintenance 
FOR DELETE 
USING (
  NOT public.has_role(auth.uid(), 'admin') 
  AND created_by = auth.uid()
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trips_updated_at
  BEFORE UPDATE ON public.trips
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_maintenance_updated_at
  BEFORE UPDATE ON public.maintenance
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'driver1'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();