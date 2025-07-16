
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://zrchzlewjnojxxznxexa.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpyY2h6bGV3am5vanh4em54ZXhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzNjExMzEsImV4cCI6MjA2MTkzNzEzMX0.dUqIW1D9O7JQ2oigNzrm6utBUKMyhuZfTl2hf8fVq0M";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
