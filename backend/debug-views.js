require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testViews() {
    console.log('--- Testing Dashboard Views with ANON KEY ---');

    const views = [
        'kanban_board',
        'daily_dashboard',
        'technician_workload',
        'bottleneck_report',
        'qc_failure_analysis'
    ];

    for (const view of views) {
        console.log(`\nTesting ${view}...`);
        try {
            const { data, error } = await supabase.from(view).select('*').limit(1);
            if (error) {
                console.error(`[FAIL] ${view}:`, error.message);
            } else {
                console.log(`[OK] ${view} - Rows: ${data.length}`);
            }
        } catch (e) {
            console.error(`[EXCEPTION] ${view}:`, e.message);
        }
    }
}

testViews();
