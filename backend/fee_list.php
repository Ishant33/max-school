<?php
/* ==========================================================================
   Fee Structure — Public API
   Read-only public endpoint to fetch fee structure data for admission.html.
   ========================================================================== */

header('Content-Type: application/json');
header('Cache-Control: no-cache, must-revalidate');

$dataFile = __DIR__ . '/fee_data.json';

function fee_defaults()
{
    return [
        'eyebrow'              => 'Transparent Pricing',
        'title'                => '3. Fee Structure',
        'description'          => 'Contact the school office for the current, grade-wise fee schedule — scholarships up to 100% available via the Max Ultimate Scholarship Test.',
        'academic_session'     => '2026–27',
        'pdf_url'              => null,
        'pdf_name'             => null,
        'rows'                 => [
            ['id' => 1, 'stage' => 'Max Junior', 'grades' => 'Pre-Nursery – KG', 'details' => 'Contact office for current fees'],
            ['id' => 2, 'stage' => 'Primary', 'grades' => 'I – V', 'details' => 'Contact office for current fees'],
            ['id' => 3, 'stage' => 'Middle & Secondary', 'grades' => 'VI – X', 'details' => 'Contact office for current fees'],
            ['id' => 4, 'stage' => 'Senior Secondary', 'grades' => 'XI – XII', 'details' => 'Contact office for current fees'],
        ],
        'scholarship_title'    => 'Max Ultimate Scholarship Test (MUST)',
        'scholarship_desc'     => 'Merit scholarships up to 100% in association with Physics Wallah Vidyapeeth for qualifying students. Contact the admissions counter for registration details.',
        'scholarship_btn_text' => 'Enquire for Fee Schedule',
        'scholarship_btn_link' => 'contact-us.html#enquiry-form',
    ];
}

$data = [];
if (file_exists($dataFile)) {
    $json = file_get_contents($dataFile);
    $data = json_decode($json, true) ?: [];
}

$output = array_merge(fee_defaults(), $data);

echo json_encode([
    'ok'   => true,
    'data' => $output
]);
