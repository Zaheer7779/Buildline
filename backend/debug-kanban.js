require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
    console.log('Testing Kanban View with ANON KEY...');
    const { data, error } = await supabase
        .from('kanban_board')
        .select('*')
        .limit(5);

    if (error) {
        console.error('KANBAN ERROR:', error);
    } else {
        console.log('KANBAN SUCCESS. Rows:', data.length);
    }
}

test();
