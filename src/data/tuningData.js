/* ─────────────────────────────────────────────────────────────
   Tuning Database — realistic stock vs. tuned figures
   Services: stage1, stage2, egr, dpf, adblue, immo, dtc, swirl, speed, o2
───────────────────────────────────────────────────────────────*/

export const SERVICE_INFO = {
  stage1: {
    label: 'Stage 1 Remap',
    tag:   'STAGE 1',
    color: '#e65c00',
    desc:  'Software-only ECU calibration via OBD port. No hardware modifications required. Optimizes fuel delivery, boost pressure, and ignition timing for maximum safe power.',
    benefit: 'Significant power & torque increase with no hardware changes',
  },
  stage2: {
    label: 'Stage 2 Remap',
    tag:   'STAGE 2',
    color: '#ff3300',
    desc:  'Advanced ECU calibration paired with upgraded hardware (intercooler, downpipe, intake). Extracts the full potential of the engine.',
    benefit: 'Maximum power gain — requires hardware upgrades',
  },
  egr: {
    label: 'EGR Delete',
    tag:   'EGR',
    color: '#2a7de1',
    desc:  'Deactivates the Exhaust Gas Recirculation system in software. Reduces carbon buildup in the intake manifold, improving engine longevity and throttle response.',
    benefit: 'Cleaner intake, reduced carbon deposits, better throttle',
  },
  dpf: {
    label: 'DPF Optimization',
    tag:   'DPF',
    color: '#2a7de1',
    desc:  'Disables DPF regeneration cycles and associated sensors in ECU software. Eliminates forced regenerations and the associated fuel penalties.',
    benefit: 'No more forced regens, improved fuel economy, less back-pressure',
  },
  adblue: {
    label: 'AdBlue Delete',
    tag:   'ADBLUE',
    color: '#2a7de1',
    desc:  'Deactivates the SCR (Selective Catalytic Reduction) system and AdBlue dosing in software. Eliminates AdBlue refill costs and SCR system faults.',
    benefit: 'No AdBlue refills, eliminates SCR-related fault codes',
  },
  immo: {
    label: 'Immobilizer Adaptation',
    tag:   'IMMO',
    color: '#9b59b6',
    desc:  'ECU immobilizer modification for replacement ECUs, key loss situations, or transponder issues. Performed on bench or via OBD depending on platform.',
    benefit: 'Resolve key/ECU mismatch, enable ECU swaps',
  },
  dtc: {
    label: 'DTC Suppression',
    tag:   'DTC',
    color: '#27ae60',
    desc:  'Suppresses specific fault codes (DTCs) triggered by removed or bypassed components, ensuring a clean dashboard after hardware modifications.',
    benefit: 'Clean fault code readout after hardware modifications',
  },
  swirl: {
    label: 'Swirl Flap Delete',
    tag:   'SWIRL',
    color: '#27ae60',
    desc:  'Software deletion of swirl flap control to complement physical swirl flap removal — eliminates the risk of flap failure and debris entering the engine.',
    benefit: 'Eliminates swirl flap failure risk in diesel engines',
  },
  speed: {
    label: 'Speed Limiter Removal',
    tag:   'VSL',
    color: '#f39c12',
    desc:  'Removes the factory-imposed top-speed limiter from the ECU calibration.',
    benefit: 'Full use of vehicle performance on private/track use',
  },
  o2: {
    label: 'O2 / Lambda Optimization',
    tag:   'O2',
    color: '#27ae60',
    desc:  'Disables or remaps rear lambda sensor checks in the ECU — required after sports catalyst or decat pipe installation.',
    benefit: 'Eliminates lambda fault codes after exhaust modifications',
  },
};

