import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://xhsnuyouuzwrktyisnhv.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhoc251eW91dXp3cmt0eWlzbmh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzMDAyNjIsImV4cCI6MjA3OTg3NjI2Mn0.vUuFmMKUS8H5fYqStvWv8lQN-mnRfvBb-uGQd7LAZuE";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
