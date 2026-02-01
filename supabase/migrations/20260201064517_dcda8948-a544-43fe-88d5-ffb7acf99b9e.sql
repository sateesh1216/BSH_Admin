-- Update the user bandarusatish3@gmail.com from driver1 to admin
UPDATE public.profiles 
SET role = 'admin', updated_at = now() 
WHERE username = 'bandarusatish3@gmail.com';