export const VEHICLES = [
  // ── BMW ──────────────────────────────────────────────────────
  {
    id: 'bmw-f20-118d',
    make: 'BMW', model: '1 Series (F20)', years: '2012–2019',
    engine: '118d 2.0d (150 PS)', fuel: 'diesel', ecu: 'Bosch EDC17C56', mode: 'OBD',
    stock: { hp: 150, nm: 320 }, stage1: { hp: 195, nm: 420 }, stage2: null,
    services: ['stage1', 'egr', 'dpf', 'dtc', 'swirl'],
  },
  {
    id: 'bmw-f20-120d',
    make: 'BMW', model: '1 Series (F20)', years: '2015–2019',
    engine: '120d 2.0d (190 PS)', fuel: 'diesel', ecu: 'Bosch EDC17C56', mode: 'OBD',
    stock: { hp: 190, nm: 400 }, stage1: { hp: 245, nm: 510 }, stage2: null,
    services: ['stage1', 'egr', 'dpf', 'dtc'],
  },
  {
    id: 'bmw-f30-320d-n47',
    make: 'BMW', model: '3 Series (F30)', years: '2012–2015',
    engine: '320d 2.0d N47 (184 PS)', fuel: 'diesel', ecu: 'Bosch EDC17C56', mode: 'OBD',
    stock: { hp: 184, nm: 380 }, stage1: { hp: 230, nm: 480 }, stage2: null,
    services: ['stage1', 'egr', 'dpf', 'dtc', 'swirl'],
  },
  {
    id: 'bmw-f30-320d-b47',
    make: 'BMW', model: '3 Series (F30)', years: '2015–2019',
    engine: '320d 2.0d B47 (190 PS)', fuel: 'diesel', ecu: 'Bosch MD1CS001', mode: 'OBD',
    stock: { hp: 190, nm: 400 }, stage1: { hp: 245, nm: 510 }, stage2: null,
    services: ['stage1', 'egr', 'dpf', 'adblue', 'dtc'],
  },
  {
    id: 'bmw-f30-330d',
    make: 'BMW', model: '3 Series (F30)', years: '2012–2019',
    engine: '330d 3.0d N57 (258 PS)', fuel: 'diesel', ecu: 'Bosch EDC17CP09', mode: 'OBD',
    stock: { hp: 258, nm: 560 }, stage1: { hp: 315, nm: 650 }, stage2: null,
    services: ['stage1', 'egr', 'dpf', 'adblue', 'dtc'],
  },
  {
    id: 'bmw-f30-335i',
    make: 'BMW', model: '3 Series (F30)', years: '2012–2015',
    engine: '335i 3.0T N55 (306 PS)', fuel: 'petrol', ecu: 'Bosch MSD81', mode: 'OBD',
    stock: { hp: 306, nm: 400 }, stage1: { hp: 375, nm: 510 }, stage2: { hp: 440, nm: 580 },
    services: ['stage1', 'stage2', 'speed', 'dtc', 'o2'],
  },
  {
    id: 'bmw-g20-330i',
    make: 'BMW', model: '3 Series (G20)', years: '2019–2024',
    engine: '330i 2.0T B48 (258 PS)', fuel: 'petrol', ecu: 'Bosch MG1CS003', mode: 'OBD',
    stock: { hp: 258, nm: 400 }, stage1: { hp: 320, nm: 490 }, stage2: { hp: 380, nm: 550 },
    services: ['stage1', 'stage2', 'speed', 'dtc', 'o2'],
  },
  {
    id: 'bmw-f10-530d',
    make: 'BMW', model: '5 Series (F10)', years: '2011–2017',
    engine: '530d 3.0d N57 (258 PS)', fuel: 'diesel', ecu: 'Bosch EDC17CP09', mode: 'OBD',
    stock: { hp: 258, nm: 560 }, stage1: { hp: 315, nm: 650 }, stage2: null,
    services: ['stage1', 'egr', 'dpf', 'adblue', 'dtc'],
  },
  {
    id: 'bmw-g30-530d',
    make: 'BMW', model: '5 Series (G30)', years: '2017–2023',
    engine: '530d 3.0d B57 (265 PS)', fuel: 'diesel', ecu: 'Bosch MD1CP002', mode: 'OBD',
    stock: { hp: 265, nm: 620 }, stage1: { hp: 335, nm: 720 }, stage2: null,
    services: ['stage1', 'egr', 'dpf', 'adblue', 'dtc'],
  },
  {
    id: 'bmw-x5-40d',
    make: 'BMW', model: 'X5 (G05)', years: '2018–2024',
    engine: 'xDrive40d 3.0d B57 (340 PS)', fuel: 'diesel', ecu: 'Bosch MD1CP002', mode: 'OBD',
    stock: { hp: 340, nm: 700 }, stage1: { hp: 410, nm: 820 }, stage2: null,
    services: ['stage1', 'egr', 'dpf', 'adblue', 'dtc'],
  },

  // ── Mercedes-Benz ─────────────────────────────────────────────
  {
    id: 'mb-w205-c220d',
    make: 'Mercedes-Benz', model: 'C-Class (W205)', years: '2015–2021',
    engine: 'C220d 2.0d OM654 (194 PS)', fuel: 'diesel', ecu: 'Bosch MD1CP001', mode: 'OBD',
    stock: { hp: 194, nm: 400 }, stage1: { hp: 245, nm: 520 }, stage2: null,
    services: ['stage1', 'egr', 'dpf', 'adblue', 'dtc'],
  },
  {
    id: 'mb-w213-e220d',
    make: 'Mercedes-Benz', model: 'E-Class (W213)', years: '2016–2023',
    engine: 'E220d 2.0d OM654 (194 PS)', fuel: 'diesel', ecu: 'Bosch MD1CP001', mode: 'OBD',
    stock: { hp: 194, nm: 400 }, stage1: { hp: 245, nm: 520 }, stage2: null,
    services: ['stage1', 'egr', 'dpf', 'adblue', 'dtc'],
  },
  {
    id: 'mb-w167-gle300d',
    make: 'Mercedes-Benz', model: 'GLE (W167)', years: '2019–2024',
    engine: 'GLE 300d 2.0d OM654 (245 PS)', fuel: 'diesel', ecu: 'Bosch MD1CP001', mode: 'OBD',
    stock: { hp: 245, nm: 500 }, stage1: { hp: 300, nm: 640 }, stage2: null,
    services: ['stage1', 'egr', 'dpf', 'adblue', 'dtc'],
  },
  {
    id: 'mb-w213-e53amg',
    make: 'Mercedes-Benz', model: 'E-Class AMG (W213)', years: '2018–2023',
    engine: 'E53 AMG 3.0T M256 (435 PS)', fuel: 'petrol', ecu: 'Bosch MG1CS002', mode: 'OBD',
    stock: { hp: 435, nm: 520 }, stage1: { hp: 510, nm: 620 }, stage2: null,
    services: ['stage1', 'speed', 'dtc', 'o2'],
  },

  // ── Volkswagen ────────────────────────────────────────────────
  {
    id: 'vw-golf7-20tdi',
    make: 'Volkswagen', model: 'Golf 7 (MK7)', years: '2013–2020',
    engine: '2.0 TDI EA288 (150 PS)', fuel: 'diesel', ecu: 'Bosch EDC17C74', mode: 'OBD',
    stock: { hp: 150, nm: 340 }, stage1: { hp: 195, nm: 430 }, stage2: null,
    services: ['stage1', 'egr', 'dpf', 'adblue', 'dtc'],
  },
  {
    id: 'vw-golf7-gti',
    make: 'Volkswagen', model: 'Golf GTI (MK7)', years: '2013–2020',
    engine: '2.0 TSI EA888 Gen3 (245 PS)', fuel: 'petrol', ecu: 'Bosch MED17.5.25', mode: 'OBD',
    stock: { hp: 245, nm: 370 }, stage1: { hp: 310, nm: 430 }, stage2: { hp: 370, nm: 470 },
    services: ['stage1', 'stage2', 'speed', 'dtc', 'o2'],
  },
  {
    id: 'vw-golf7-r',
    make: 'Volkswagen', model: 'Golf R (MK7)', years: '2013–2020',
    engine: '2.0 TSI EA888 Gen3 (310 PS)', fuel: 'petrol', ecu: 'Bosch MED17.5.25', mode: 'OBD',
    stock: { hp: 310, nm: 380 }, stage1: { hp: 385, nm: 500 }, stage2: { hp: 435, nm: 550 },
    services: ['stage1', 'stage2', 'speed', 'dtc', 'o2'],
  },
  {
    id: 'vw-golf8-gti',
    make: 'Volkswagen', model: 'Golf GTI (MK8)', years: '2021–2024',
    engine: '2.0 TSI EA888 Gen4 (245 PS)', fuel: 'petrol', ecu: 'Bosch MG1CS111', mode: 'OBD',
    stock: { hp: 245, nm: 370 }, stage1: { hp: 315, nm: 440 }, stage2: { hp: 375, nm: 490 },
    services: ['stage1', 'stage2', 'speed', 'dtc', 'o2'],
  },
  {
    id: 'vw-tiguan-20tdi',
    make: 'Volkswagen', model: 'Tiguan (MK2)', years: '2017–2024',
    engine: '2.0 TDI EA288 (150 PS)', fuel: 'diesel', ecu: 'Bosch EDC17C74', mode: 'OBD',
    stock: { hp: 150, nm: 340 }, stage1: { hp: 195, nm: 430 }, stage2: null,
    services: ['stage1', 'egr', 'dpf', 'adblue', 'dtc'],
  },
  {
    id: 'vw-touareg-30tdi',
    make: 'Volkswagen', model: 'Touareg (CR)', years: '2018–2024',
    engine: '3.0 TDI V6 (286 PS)', fuel: 'diesel', ecu: 'Bosch EDC17CP44', mode: 'OBD',
    stock: { hp: 286, nm: 600 }, stage1: { hp: 355, nm: 750 }, stage2: null,
    services: ['stage1', 'egr', 'dpf', 'adblue', 'dtc'],
  },

  // ── Audi ──────────────────────────────────────────────────────
  {
    id: 'audi-a3-20tdi',
    make: 'Audi', model: 'A3 (8V)', years: '2013–2020',
    engine: '2.0 TDI EA288 (150 PS)', fuel: 'diesel', ecu: 'Bosch EDC17C74', mode: 'OBD',
    stock: { hp: 150, nm: 340 }, stage1: { hp: 195, nm: 430 }, stage2: null,
    services: ['stage1', 'egr', 'dpf', 'adblue', 'dtc'],
  },
  {
    id: 'audi-a3-s3',
    make: 'Audi', model: 'S3 (8V)', years: '2013–2020',
    engine: '2.0 TFSI EA888 Gen3 (310 PS)', fuel: 'petrol', ecu: 'Bosch MED17.1.62', mode: 'OBD',
    stock: { hp: 310, nm: 380 }, stage1: { hp: 385, nm: 500 }, stage2: { hp: 435, nm: 550 },
    services: ['stage1', 'stage2', 'speed', 'dtc', 'o2'],
  },
  {
    id: 'audi-a4-20tdi',
    make: 'Audi', model: 'A4 (B9)', years: '2016–2024',
    engine: '2.0 TDI EA288 (190 PS)', fuel: 'diesel', ecu: 'Bosch EDC17C74', mode: 'OBD',
    stock: { hp: 190, nm: 400 }, stage1: { hp: 245, nm: 510 }, stage2: null,
    services: ['stage1', 'egr', 'dpf', 'adblue', 'dtc'],
  },
  {
    id: 'audi-a6-30tdi',
    make: 'Audi', model: 'A6 (C8)', years: '2018–2024',
    engine: '3.0 TDI V6 (286 PS)', fuel: 'diesel', ecu: 'Bosch EDC17CP44', mode: 'OBD',
    stock: { hp: 286, nm: 620 }, stage1: { hp: 355, nm: 760 }, stage2: null,
    services: ['stage1', 'egr', 'dpf', 'adblue', 'dtc'],
  },
  {
    id: 'audi-rs3-8y',
    make: 'Audi', model: 'RS3 (8Y)', years: '2021–2024',
    engine: '2.5 TFSI EA855 Evo (400 PS)', fuel: 'petrol', ecu: 'Bosch MG1CS111', mode: 'OBD',
    stock: { hp: 400, nm: 500 }, stage1: { hp: 465, nm: 580 }, stage2: { hp: 520, nm: 640 },
    services: ['stage1', 'stage2', 'speed', 'dtc', 'o2'],
  },
  {
    id: 'audi-sq5-30tdi',
    make: 'Audi', model: 'SQ5 (FY)', years: '2017–2024',
    engine: '3.0 TDI V6 (347 PS)', fuel: 'diesel', ecu: 'Bosch EDC17CP44', mode: 'OBD',
    stock: { hp: 347, nm: 700 }, stage1: { hp: 420, nm: 830 }, stage2: null,
    services: ['stage1', 'egr', 'dpf', 'adblue', 'dtc'],
  },

  // ── Ford ──────────────────────────────────────────────────────
  {
    id: 'ford-focus-st',
    make: 'Ford', model: 'Focus ST (MK3)', years: '2012–2018',
    engine: '2.0 EcoBoost (250 PS)', fuel: 'petrol', ecu: 'Bosch MED17.0.1', mode: 'OBD',
    stock: { hp: 250, nm: 360 }, stage1: { hp: 310, nm: 440 }, stage2: { hp: 365, nm: 490 },
    services: ['stage1', 'stage2', 'speed', 'dtc', 'o2'],
  },
  {
    id: 'ford-fiesta-st',
    make: 'Ford', model: 'Fiesta ST (MK7)', years: '2013–2022',
    engine: '1.5 EcoBoost (200 PS)', fuel: 'petrol', ecu: 'Bosch MED17.2', mode: 'OBD',
    stock: { hp: 200, nm: 290 }, stage1: { hp: 255, nm: 360 }, stage2: { hp: 295, nm: 400 },
    services: ['stage1', 'stage2', 'speed', 'dtc'],
  },
  {
    id: 'ford-mondeo-20tdci',
    make: 'Ford', model: 'Mondeo (MK5)', years: '2015–2022',
    engine: '2.0 TDCi (180 PS)', fuel: 'diesel', ecu: 'Bosch EDC17C10', mode: 'OBD',
    stock: { hp: 180, nm: 380 }, stage1: { hp: 225, nm: 460 }, stage2: null,
    services: ['stage1', 'egr', 'dpf', 'dtc'],
  },
  {
    id: 'ford-transit-20tdci',
    make: 'Ford', model: 'Transit Custom (MK1)', years: '2014–2023',
    engine: '2.0 EcoBlue TDCi (130 PS)', fuel: 'diesel', ecu: 'Bosch EDC17C10', mode: 'OBD',
    stock: { hp: 130, nm: 340 }, stage1: { hp: 175, nm: 400 }, stage2: null,
    services: ['stage1', 'egr', 'dpf', 'adblue', 'dtc'],
  },

  // ── Land Rover ────────────────────────────────────────────────
  {
    id: 'lr-rr-sport-30d',
    make: 'Land Rover', model: 'Range Rover Sport (L461)', years: '2022–2024',
    engine: '3.0 D300 (300 PS)', fuel: 'diesel', ecu: 'Bosch MD1CP004', mode: 'OBD',
    stock: { hp: 300, nm: 650 }, stage1: { hp: 365, nm: 760 }, stage2: null,
    services: ['stage1', 'egr', 'dpf', 'adblue', 'dtc'],
  },
  {
    id: 'lr-defender-20d',
    make: 'Land Rover', model: 'Defender (L663)', years: '2020–2024',
    engine: '2.0 D200 (200 PS)', fuel: 'diesel', ecu: 'Bosch MD1CP004', mode: 'OBD',
    stock: { hp: 200, nm: 430 }, stage1: { hp: 250, nm: 520 }, stage2: null,
    services: ['stage1', 'egr', 'dpf', 'adblue', 'dtc'],
  },
  {
    id: 'lr-discovery5-30d',
    make: 'Land Rover', model: 'Discovery 5 (L462)', years: '2017–2024',
    engine: '3.0 SD6 (306 PS)', fuel: 'diesel', ecu: 'Bosch MD1CP004', mode: 'OBD',
    stock: { hp: 306, nm: 700 }, stage1: { hp: 370, nm: 800 }, stage2: null,
    services: ['stage1', 'egr', 'dpf', 'adblue', 'dtc'],
  },

  // ── Jaguar ────────────────────────────────────────────────────
  {
    id: 'jag-fpace-20d',
    make: 'Jaguar', model: 'F-Pace (X761)', years: '2016–2024',
    engine: '2.0d D200 (204 PS)', fuel: 'diesel', ecu: 'Bosch MD1CP004', mode: 'OBD',
    stock: { hp: 204, nm: 430 }, stage1: { hp: 255, nm: 520 }, stage2: null,
    services: ['stage1', 'egr', 'dpf', 'adblue', 'dtc'],
  },
  {
    id: 'jag-xe-20d',
    make: 'Jaguar', model: 'XE (X760)', years: '2015–2024',
    engine: '2.0d D180 (180 PS)', fuel: 'diesel', ecu: 'Bosch MD1CP004', mode: 'OBD',
    stock: { hp: 180, nm: 430 }, stage1: { hp: 230, nm: 510 }, stage2: null,
    services: ['stage1', 'egr', 'dpf', 'adblue', 'dtc'],
  },

  // ── Toyota ────────────────────────────────────────────────────
  {
    id: 'toyota-lc200-v8d',
    make: 'Toyota', model: 'Land Cruiser 200', years: '2008–2021',
    engine: '4.5 V8 1VD-FTV (272 PS)', fuel: 'diesel', ecu: 'Denso 89661', mode: 'OBD+Bench',
    stock: { hp: 272, nm: 650 }, stage1: { hp: 345, nm: 780 }, stage2: null,
    services: ['stage1', 'egr', 'dpf', 'dtc'],
  },
  {
    id: 'toyota-hilux-28d',
    make: 'Toyota', model: 'HiLux (AN120)', years: '2016–2024',
    engine: '2.8 D-4D 1GD-FTV (177 PS)', fuel: 'diesel', ecu: 'Denso SH7058', mode: 'OBD+Bench',
    stock: { hp: 177, nm: 450 }, stage1: { hp: 225, nm: 540 }, stage2: null,
    services: ['stage1', 'egr', 'dpf', 'dtc'],
  },
  {
    id: 'toyota-gr-yaris',
    make: 'Toyota', model: 'GR Yaris (GXPA16)', years: '2020–2024',
    engine: '1.6T G16E-GTS (261 PS)', fuel: 'petrol', ecu: 'Denso SH72543', mode: 'OBD+Bench',
    stock: { hp: 261, nm: 360 }, stage1: { hp: 310, nm: 430 }, stage2: { hp: 360, nm: 480 },
    services: ['stage1', 'stage2', 'speed', 'dtc'],
  },

  // ── Hyundai / Kia ─────────────────────────────────────────────
  {
    id: 'hyundai-i30n',
    make: 'Hyundai', model: 'i30 N (PD)', years: '2017–2023',
    engine: '2.0 T-GDI G4KH (280 PS)', fuel: 'petrol', ecu: 'Bosch MED17.9.8', mode: 'OBD',
    stock: { hp: 280, nm: 392 }, stage1: { hp: 345, nm: 460 }, stage2: { hp: 395, nm: 510 },
    services: ['stage1', 'stage2', 'speed', 'dtc'],
  },
  {
    id: 'kia-stinger-33t',
    make: 'Kia', model: 'Stinger (CK)', years: '2018–2023',
    engine: '3.3 T-GDI G6DP (370 PS)', fuel: 'petrol', ecu: 'Bosch MED17.9.8', mode: 'OBD',
    stock: { hp: 370, nm: 510 }, stage1: { hp: 440, nm: 570 }, stage2: null,
    services: ['stage1', 'speed', 'dtc'],
  },
  {
    id: 'kia-sportage-20crdi',
    make: 'Kia', model: 'Sportage (QL)', years: '2016–2022',
    engine: '2.0 CRDi D4HA (136 PS)', fuel: 'diesel', ecu: 'Bosch EDC17C57', mode: 'OBD',
    stock: { hp: 136, nm: 320 }, stage1: { hp: 180, nm: 400 }, stage2: null,
    services: ['stage1', 'egr', 'dpf', 'dtc'],
  },

  // ── Porsche ───────────────────────────────────────────────────
  {
    id: 'porsche-cayenne-30tdi',
    make: 'Porsche', model: 'Cayenne (9YA)', years: '2018–2024',
    engine: '3.0 TDI V6 (286 PS)', fuel: 'diesel', ecu: 'Bosch EDC17CP44', mode: 'OBD',
    stock: { hp: 286, nm: 650 }, stage1: { hp: 360, nm: 780 }, stage2: null,
    services: ['stage1', 'egr', 'dpf', 'adblue', 'dtc'],
  },
  {
    id: 'porsche-macan-20t',
    make: 'Porsche', model: 'Macan (95B)', years: '2014–2023',
    engine: '2.0T EA888 (252 PS)', fuel: 'petrol', ecu: 'Bosch MED17.1.62', mode: 'OBD',
    stock: { hp: 252, nm: 370 }, stage1: { hp: 315, nm: 450 }, stage2: { hp: 365, nm: 500 },
    services: ['stage1', 'stage2', 'speed', 'dtc'],
  },

  // ── Volvo ─────────────────────────────────────────────────────
  {
    id: 'volvo-xc60-d5',
    make: 'Volvo', model: 'XC60 (SPA)', years: '2017–2024',
    engine: 'D5 2.0d (235 PS)', fuel: 'diesel', ecu: 'Bosch MD1CS006', mode: 'OBD',
    stock: { hp: 235, nm: 480 }, stage1: { hp: 295, nm: 600 }, stage2: null,
    services: ['stage1', 'egr', 'dpf', 'adblue', 'dtc'],
  },
  {
    id: 'volvo-v60-b4',
    make: 'Volvo', model: 'V60 (SPA)', years: '2019–2024',
    engine: 'B4 2.0T (197 PS)', fuel: 'petrol', ecu: 'Bosch MG1CS006', mode: 'OBD',
    stock: { hp: 197, nm: 300 }, stage1: { hp: 250, nm: 380 }, stage2: { hp: 290, nm: 420 },
    services: ['stage1', 'stage2', 'speed', 'dtc'],
  },

  // ── Skoda ─────────────────────────────────────────────────────
  {
    id: 'skoda-octavia-rs',
    make: 'Skoda', model: 'Octavia RS (5E)', years: '2013–2020',
    engine: '2.0 TSI EA888 Gen3 (245 PS)', fuel: 'petrol', ecu: 'Bosch MED17.5.25', mode: 'OBD',
    stock: { hp: 245, nm: 370 }, stage1: { hp: 310, nm: 430 }, stage2: { hp: 370, nm: 470 },
    services: ['stage1', 'stage2', 'speed', 'dtc', 'o2'],
  },
  {
    id: 'skoda-superb-20tdi',
    make: 'Skoda', model: 'Superb (3V)', years: '2015–2024',
    engine: '2.0 TDI EA288 (190 PS)', fuel: 'diesel', ecu: 'Bosch EDC17C74', mode: 'OBD',
    stock: { hp: 190, nm: 400 }, stage1: { hp: 245, nm: 510 }, stage2: null,
    services: ['stage1', 'egr', 'dpf', 'adblue', 'dtc'],
  },

  // ── Seat / Cupra ──────────────────────────────────────────────
  {
    id: 'cupra-formentor-20tsi',
    make: 'Cupra', model: 'Formentor (KM)', years: '2021–2024',
    engine: '2.0 TSI EA888 Gen3 (310 PS)', fuel: 'petrol', ecu: 'Bosch MG1CS111', mode: 'OBD',
    stock: { hp: 310, nm: 400 }, stage1: { hp: 385, nm: 510 }, stage2: { hp: 435, nm: 560 },
    services: ['stage1', 'stage2', 'speed', 'dtc', 'o2'],
  },

  // ── Nissan ────────────────────────────────────────────────────
  {
    id: 'nissan-navara-23d',
    make: 'Nissan', model: 'Navara (NP300)', years: '2016–2024',
    engine: '2.3 dCi YS23 (190 PS)', fuel: 'diesel', ecu: 'Continental SID310', mode: 'OBD',
    stock: { hp: 190, nm: 450 }, stage1: { hp: 240, nm: 550 }, stage2: null,
    services: ['stage1', 'egr', 'dpf', 'adblue', 'dtc'],
  },
  {
    id: 'nissan-gtr-r35',
    make: 'Nissan', model: 'GT-R (R35)', years: '2008–2024',
    engine: '3.8T VR38DETT (570 PS)', fuel: 'petrol', ecu: 'Hitachi', mode: 'Bench',
    stock: { hp: 570, nm: 637 }, stage1: { hp: 640, nm: 720 }, stage2: { hp: 700, nm: 800 },
    services: ['stage1', 'stage2', 'speed', 'dtc'],
  },

  // ── Mazda ─────────────────────────────────────────────────────
  {
    id: 'mazda-cx5-22d',
    make: 'Mazda', model: 'CX-5 (KF)', years: '2017–2024',
    engine: '2.2 SkyActiv-D SH-VPTS (184 PS)', fuel: 'diesel', ecu: 'Denso SH7058', mode: 'OBD+Bench',
    stock: { hp: 184, nm: 445 }, stage1: { hp: 230, nm: 530 }, stage2: null,
    services: ['stage1', 'egr', 'dpf', 'dtc'],
  },

  // ── Renault ───────────────────────────────────────────────────
  {
    id: 'renault-megane-rs',
    make: 'Renault', model: 'Megane RS (MK3)', years: '2010–2016',
    engine: '2.0T F4RT (265 PS)', fuel: 'petrol', ecu: 'Siemens SID310', mode: 'Bench',
    stock: { hp: 265, nm: 360 }, stage1: { hp: 320, nm: 420 }, stage2: { hp: 365, nm: 460 },
    services: ['stage1', 'stage2', 'speed', 'dtc', 'immo'],
  },
  {
    id: 'renault-megane4-rs',
    make: 'Renault', model: 'Megane RS (MK4)', years: '2017–2023',
    engine: '1.8T M5PT (300 PS)', fuel: 'petrol', ecu: 'Bosch MED17.7.3', mode: 'OBD+Bench',
    stock: { hp: 300, nm: 420 }, stage1: { hp: 365, nm: 490 }, stage2: { hp: 415, nm: 540 },
    services: ['stage1', 'stage2', 'speed', 'dtc'],
  },
  {
    id: 'renault-trafic-20dci',
    make: 'Renault', model: 'Trafic (X82)', years: '2014–2023',
    engine: '2.0 dCi M9R (145 PS)', fuel: 'diesel', ecu: 'Bosch EDC17C11', mode: 'OBD',
    stock: { hp: 145, nm: 340 }, stage1: { hp: 185, nm: 420 }, stage2: null,
    services: ['stage1', 'egr', 'dpf', 'adblue', 'dtc'],
  },

  // ── Peugeot / Citroën ─────────────────────────────────────────
  {
    id: 'peugeot-308-gti',
    make: 'Peugeot', model: '308 GTi (T9)', years: '2015–2021',
    engine: '1.6T THP 270 (272 PS)', fuel: 'petrol', ecu: 'Bosch MED17.4.4', mode: 'OBD+Bench',
    stock: { hp: 272, nm: 330 }, stage1: { hp: 330, nm: 400 }, stage2: { hp: 375, nm: 440 },
    services: ['stage1', 'stage2', 'speed', 'dtc'],
  },
  {
    id: 'citroen-c5-aircross-15d',
    make: 'Citroën', model: 'C5 Aircross (E3)', years: '2018–2024',
    engine: '1.5 BlueHDi (131 PS)', fuel: 'diesel', ecu: 'Bosch MD1CS003', mode: 'OBD+Bench',
    stock: { hp: 131, nm: 300 }, stage1: { hp: 175, nm: 370 }, stage2: null,
    services: ['stage1', 'egr', 'dpf', 'adblue', 'dtc'],
  },
  {
    id: 'peugeot-508-20d',
    make: 'Peugeot', model: '508 (R8)', years: '2018–2024',
    engine: '2.0 BlueHDi (180 PS)', fuel: 'diesel', ecu: 'Bosch MD1CS003', mode: 'OBD+Bench',
    stock: { hp: 180, nm: 400 }, stage1: { hp: 230, nm: 480 }, stage2: null,
    services: ['stage1', 'egr', 'dpf', 'adblue', 'dtc'],
  },

  // ── Opel / Vauxhall ───────────────────────────────────────────
  {
    id: 'opel-astra-opc',
    make: 'Opel', model: 'Astra OPC (J)', years: '2012–2015',
    engine: '2.0T A20NFT (280 PS)', fuel: 'petrol', ecu: 'Bosch ME7.6.2', mode: 'Bench',
    stock: { hp: 280, nm: 400 }, stage1: { hp: 340, nm: 460 }, stage2: { hp: 390, nm: 510 },
    services: ['stage1', 'stage2', 'speed', 'dtc', 'immo'],
  },
  {
    id: 'opel-insignia-biturbo',
    make: 'Opel', model: 'Insignia BiTurbo (B)', years: '2017–2022',
    engine: '2.0 CDTI BiTurbo (210 PS)', fuel: 'diesel', ecu: 'Bosch EDC17C18', mode: 'OBD',
    stock: { hp: 210, nm: 450 }, stage1: { hp: 270, nm: 540 }, stage2: null,
    services: ['stage1', 'egr', 'dpf', 'adblue', 'dtc'],
  },

  // ── Alfa Romeo ────────────────────────────────────────────────
  {
    id: 'alfa-giulia-qv',
    make: 'Alfa Romeo', model: 'Giulia QV (952)', years: '2016–2024',
    engine: '2.9T V6 690T (510 PS)', fuel: 'petrol', ecu: 'Bosch MED17.3.5', mode: 'OBD',
    stock: { hp: 510, nm: 600 }, stage1: { hp: 580, nm: 680 }, stage2: null,
    services: ['stage1', 'speed', 'dtc', 'o2'],
  },
  {
    id: 'alfa-stelvio-20t',
    make: 'Alfa Romeo', model: 'Stelvio 2.0T (949)', years: '2017–2024',
    engine: '2.0T GME (280 PS)', fuel: 'petrol', ecu: 'Bosch MED17.3.5', mode: 'OBD',
    stock: { hp: 280, nm: 400 }, stage1: { hp: 345, nm: 470 }, stage2: { hp: 390, nm: 520 },
    services: ['stage1', 'stage2', 'speed', 'dtc'],
  },

  // ── Fiat ──────────────────────────────────────────────────────
  {
    id: 'fiat-124-spider',
    make: 'Fiat', model: '124 Spider (348)', years: '2016–2020',
    engine: '1.4 MultiAir (140 PS)', fuel: 'petrol', ecu: 'Marelli 8GMF', mode: 'OBD+Bench',
    stock: { hp: 140, nm: 240 }, stage1: { hp: 185, nm: 295 }, stage2: { hp: 215, nm: 330 },
    services: ['stage1', 'stage2', 'speed', 'dtc', 'immo'],
  },

  // ── GM / Chevrolet ────────────────────────────────────────────
  {
    id: 'chevrolet-corvette-c7',
    make: 'Chevrolet', model: 'Corvette C7 (C7)', years: '2014–2019',
    engine: '6.2 V8 LT1 (460 PS)', fuel: 'petrol', ecu: 'Delco E92', mode: 'OBD',
    stock: { hp: 460, nm: 630 }, stage1: { hp: 530, nm: 700 }, stage2: { hp: 580, nm: 760 },
    services: ['stage1', 'stage2', 'speed', 'dtc', 'o2'],
  },
  {
    id: 'chevrolet-camaro-ss',
    make: 'Chevrolet', model: 'Camaro SS (Gen6)', years: '2016–2024',
    engine: '6.2 V8 LT1 (450 PS)', fuel: 'petrol', ecu: 'Delco E92', mode: 'OBD',
    stock: { hp: 450, nm: 617 }, stage1: { hp: 520, nm: 690 }, stage2: { hp: 570, nm: 750 },
    services: ['stage1', 'stage2', 'speed', 'dtc', 'o2'],
  },

  // ── BMW (Bench-only / advanced) ───────────────────────────────
  {
    id: 'bmw-m3-f80',
    make: 'BMW', model: 'M3 (F80)', years: '2014–2018',
    engine: '3.0T S55 (431 PS)', fuel: 'petrol', ecu: 'Bosch MSD87', mode: 'OBD+Bench',
    stock: { hp: 431, nm: 550 }, stage1: { hp: 510, nm: 640 }, stage2: { hp: 570, nm: 700 },
    services: ['stage1', 'stage2', 'speed', 'dtc', 'o2'],
  },
  {
    id: 'bmw-m5-f90',
    make: 'BMW', model: 'M5 (F90)', years: '2018–2024',
    engine: '4.4T V8 S63 (600 PS)', fuel: 'petrol', ecu: 'Bosch MG1CS201', mode: 'OBD+Bench',
    stock: { hp: 600, nm: 750 }, stage1: { hp: 700, nm: 870 }, stage2: { hp: 750, nm: 930 },
    services: ['stage1', 'stage2', 'speed', 'dtc', 'o2'],
  },

  // ── Mercedes (Bench-mode platforms) ──────────────────────────
  {
    id: 'mb-amg-gt-black',
    make: 'Mercedes-Benz', model: 'AMG GT Black Series (C190)', years: '2020–2023',
    engine: '4.0T V8 M178 LS2 (730 PS)', fuel: 'petrol', ecu: 'Bosch MG1CS002', mode: 'Bench',
    stock: { hp: 730, nm: 800 }, stage1: { hp: 820, nm: 900 }, stage2: null,
    services: ['stage1', 'speed', 'dtc'],
  },
  {
    id: 'mb-w463-g63',
    make: 'Mercedes-Benz', model: 'G63 AMG (W463)', years: '2018–2024',
    engine: '4.0T V8 M177 (585 PS)', fuel: 'petrol', ecu: 'Bosch MG1CS002', mode: 'OBD+Bench',
    stock: { hp: 585, nm: 850 }, stage1: { hp: 680, nm: 950 }, stage2: { hp: 740, nm: 1020 },
    services: ['stage1', 'stage2', 'speed', 'dtc'],
  },

  // ── Subaru ────────────────────────────────────────────────────
  {
    id: 'subaru-wrx-sti',
    make: 'Subaru', model: 'WRX STI (VAB)', years: '2014–2021',
    engine: '2.5T EJ257 (300 PS)', fuel: 'petrol', ecu: 'Denso SH7058', mode: 'OBD+Bench',
    stock: { hp: 300, nm: 407 }, stage1: { hp: 365, nm: 470 }, stage2: { hp: 420, nm: 540 },
    services: ['stage1', 'stage2', 'speed', 'dtc', 'o2'],
  },
  {
    id: 'subaru-wrx-vb',
    make: 'Subaru', model: 'WRX (VB)', years: '2022–2024',
    engine: '2.4T FA24 (271 PS)', fuel: 'petrol', ecu: 'Denso SH72543', mode: 'OBD+Bench',
    stock: { hp: 271, nm: 350 }, stage1: { hp: 330, nm: 430 }, stage2: { hp: 380, nm: 490 },
    services: ['stage1', 'stage2', 'speed', 'dtc'],
  },

  // ── Mitsubishi ────────────────────────────────────────────────
  {
    id: 'mitsubishi-evo-x',
    make: 'Mitsubishi', model: 'Lancer Evo X (CZ4A)', years: '2008–2016',
    engine: '2.0T 4B11T (300 PS)', fuel: 'petrol', ecu: 'Mitsubishi MH8304F', mode: 'Bench',
    stock: { hp: 300, nm: 422 }, stage1: { hp: 370, nm: 500 }, stage2: { hp: 430, nm: 570 },
    services: ['stage1', 'stage2', 'speed', 'dtc', 'immo'],
  },

  // ── Honda ─────────────────────────────────────────────────────
  {
    id: 'honda-civic-type-r',
    make: 'Honda', model: 'Civic Type R (FK8)', years: '2017–2022',
    engine: '2.0T K20C1 (320 PS)', fuel: 'petrol', ecu: 'Keihin 37820', mode: 'OBD+Bench',
    stock: { hp: 320, nm: 400 }, stage1: { hp: 385, nm: 460 }, stage2: { hp: 430, nm: 510 },
    services: ['stage1', 'stage2', 'speed', 'dtc'],
  },
];
