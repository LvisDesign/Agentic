import { createClient } from '@supabase/supabase-js';

const url = 'https://qxxheinizxyyrfcrijbs.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4eGhlaW5penh5eXJmY3JpamJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMyNjAzOTksImV4cCI6MjEwODgzNjM5OX0.xMzIyxs9JVluL5kmbcpLSyb1WKRcopnNzJhl8cB41PI';

const supabase = createClient(url, anonKey);

async function test() {
  const row = {
    id: 'global_config',
    default_inspection_fee: 2500,
  };
  const { data, error } = await supabase.from('platform_settings').upsert(row).select();
  console.log('Upsert result:', { data, error });
}

test().catch(console.error);
