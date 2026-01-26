require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
    console.error('Missing Service Key');
    process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function checkBike() {
    const barcode = 'DEMO-BIKE-003';
    console.log(`Checking bike: ${barcode}`);

    const { data: journey, error } = await supabaseAdmin
        .from('assembly_journeys')
        .select(`
      *,
      technician:technician_id(id, full_name, email)
    `)
        .eq('barcode', barcode)
        .single();

    if (error) {
        console.log('Bike not found or error:', error ? error.message : 'Unknown');
        return;
    }

    console.log('FULL_JSON_START');
    console.log(JSON.stringify(journey, null, 2));
    console.log('FULL_JSON_END');
}

checkBike();
