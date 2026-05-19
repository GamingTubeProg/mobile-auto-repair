import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import './Admin.css';

const STORAGE_KEY = 'mar_features';

const FEATURE_DEFS = [
  {
    key: 'ESTIMATOR_SHOW_PRICE',
    label: 'Show Price Estimate',
    description:
      'Displays the preliminary CAD price range (e.g. $220 – $480) on the result step of the Estimator. ' +
      'A note explains the final price may adjust slightly after on-site inspection.',
    defaultVal: true,
    tag: 'Estimator',
  },
  {
    key: 'ESTIMATOR_ENABLED',
    label: 'Estimator Wizard',
    description:
      'Shows or hides the entire 4-step Estimator section and the "Estimate" navbar link. ' +
      'Turn off to run the site in contact-form-only mode.',
    defaultVal: true,
    tag: 'Layout',
  },
  {
    key: 'SHOW_REVIEW_PHOTOS',
    label: 'Show Review Photos',
    description:
      'When ON, photos uploaded by customers with their review appear as small thumbnails ' +
      'in the Testimonials section on the homepage. When OFF, photos are still uploaded and ' +
      'stored — only the public display is hidden.',
    defaultVal: true,
    tag: 'Reviews',
  },
  {
    key: 'STICKY_CALL_BUTTON',
    label: 'Sticky "Call Now" Button (Mobile)',
    description:
      'When ON, a floating orange "Call Now" button is shown at the bottom-right of every ' +
      'page on mobile devices, making it one-tap to phone you. Hidden on desktop. ' +
      'Turn off if it feels intrusive or during quiet hours.',
    defaultVal: true,
    tag: 'Layout',
  },
];

function loadStored() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function getEffective(stored) {
  return Object.fromEntries(
    FEATURE_DEFS.map(f => [f.key, f.key in stored ? Boolean(stored[f.key]) : f.defaultVal])
  );
}

/* ── Availability calendar helpers ─────────────────────── */
const ADM_DAY_NAMES   = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const ADM_MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const ADM_TIME_SLOTS  = [
  { id: '08:00-10:30', label: '8–10:30 AM' },
  { id: '10:30-13:00', label: '10:30–1 PM' },
  { id: '13:00-15:30', label: '1–3:30 PM' },
  { id: '15:30-18:00', label: '3:30–6 PM' },
];

/* Slot ranges for the Add Entry / Block Time modal */
const RANGE_TO_SLOTS = {
  'slot-0':    ['09:00-11:00'],
  'slot-1':    ['11:00-13:00'],
  'slot-2':    ['13:00-15:00'],
  'slot-3':    ['15:00-17:00'],
  'morning':   ['09:00-11:00', '11:00-13:00'],
  'afternoon': ['13:00-15:00', '15:00-17:00'],
  'full':      ['09:00-11:00', '11:00-13:00', '13:00-15:00', '15:00-17:00'],
};

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

const EMPTY_ENTRY = {
  date:              todayStr(),
  range:             'full',
  reason:            '',
  name:              '',
  phone:             '',
  vehicle:           '',
  service_type:      'reparatur',
  /* Minute-precise time fields used in Appointment mode.
     Customer-facing time_slot is derived from start_time on save. */
  start_time:        '09:00',
  end_time:          '10:00',
  appointmentStatus: 'confirmed',
  notes:             '',
};

/**
 * Given a "HH:MM" start time, return the customer-facing 2.5h slot
 * that contains it (used to derive the time_slot column).
 */
function admDeriveSlot(startTime) {
  for (const s of ADM_TIME_SLOTS) {
    const [bStart, bEnd] = s.id.split('-');
    if (startTime >= bStart && startTime < bEnd) return s.id;
  }
  return ADM_TIME_SLOTS[ADM_TIME_SLOTS.length - 1].id;
}

function admDateStr(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function admWeekDates(monday) {
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(monday); d.setDate(monday.getDate() + i); return d;
  });
}

function admThisMonday() {
  const d = new Date(); d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  return d;
}

const STATUS_LABELS = {
  pending:   { label: 'Pending',   color: 'orange' },
  confirmed: { label: 'Confirmed', color: 'green'  },
  completed: { label: 'Completed', color: 'blue'   },
  cancelled: { label: 'Cancelled', color: 'red'    },
};

const SERVICE_LABELS = {
  diagnose:  'Diagnostics',
  reparatur: 'Repair',
  tuning:    'ECU Tuning',
  wartung:   'Maintenance',
  sonstiges: 'Other',
};

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-');
  return `${d}.${m}.${y}`;
}

/** Convert a "HH:MM" 24-hour string to "H AM/PM" (or "H:MM AM/PM"). */
function to12h(t24) {
  if (!t24) return '';
  const [hStr, mStr] = t24.split(':');
  const h     = parseInt(hStr, 10);
  const m     = parseInt(mStr, 10);
  const pm    = h >= 12;
  const h12   = ((h + 11) % 12) + 1;
  const mPart = m ? `:${String(m).padStart(2, '0')}` : '';
  return `${h12}${mPart} ${pm ? 'PM' : 'AM'}`;
}

/** Format a "HH:MM-HH:MM" slot ID into "H – H AM/PM". Falls back to the raw string. */
function formatSlot(slotId) {
  if (!slotId || !slotId.includes('-')) return slotId || '—';
  const [a, b] = slotId.split('-');
  return `${to12h(a)} – ${to12h(b)}`;
}

const Admin = () => {
  const [stored,       setStored]       = useState(loadStored);
  const [saved,        setSaved]        = useState(false);
  const [copied,       setCopied]       = useState(false);
  const [deployStatus, setDeployStatus] = useState(null);
  const [serverOnline, setServerOnline] = useState(null);

  // ── Bookings state ───────────────────────────────────────
  const [bookings,        setBookings]        = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [bookingsFilter,  setBookingsFilter]  = useState('upcoming');
  const [statusUpdating,  setStatusUpdating]  = useState(null);

  // ── Availability state ───────────────────────────────────
  const [availWeekStart, setAvailWeekStart] = useState(admThisMonday);
  const [availData,      setAvailData]      = useState([]);
  const [availLoading,   setAvailLoading]   = useState(true);
  const [slotToggling,   setSlotToggling]   = useState(null);
  const [dayBlocking,    setDayBlocking]    = useState(null);

  // ── Reviews state ────────────────────────────────────────
  const [reviews,        setReviews]        = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsFilter,  setReviewsFilter]  = useState('pending');
  const [reviewUpdating, setReviewUpdating] = useState(null);

  // ── Add Entry modal state ────────────────────────────────
  const [entryModal,  setEntryModal]  = useState(false);
  const [entryMode,   setEntryMode]   = useState('block');
  const [entryForm,   setEntryForm]   = useState(EMPTY_ENTRY);
  const [entrySaving, setEntrySaving] = useState(false);
  const [entryError,  setEntryError]  = useState('');

  // ── Edit Review modal state ───────────────────────────────
  const [reviewEdit,        setReviewEdit]        = useState(null); // the row being edited, or null
  const [reviewEditSaving,  setReviewEditSaving]  = useState(false);
  const [reviewEditError,   setReviewEditError]   = useState('');

  // ── Booking Details / Edit modal state ────────────────────
  const [bookingDetails,   setBookingDetails]   = useState(null); // the booking shown read-only
  const [bookingEdit,      setBookingEdit]      = useState(null); // the booking being edited
  const [bookingEditSaving, setBookingEditSaving] = useState(false);
  const [bookingEditError,  setBookingEditError]  = useState('');

  // ── Drag-and-drop appointment reschedule state ───────────
  const [dragId,     setDragId]     = useState(null); // id of booking being dragged
  const [dragOverDate, setDragOverDate] = useState(null); // date currently hovered

  // Bumping this triggers both load effects to re-run from Supabase —
  // gives us an authoritative refresh after any mutation, including
  // ones we made elsewhere (e.g. customer just booked while admin was
  // looking at the calendar).
  const [refreshTick, setRefreshTick] = useState(0);
  const refreshFromDb = () => setRefreshTick(n => n + 1);

  // Drop the dragged booking onto a different date. Same start/end time,
  // just a new booking_date. Optimistic state update first, then DB.
  const handleApptDrop = async (targetDate) => {
    const id = dragId;
    setDragId(null);
    setDragOverDate(null);
    if (!id || !targetDate) return;
    const moving = availData.find(b => b.id === id);
    if (!moving || moving.booking_date === targetDate) return;

    // Optimistic
    setAvailData(prev => prev.map(b => b.id === id ? { ...b, booking_date: targetDate } : b));
    setBookings(prev => prev.map(b => b.id === id ? { ...b, booking_date: targetDate } : b));

    const { error } = await supabase
      .from('bookings').update({ booking_date: targetDate }).eq('id', id);
    if (error) {
      // Roll back on failure
      setAvailData(prev => prev.map(b => b.id === id ? { ...b, booking_date: moving.booking_date } : b));
      setBookings(prev => prev.map(b => b.id === id ? { ...b, booking_date: moving.booking_date } : b));
      console.error('[Admin] Failed to move appointment:', error);
      window.alert('Could not move the appointment. Please try again.');
    } else {
      refreshFromDb();
    }
  };

  // Find appointments that overlap with the booking being edited.
  // Returns an array of booking rows from `bookings` (NOT the edit itself).
  // Cancelled and blocked rows are ignored. Same booking_date required.
  const findBookingConflicts = (edit) => {
    if (!edit || !edit.start_time || !edit.end_time || !edit.booking_date) return [];
    return bookings.filter(b =>
      b.id !== edit.id &&
      b.booking_date === edit.booking_date &&
      b.status !== 'cancelled' &&
      b.status !== 'blocked' &&
      b.start_time && b.end_time &&
      b.start_time < edit.end_time &&
      b.end_time > edit.start_time
    );
  };

  const openBookingDetails = (b) => {
    setBookingDetails(b);
    setBookingEdit(null);
  };
  const closeBookingDetails = () => {
    setBookingDetails(null);
    setBookingEdit(null);
    setBookingEditError('');
  };
  const startEditBooking = () => {
    if (!bookingDetails) return;
    setBookingEdit({ ...bookingDetails });
    setBookingEditError('');
  };
  const saveBookingEdit = async () => {
    if (!bookingEdit) return;
    setBookingEditError('');
    if (!bookingEdit.start_time || !bookingEdit.end_time) {
      setBookingEditError('Please enter both a start and end time.');
      return;
    }
    if (bookingEdit.end_time <= bookingEdit.start_time) {
      setBookingEditError('End time must be after start time.');
      return;
    }
    if (bookingEdit.start_time < '08:00' || bookingEdit.end_time > '18:00') {
      setBookingEditError('Appointments must be within 8 AM – 6 PM.');
      return;
    }
    setBookingEditSaving(true);
    const payload = {
      name:         bookingEdit.name?.trim() || '',
      phone:        bookingEdit.phone?.trim() || '',
      vehicle:      bookingEdit.vehicle?.trim() || '',
      service_type: bookingEdit.service_type || null,
      booking_date: bookingEdit.booking_date,
      start_time:   bookingEdit.start_time,
      end_time:     bookingEdit.end_time,
      time_slot:    admDeriveSlot(bookingEdit.start_time),
      status:       bookingEdit.status,
      notes:        bookingEdit.notes?.trim() || '',
    };
    const { data, error } = await supabase
      .from('bookings').update(payload).eq('id', bookingEdit.id)
      .select('*').single();
    if (error) {
      setBookingEditError('Could not save changes. Please try again.');
      setBookingEditSaving(false);
      return;
    }
    if (data) {
      setBookings(prev => prev.map(b => b.id === data.id ? { ...b, ...data } : b));
      setAvailData(prev => prev.map(b => b.id === data.id ? { ...b, ...data } : b));
    }
    setBookingEditSaving(false);
    setBookingDetails(null);
    setBookingEdit(null);
    refreshFromDb();
  };
  const cancelBookingFromModal = async () => {
    const b = bookingEdit || bookingDetails;
    if (!b) return;
    // Two clicks (open modal → red "Cancel Appointment" button) already
    // constitute intent — no extra browser confirm() needed.
    setBookingEditSaving(true);
    const { error } = await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', b.id);
    if (!error) {
      setBookings(prev => prev.map(x => x.id === b.id ? { ...x, status: 'cancelled' } : x));
      setAvailData(prev => prev.filter(x => x.id !== b.id));
      refreshFromDb();
    }
    setBookingEditSaving(false);
    setBookingDetails(null);
    setBookingEdit(null);
  };

  const openReviewEdit = (review) => {
    setReviewEdit({ ...review });
    setReviewEditError('');
  };
  const closeReviewEdit = () => {
    if (reviewEditSaving) return;
    setReviewEdit(null);
    setReviewEditError('');
  };
  const saveReviewEdit = async () => {
    if (!reviewEdit) return;
    setReviewEditError('');
    if (!reviewEdit.customer_name?.trim()) {
      setReviewEditError('Name is required.');
      return;
    }
    if (!reviewEdit.comment?.trim() || reviewEdit.comment.trim().length < 5) {
      setReviewEditError('Comment must be at least 5 characters.');
      return;
    }
    setReviewEditSaving(true);
    const payload = {
      customer_name: reviewEdit.customer_name.trim(),
      rating:        reviewEdit.rating,
      comment:       reviewEdit.comment.trim(),
      vehicle:       reviewEdit.vehicle?.trim() || null,
      service_type:  reviewEdit.service_type || null,
      source:        reviewEdit.source || 'website',
    };
    const { data, error } = await supabase
      .from('reviews')
      .update(payload)
      .eq('id', reviewEdit.id)
      .select('*')
      .single();
    if (error) {
      console.error('[Admin] Review update failed:', error);
      setReviewEditError('Could not save changes. Please try again.');
      setReviewEditSaving(false);
      return;
    }
    if (data) {
      setReviews(prev => prev.map(r => r.id === data.id ? { ...r, ...data } : r));
    }
    setReviewEditSaving(false);
    setReviewEdit(null);
  };

  const effective = getEffective(stored);

  // Check if local admin server is reachable
  React.useEffect(() => {
    fetch('http://localhost:3001/api/status')
      .then(r => r.ok && setServerOnline(true))
      .catch(() => setServerOnline(false));
  }, []);

  // Load bookings from Supabase
  useEffect(() => {
    async function loadBookings() {
      setBookingsLoading(true);
      let query = supabase
        .from('bookings')
        .select('*')
        .order('booking_date', { ascending: true })
        .order('time_slot',    { ascending: true });
      if (bookingsFilter === 'upcoming') {
        const today = new Date().toISOString().slice(0, 10);
        query = query.gte('booking_date', today);
      }
      query = query.neq('status', 'blocked').neq('service_type', 'blocked');
      const { data, error } = await query;
      if (!error) setBookings(data ?? []);
      setBookingsLoading(false);
    }
    loadBookings();
  }, [bookingsFilter, refreshTick]);

  const updateBookingStatus = async (id, status) => {
    setStatusUpdating(id);
    const { error } = await supabase.from('bookings').update({ status }).eq('id', id);
    if (!error) {
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
      refreshFromDb(); // re-fetch availData so the calendar card status updates too
    }
    setStatusUpdating(null);
  };

  // Hard-delete a cancelled booking from the DB so it no longer
  // appears in the table at all. Only offered for status='cancelled'
  // rows — never for pending/confirmed/completed (those keep an audit trail).
  // No confirm() — admin already had to cancel the appointment first.
  const deleteBookingPermanently = async (id) => {
    setStatusUpdating(id);
    const { error } = await supabase.from('bookings').delete().eq('id', id);
    if (!error) {
      setBookings(prev => prev.filter(b => b.id !== id));
      refreshFromDb();
    }
    setStatusUpdating(null);
  };

  // Load availability data for the displayed week
  useEffect(() => {
    async function loadAvail() {
      setAvailLoading(true);
      const startStr = admDateStr(availWeekStart);
      const endDate  = new Date(availWeekStart); endDate.setDate(endDate.getDate() + 5);
      const endStr   = admDateStr(endDate);
      const { data } = await supabase
        .from('bookings')
        .select('id, booking_date, time_slot, start_time, end_time, status, name, phone, vehicle, service_type, notes')
        .gte('booking_date', startStr)
        .lte('booking_date', endStr)
        .neq('status', 'cancelled');
      setAvailData(data ?? []);
      setAvailLoading(false);
    }
    loadAvail();
  }, [availWeekStart, refreshTick]);

  // Click slot in calendar:
  //   • free slot       → open Entry modal pre-filled with that date+slot
  //   • blocked slot    → unblock immediately (one click)
  //   • booked slot     → no-op (handled by caller)
  const toggleSlot = async (dateStr, slotId) => {
    const existing = availData.find(b => b.booking_date === dateStr && b.time_slot === slotId);
    if (existing?.status === 'blocked') {
      const key = `${dateStr}|${slotId}`;
      setSlotToggling(key);
      const { error } = await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', existing.id);
      if (!error) {
        setAvailData(prev => prev.filter(b => b.id !== existing.id));
        refreshFromDb();
      }
      setSlotToggling(null);
    } else if (!existing) {
      // Free slot → open the Entry modal pre-filled with this slot
      openEntryModal('block', dateStr, slotId);
    }
  };

  // Block all free slots on a given day at once
  const blockDay = async (dateStr) => {
    setDayBlocking(dateStr);
    const slotsToBlock = ADM_TIME_SLOTS.filter(
      slot => !availData.find(b => b.booking_date === dateStr && b.time_slot === slot.id)
    );
    if (slotsToBlock.length > 0) {
      const inserts = slotsToBlock.map(slot => {
        const [sStart, sEnd] = slot.id.split('-');
        return {
          name: '_BLOCKED_', phone: '', vehicle: '',
          service_type: 'blocked', booking_date: dateStr,
          time_slot: slot.id, start_time: sStart, end_time: sEnd,
          status: 'blocked',
        };
      });
      const { data, error } = await supabase
        .from('bookings').insert(inserts)
        .select('id, booking_date, time_slot, start_time, end_time, status, name, vehicle, service_type');
      if (!error && data) {
        setAvailData(prev => [...prev, ...data]);
        refreshFromDb();
      }
    }
    setDayBlocking(null);
  };

  // ── Add Entry modal handlers ──────────────────────────────
  // mode      : 'block' | 'appointment'
  // dateStr   : pre-fill date (YYYY-MM-DD), defaults to today
  // slotId    : pre-select a single slot — sets range to slot-N and time_slot
  const openEntryModal = (mode = 'block', dateStr = null, slotId = null) => {
    let initialRange = 'full';
    let initialStart = '09:00';
    let initialEnd   = '10:00';
    if (slotId) {
      const idx = ADM_TIME_SLOTS.findIndex(s => s.id === slotId);
      if (idx >= 0) initialRange = `slot-${idx}`;
      const [bStart, bEnd] = slotId.split('-');
      initialStart = bStart;
      // Default to a 1-hour appointment starting at the slot's start
      const [sh, sm] = bStart.split(':').map(n => parseInt(n, 10));
      const endH     = sh + 1;
      initialEnd     = `${String(endH).padStart(2, '0')}:${String(sm).padStart(2, '0')}`;
    }
    setEntryMode(mode);
    setEntryForm({
      ...EMPTY_ENTRY,
      date:       dateStr || todayStr(),
      range:      initialRange,
      start_time: initialStart,
      end_time:   initialEnd,
    });
    setEntryError('');
    setEntryModal(true);
  };

  const closeEntryModal = () => {
    if (entrySaving) return;
    setEntryModal(false);
    setEntryError('');
  };

  const handleEntrySave = async () => {
    setEntryError('');
    if (!entryForm.date) { setEntryError('Please select a date.'); return; }
    setEntrySaving(true);

    if (entryMode === 'block') {
      // Determine which slot IDs to block (block mode still uses the 4
      // customer-facing 2.5h windows; this is intentional — blocking is
      // typically full slots, not arbitrary times).
      const slotIds    = RANGE_TO_SLOTS[entryForm.range] ?? [];
      const freeSlotIds = slotIds.filter(
        sid => !availData.find(b => b.booking_date === entryForm.date && b.time_slot === sid && b.status === 'blocked')
      );
      if (freeSlotIds.length === 0) {
        setEntryError('All selected slots are already blocked.');
        setEntrySaving(false);
        return;
      }
      const reason  = entryForm.reason.trim();
      const inserts = freeSlotIds.map(sid => {
        const [sStart, sEnd] = sid.split('-');
        return {
          name:         reason ? `_BLOCKED_: ${reason}` : '_BLOCKED_',
          phone:        '',
          vehicle:      '',
          service_type: 'blocked',
          booking_date: entryForm.date,
          time_slot:    sid,
          start_time:   sStart,
          end_time:     sEnd,
          status:       'blocked',
        };
      });
      const { data, error } = await supabase
        .from('bookings').insert(inserts)
        .select('id, booking_date, time_slot, start_time, end_time, status, name');
      if (error) { setEntryError('Could not save. Please try again.'); setEntrySaving(false); return; }
      // Refresh availability grid if the date falls in the displayed week
      if (data) {
        const ws = admDateStr(availWeekStart);
        const we = admDateStr(new Date(availWeekStart.getTime() + 5 * 86400000));
        const inWeek = data.filter(d => d.booking_date >= ws && d.booking_date <= we);
        if (inWeek.length) setAvailData(prev => [...prev, ...inWeek]);
      }

    } else {
      // Real Appointment — minute-precise times via two pickers.
      // Validation
      if (!entryForm.start_time || !entryForm.end_time) {
        setEntryError('Please enter both a start and end time.');
        setEntrySaving(false);
        return;
      }
      if (entryForm.end_time <= entryForm.start_time) {
        setEntryError('End time must be after start time.');
        setEntrySaving(false);
        return;
      }
      if (entryForm.start_time < '08:00' || entryForm.end_time > '18:00') {
        setEntryError('Appointments must be within working hours (8 AM – 6 PM).');
        setEntrySaving(false);
        return;
      }

      const derivedSlot = admDeriveSlot(entryForm.start_time);
      const { data, error } = await supabase
        .from('bookings')
        .insert({
          name:         entryForm.name.trim(),
          phone:        entryForm.phone.trim(),
          vehicle:      entryForm.vehicle.trim(),
          service_type: entryForm.service_type,
          booking_date: entryForm.date,
          time_slot:    derivedSlot,
          start_time:   entryForm.start_time,
          end_time:     entryForm.end_time,
          status:       entryForm.appointmentStatus,
          notes:        entryForm.notes.trim(),
        })
        .select('*')
        .single();
      if (error) { setEntryError('Could not save. Please try again.'); setEntrySaving(false); return; }
      if (data) {
        // Add to appointments table if it matches the current filter
        if (bookingsFilter === 'all' || data.booking_date >= todayStr()) {
          setBookings(prev =>
            [...prev, data].sort((a, b) => {
              const d = a.booking_date.localeCompare(b.booking_date);
              return d !== 0 ? d : a.time_slot.localeCompare(b.time_slot);
            })
          );
        }
        // Refresh availability grid if in displayed week
        const ws = admDateStr(availWeekStart);
        const we = admDateStr(new Date(availWeekStart.getTime() + 5 * 86400000));
        if (data.booking_date >= ws && data.booking_date <= we) {
          setAvailData(prev => [
            ...prev,
            { id: data.id, booking_date: data.booking_date, time_slot: data.time_slot,
              start_time: data.start_time, end_time: data.end_time,
              status: data.status, name: data.name, phone: data.phone,
              vehicle: data.vehicle, service_type: data.service_type,
              notes: data.notes },
          ]);
        }
      }
    }

    setEntrySaving(false);
    setEntryModal(false);
    refreshFromDb();
  };

  // Load reviews
  useEffect(() => {
    async function loadReviews() {
      setReviewsLoading(true);
      let query = supabase.from('reviews').select('*').order('created_at', { ascending: false });
      if (reviewsFilter !== 'all') query = query.eq('status', reviewsFilter);
      const { data } = await query;
      setReviews(data ?? []);
      setReviewsLoading(false);
    }
    loadReviews();
  }, [reviewsFilter]);

  const updateReviewStatus = async (id, status) => {
    setReviewUpdating(id);
    const { error } = await supabase.from('reviews').update({ status }).eq('id', id);
    if (!error) {
      if (reviewsFilter !== 'all' && reviewsFilter !== status) {
        setReviews(prev => prev.filter(r => r.id !== id));
      } else {
        setReviews(prev => prev.map(r => r.id === id ? { ...r, status } : r));
      }
    }
    setReviewUpdating(null);
  };

  const deleteReview = async (id) => {
    if (!window.confirm('Delete this review permanently? This cannot be undone.')) return;
    setReviewUpdating(id);
    const { error } = await supabase.from('reviews').delete().eq('id', id);
    if (!error) setReviews(prev => prev.filter(r => r.id !== id));
    setReviewUpdating(null);
  };

  // Week navigation for availability
  const canGoPrevAvailWeek = availWeekStart > admThisMonday();
  const prevAvailWeek = () => {
    const w = new Date(availWeekStart); w.setDate(w.getDate() - 7); setAvailWeekStart(w);
  };
  const nextAvailWeek = () => {
    const w = new Date(availWeekStart); w.setDate(w.getDate() + 7); setAvailWeekStart(w);
  };

  const handleDeploy = async () => {
    setDeployStatus('deploying');
    try {
      const res  = await fetch('http://localhost:3001/api/deploy', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ features: effective }),
      });
      const data = await res.json();
      if (data.success) {
        setDeployStatus(data.noChange ? 'no-change' : 'success');
      } else {
        setDeployStatus({ error: data.message || 'Unknown error.' });
      }
    } catch {
      setDeployStatus({ error: 'Admin server unreachable. Please start it via the desktop shortcut.' });
    }
    setTimeout(() => setDeployStatus(null), 10000);
  };

  const toggle = (key) => {
    setStored(prev => ({ ...prev, [key]: !effective[key] }));
    setSaved(false);
  };

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleReset = () => {
    localStorage.removeItem(STORAGE_KEY);
    setStored({});
    setSaved(false);
  };

  const codeSnippet = `const DEFAULTS = {\n${FEATURE_DEFS.map(
    f => `  ${f.key}: ${effective[f.key]},`
  ).join('\n')}\n};`;

  const handleCopy = () => {
    navigator.clipboard?.writeText(codeSnippet).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const hasOverrides = Object.keys(stored).length > 0;

  // ── Main panel ───────────────────────────────────────────
  return (
    <div className="admin-root">
      <header className="admin-header">
        <div className="admin-header-inner">
          <div>
            <a href="/" className="admin-back">← Back to site</a>
            <h1 className="admin-title">
              MOBILE <span>AUTO REPAIR</span>
              <span className="admin-title-badge">Admin</span>
            </h1>
          </div>
          <button className="adm-btn adm-btn-ghost" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </header>

      <main className="admin-main">

        {/* ── APPOINTMENTS SECTION ──────────────────────── */}
        <section className="admin-section">
          <div className="admin-bookings-header">
            <div>
              <h2 className="admin-section-title">Appointments</h2>
              <p className="admin-section-sub" style={{ marginBottom: 0 }}>
                Manage and confirm incoming appointment requests.
              </p>
            </div>
            <div className="admin-bookings-filter">
              <button
                className={`adm-btn adm-btn-small${bookingsFilter === 'upcoming' ? ' adm-btn-primary' : ' adm-btn-ghost'}`}
                onClick={() => setBookingsFilter('upcoming')}
              >
                Upcoming
              </button>
              <button
                className={`adm-btn adm-btn-small${bookingsFilter === 'all' ? ' adm-btn-primary' : ' adm-btn-ghost'}`}
                onClick={() => setBookingsFilter('all')}
              >
                All
              </button>
              <button
                className="adm-btn adm-btn-small adm-btn-add-entry"
                onClick={() => openEntryModal('appointment')}
              >
                + Add Entry
              </button>
            </div>
          </div>

          {bookingsLoading ? (
            <div className="admin-bookings-empty">Loading bookings…</div>
          ) : bookings.length === 0 ? (
            <div className="admin-bookings-empty">
              {bookingsFilter === 'upcoming' ? 'No upcoming appointments.' : 'No bookings found.'}
            </div>
          ) : (
            <div className="admin-bookings-table-wrap">
              <table className="admin-bookings-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Service</th>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Vehicle</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map(b => (
                    <tr key={b.id} className={`admin-booking-row status-${b.status}`}>
                      <td className="abt-date">{formatDate(b.booking_date)}</td>
                      <td className="abt-time">
                        {b.start_time && b.end_time
                          ? `${to12h(b.start_time)} – ${to12h(b.end_time)}`
                          : formatSlot(b.time_slot)}
                      </td>
                      <td>{SERVICE_LABELS[b.service_type] ?? b.service_type}</td>
                      <td>{b.name || <span className="abt-empty">—</span>}</td>
                      <td>
                        {b.phone
                          ? <a href={`tel:${b.phone}`} className="abt-phone">{b.phone}</a>
                          : <span className="abt-empty">—</span>}
                      </td>
                      <td className="abt-vehicle">{b.vehicle || <span className="abt-empty">—</span>}</td>
                      <td>
                        <span className={`abt-badge abt-badge-${STATUS_LABELS[b.status]?.color ?? 'grey'}`}>
                          {STATUS_LABELS[b.status]?.label ?? b.status}
                        </span>
                      </td>
                      <td>
                        <div className="abt-actions">
                          {b.status === 'pending' && (
                            <>
                              <button className="abt-action-btn confirm" disabled={statusUpdating === b.id} onClick={() => updateBookingStatus(b.id, 'confirmed')}>Confirm</button>
                              <button className="abt-action-btn cancel"  disabled={statusUpdating === b.id} onClick={() => updateBookingStatus(b.id, 'cancelled')}>Cancel</button>
                            </>
                          )}
                          {b.status === 'confirmed' && (
                            <>
                              <button className="abt-action-btn complete" disabled={statusUpdating === b.id} onClick={() => updateBookingStatus(b.id, 'completed')}>Complete</button>
                              <button className="abt-action-btn cancel"   disabled={statusUpdating === b.id} onClick={() => updateBookingStatus(b.id, 'cancelled')}>Cancel</button>
                            </>
                          )}
                          {b.status === 'cancelled' && (
                            <button
                              className="abt-action-btn cancel"
                              disabled={statusUpdating === b.id}
                              onClick={() => deleteBookingPermanently(b.id)}
                              title="Permanently delete this cancelled booking from the database"
                            >
                              Delete
                            </button>
                          )}
                          {/* Edit is available for every status — opens the full
                              Details/Edit modal where time, name, status, etc.
                              can all be changed (e.g. cancelled → confirmed). */}
                          <button
                            className="abt-action-btn edit"
                            onClick={() => openBookingDetails(b)}
                            title="View details · edit · change status"
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ── MANAGE AVAILABILITY SECTION ───────────────── */}
        <section className="admin-section">
          <div className="admin-bookings-header">
            <div>
              <h2 className="admin-section-title">Manage Availability</h2>
              <p className="admin-section-sub" style={{ marginBottom: 0 }}>
                <span className="adm-legend-item blocked">Blocked</span> — click to unblock &nbsp;·&nbsp;
                <span className="adm-legend-item booked">Booked</span> — click for details &nbsp;·&nbsp;
                Empty space = free
              </p>
            </div>
            <div className="admin-bookings-filter" style={{ alignItems: 'center', gap: '0.5rem' }}>
              <button
                className="adm-btn adm-btn-small adm-btn-ghost"
                onClick={prevAvailWeek}
                disabled={!canGoPrevAvailWeek}
              >←</button>
              <span className="adm-avail-week-label">
                {(() => {
                  const dates = admWeekDates(availWeekStart);
                  return `${dates[0].getDate()} ${ADM_MONTH_SHORT[dates[0].getMonth()]} – ${dates[5].getDate()} ${ADM_MONTH_SHORT[dates[5].getMonth()]} ${dates[5].getFullYear()}`;
                })()}
              </span>
              <button className="adm-btn adm-btn-small adm-btn-ghost" onClick={nextAvailWeek}>→</button>
              <button className="adm-btn adm-btn-small adm-btn-add-entry" onClick={() => openEntryModal('block')}>
                + Block Time
              </button>
            </div>
          </div>

          {availLoading ? (
            <div className="admin-bookings-empty">Loading…</div>
          ) : (
            <div className="adm-avail-grid">
              {admWeekDates(availWeekStart).map((date, i) => {
                const dateStr    = admDateStr(date);
                const isPastDay  = date < new Date(new Date().setHours(0, 0, 0, 0));
                const isBlocking = dayBlocking === dateStr;

                return (
                  <div
                    key={dateStr}
                    className={`adm-avail-col${isPastDay ? ' past' : ''}${dragOverDate === dateStr ? ' drag-over' : ''}`}
                    onDragOver={e => {
                      if (!dragId || isPastDay) return;
                      e.preventDefault();
                      if (dragOverDate !== dateStr) setDragOverDate(dateStr);
                    }}
                    onDragLeave={e => {
                      // Only clear when we truly leave the column, not its child elements
                      if (e.currentTarget.contains(e.relatedTarget)) return;
                      if (dragOverDate === dateStr) setDragOverDate(null);
                    }}
                    onDrop={e => {
                      if (!dragId || isPastDay) return;
                      e.preventDefault();
                      handleApptDrop(dateStr);
                    }}
                  >
                    <div className="adm-avail-col-hdr">
                      <span className="adm-avail-col-day">{ADM_DAY_NAMES[i]}</span>
                      <span className="adm-avail-col-date">
                        {date.getDate()} {ADM_MONTH_SHORT[date.getMonth()]}
                      </span>
                      {!isPastDay && (
                        <button
                          className="adm-block-day-btn"
                          onClick={() => blockDay(dateStr)}
                          disabled={isBlocking}
                          title="Block all free slots on this day"
                        >
                          {isBlocking ? '…' : 'Block Day'}
                        </button>
                      )}
                    </div>

                    {(() => {
                      // Gather everything for this date that's not cancelled.
                      const dayItems = availData.filter(b =>
                        b.booking_date === dateStr && b.status !== 'cancelled'
                      );
                      const blockedSlots = ADM_TIME_SLOTS.filter(slot => {
                        const [sStart, sEnd] = slot.id.split('-');
                        return dayItems.some(b =>
                          b.status === 'blocked' &&
                          b.start_time && b.end_time &&
                          b.start_time < sEnd && b.end_time > sStart
                        );
                      });
                      const appts = dayItems
                        .filter(b => b.status !== 'blocked' && b.start_time && b.end_time)
                        .sort((a, b) => a.start_time.localeCompare(b.start_time));

                      const isEmpty = blockedSlots.length === 0 && appts.length === 0;

                      return (
                        <>
                          {/* Blocked slots — red, click to unblock */}
                          {blockedSlots.map(slot => {
                            const toggleKey  = `${dateStr}|${slot.id}`;
                            const isToggling = slotToggling === toggleKey;
                            const blockedRow = dayItems.find(b =>
                              b.status === 'blocked' && b.time_slot === slot.id
                            );
                            const blockReason = blockedRow?.name?.startsWith('_BLOCKED_: ')
                              ? blockedRow.name.slice('_BLOCKED_: '.length)
                              : null;
                            return (
                              <button
                                key={slot.id}
                                className={`adm-slot blocked${isPastDay ? ' past' : ''}`}
                                onClick={() => !isPastDay && !isToggling && toggleSlot(dateStr, slot.id)}
                                disabled={isPastDay || isToggling}
                                title={blockReason ? `Blocked: ${blockReason} — click to unblock` : 'Blocked — click to unblock'}
                              >
                                <span className="adm-slot-time">{slot.label}</span>
                                <span className="adm-slot-sub">
                                  {isToggling ? '…' : (blockReason ? `✕ ${blockReason}` : 'Blocked ✕')}
                                </span>
                              </button>
                            );
                          })}

                          {/* Appointment cards — sorted by start time, drag-to-reschedule */}
                          {appts.map(b => (
                            <button
                              key={b.id}
                              type="button"
                              className={`adm-appt-card s-${b.status}${dragId === b.id ? ' is-dragging' : ''}`}
                              onClick={() => dragId == null && openBookingDetails(b)}
                              draggable={!isPastDay}
                              onDragStart={e => {
                                setDragId(b.id);
                                e.dataTransfer.effectAllowed = 'move';
                                // Some browsers require setData to begin a drag
                                e.dataTransfer.setData('text/plain', b.id);
                              }}
                              onDragEnd={() => { setDragId(null); setDragOverDate(null); }}
                              title="Click for details · Drag to another day to reschedule"
                            >
                              <span className="adm-appt-time">
                                {to12h(b.start_time)} – {to12h(b.end_time)}
                              </span>
                              <span className="adm-appt-name">{b.name || '—'}</span>
                            </button>
                          ))}

                          {/* Empty hint so completely free days don't look broken */}
                          {isEmpty && !isPastDay && (
                            <span className="adm-day-empty">No entries</span>
                          )}

                          {/* Always-visible "Add Appointment" CTA at the bottom of every (future) day */}
                          {!isPastDay && (
                            <button
                              type="button"
                              className="adm-day-add"
                              onClick={() => openEntryModal('appointment', dateStr)}
                              title={`Add appointment on ${ADM_DAY_NAMES[i]} ${date.getDate()}`}
                            >
                              + Add
                            </button>
                          )}
                        </>
                      );
                    })()}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── CUSTOMER REVIEWS SECTION ──────────────────── */}
        <section className="admin-section">
          <div className="admin-bookings-header">
            <div>
              <h2 className="admin-section-title">Customer Reviews</h2>
              <p className="admin-section-sub" style={{ marginBottom: 0 }}>
                Moderate customer reviews. Only <strong>approved</strong> reviews appear on the homepage.
              </p>
            </div>
            <div className="admin-bookings-filter">
              {[
                { id: 'pending',  label: 'Pending'  },
                { id: 'approved', label: 'Approved' },
                { id: 'all',      label: 'All'      },
              ].map(f => (
                <button
                  key={f.id}
                  className={`adm-btn adm-btn-small${reviewsFilter === f.id ? ' adm-btn-primary' : ' adm-btn-ghost'}`}
                  onClick={() => setReviewsFilter(f.id)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {reviewsLoading ? (
            <div className="admin-bookings-empty">Loading reviews…</div>
          ) : reviews.length === 0 ? (
            <div className="admin-bookings-empty">
              {reviewsFilter === 'pending'  && 'No pending reviews.'}
              {reviewsFilter === 'approved' && 'No approved reviews yet.'}
              {reviewsFilter === 'all'      && 'No reviews submitted yet.'}
            </div>
          ) : (
            <div className="admin-reviews-list">
              {reviews.map(r => (
                <article key={r.id} className={`adm-review-card status-${r.status}`}>
                  <header className="adm-review-head">
                    <div className="adm-review-rating" aria-label={`${r.rating} out of 5`}>
                      {'★'.repeat(r.rating)}<span className="dim">{'★'.repeat(5 - r.rating)}</span>
                    </div>
                    <span className={`abt-badge abt-badge-${
                      r.status === 'approved' ? 'green' :
                      r.status === 'pending'  ? 'orange' : 'grey'
                    }`}>
                      {r.status}
                    </span>
                  </header>
                  <p className="adm-review-comment">{r.comment}</p>

                  {r.photo_urls?.length > 0 && (
                    <div className="adm-review-photos">
                      {r.photo_urls.map((url, i) => (
                        <a
                          key={i}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="adm-review-photo"
                          title="Open full size in new tab"
                        >
                          <img src={url} alt={`Photo ${i + 1}`} loading="lazy" />
                        </a>
                      ))}
                    </div>
                  )}

                  <div className="adm-review-meta">
                    <strong>{r.customer_name}</strong>
                    {r.source === 'google' && <span className="adm-source-badge"> · from Google</span>}
                    {r.vehicle && <span> · {r.vehicle}</span>}
                    {r.service_type && SERVICE_LABELS[r.service_type] && (
                      <span> · {SERVICE_LABELS[r.service_type]}</span>
                    )}
                    <span className="adm-review-date">
                      {new Date(r.created_at).toLocaleDateString('en-CA')}
                    </span>
                  </div>
                  <div className="adm-review-actions">
                    {r.status !== 'approved' && (
                      <button className="abt-action-btn confirm" disabled={reviewUpdating === r.id} onClick={() => updateReviewStatus(r.id, 'approved')}>Approve</button>
                    )}
                    {r.status !== 'hidden' && (
                      <button className="abt-action-btn cancel" disabled={reviewUpdating === r.id} onClick={() => updateReviewStatus(r.id, 'hidden')}>Hide</button>
                    )}
                    {r.status === 'hidden' && (
                      <button className="abt-action-btn complete" disabled={reviewUpdating === r.id} onClick={() => updateReviewStatus(r.id, 'pending')}>Mark Pending</button>
                    )}
                    <button className="abt-action-btn edit" onClick={() => openReviewEdit(r)}>Edit</button>
                    <button className="abt-action-btn cancel adm-review-delete" disabled={reviewUpdating === r.id} onClick={() => deleteReview(r.id)}>Delete</button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* ── STATUS BAR ────────────────────────────────── */}
        <div className={`admin-status-bar${hasOverrides ? ' has-overrides' : ''}`}>
          {hasOverrides ? (
            <>
              <span className="admin-status-dot active" />
              Browser overrides active — these settings only affect <strong>your browser</strong>.
              To apply globally for all visitors, use the Deploy section below.
            </>
          ) : (
            <>
              <span className="admin-status-dot" />
              Using compiled defaults (features.js). No browser overrides active.
            </>
          )}
        </div>

        {/* ── FEATURE TOGGLES ───────────────────────────── */}
        <section className="admin-section">
          <h2 className="admin-section-title">Feature Toggles</h2>
          <p className="admin-section-sub">
            Changes are instant in your browser. Click <strong>Save to browser</strong> to persist across page reloads.
          </p>
          <div className="admin-toggle-list">
            {FEATURE_DEFS.map(f => (
              <div className="admin-toggle-row" key={f.key}>
                <div className="admin-toggle-info">
                  <span className="admin-toggle-tag">{f.tag}</span>
                  <h3 className="admin-toggle-label">{f.label}</h3>
                  <p className="admin-toggle-desc">{f.description}</p>
                  <code className="admin-toggle-key">{f.key}</code>
                </div>
                <div className="admin-toggle-control">
                  <button
                    className={`adm-toggle${effective[f.key] ? ' on' : ' off'}`}
                    onClick={() => toggle(f.key)}
                    aria-label={`Toggle ${f.label}`}
                  >
                    <span className="adm-toggle-thumb" />
                  </button>
                  <span className={`adm-toggle-state${effective[f.key] ? ' on' : ' off'}`}>
                    {effective[f.key] ? 'ON' : 'OFF'}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="admin-toggle-actions">
            <button className="adm-btn adm-btn-primary" onClick={handleSave}>
              {saved ? '✓ Saved to browser' : 'Save to browser'}
            </button>
            {hasOverrides && (
              <button className="adm-btn adm-btn-ghost" onClick={handleReset}>
                Reset to defaults
              </button>
            )}
          </div>
        </section>

        {/* ── DEPLOY SECTION ────────────────────────────── */}
        <section className="admin-section">
          <h2 className="admin-section-title">Deploy to Production</h2>
          <p className="admin-section-sub">
            One click writes <code>features.js</code>, commits and pushes to GitHub.
            Vercel deploys automatically — all visitors see the change in ~60 seconds.
          </p>
          <div className={`admin-server-status${serverOnline === false ? ' offline' : serverOnline ? ' online' : ''}`}>
            <span className="admin-server-dot" />
            {serverOnline === true  && 'Admin server running — ready to deploy.'}
            {serverOnline === false && 'Admin server offline. Start it via the desktop shortcut.'}
            {serverOnline === null  && 'Checking connection…'}
          </div>
          <div className="admin-deploy-cta">
            <button
              className={`adm-btn adm-btn-deploy${deployStatus === 'deploying' ? ' is-deploying' : ''}`}
              onClick={handleDeploy}
              disabled={deployStatus === 'deploying' || serverOnline === false}
            >
              {deployStatus === 'deploying' ? '⏳  Deploying…' : '🚀  Deploy Now'}
            </button>
            {deployStatus === 'success' && (
              <div className="admin-deploy-status is-success">
                ✓ Deployed! Vercel is rebuilding — live for all visitors in ~60 seconds.
              </div>
            )}
            {deployStatus === 'no-change' && (
              <div className="admin-deploy-status is-no-change">
                ✓ Already up to date — no changes to deploy.
              </div>
            )}
            {deployStatus && typeof deployStatus === 'object' && deployStatus.error && (
              <div className="admin-deploy-status is-error">✗ {deployStatus.error}</div>
            )}
          </div>
          <details className="admin-manual-fallback">
            <summary>Deploy Manually (Fallback)</summary>
            <div className="admin-manual-fallback-body">
              <p>If the automatic deploy doesn&apos;t work: copy the code, paste it into <code>src/config/features.js</code> and push.</p>
              <div className="admin-code-block">
                <div className="admin-code-header">
                  <span>src/config/features.js — DEFAULTS block</span>
                  <button className="adm-btn adm-btn-small" onClick={handleCopy}>
                    {copied ? '✓ Copied!' : 'Copy'}
                  </button>
                </div>
                <pre className="admin-code"><code>{codeSnippet}</code></pre>
              </div>
            </div>
          </details>
        </section>

        {/* ── QUICK PREVIEW ─────────────────────────────── */}
        <section className="admin-section admin-section-last">
          <h2 className="admin-section-title">Preview</h2>
          <p className="admin-section-sub">Visit the site to see your browser overrides live.</p>
          <a href="/" className="adm-btn adm-btn-primary" target="_blank" rel="noreferrer">
            Open site in new tab →
          </a>
        </section>

      </main>

      {/* ══════════════════════════════════════════════
          ADD ENTRY MODAL
          ══════════════════════════════════════════════ */}
      {entryModal && (
        <div className="adm-modal-overlay" onClick={closeEntryModal}>
          <div className="adm-modal" onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="adm-modal-header">
              <h3 className="adm-modal-title">Add Entry</h3>
              <button className="adm-modal-close" onClick={closeEntryModal} aria-label="Close">✕</button>
            </div>

            {/* Mode tabs */}
            <div className="adm-modal-tabs">
              <button
                className={`adm-modal-tab${entryMode === 'block' ? ' active' : ''}`}
                onClick={() => { setEntryMode('block'); setEntryError(''); }}
              >
                Block Time
              </button>
              <button
                className={`adm-modal-tab${entryMode === 'appointment' ? ' active' : ''}`}
                onClick={() => { setEntryMode('appointment'); setEntryError(''); }}
              >
                Customer Appointment
              </button>
            </div>

            {/* Body */}
            <div className="adm-modal-body">
              {entryMode === 'block' ? (

                /* ── Block Time form ── */
                <div className="adm-modal-form">
                  <p className="adm-modal-mode-desc">
                    Block one or more time slots so customers can&apos;t book them.
                    Useful for holidays, personal time, or fleet jobs.
                  </p>

                  <div className="adm-form-row">
                    <label className="adm-form-label">Date</label>
                    <input
                      type="date"
                      className="adm-form-input"
                      value={entryForm.date}
                      min={todayStr()}
                      autoFocus
                      onClick={e => e.target.showPicker?.()}
                      onChange={e => setEntryForm(f => ({ ...f, date: e.target.value }))}
                    />
                  </div>

                  <div className="adm-form-row">
                    <label className="adm-form-label">Time Range</label>
                    <select
                      className="adm-form-input"
                      value={entryForm.range}
                      onChange={e => setEntryForm(f => ({ ...f, range: e.target.value }))}
                    >
                      <option value="slot-0">8 – 10:30 AM (Slot 1 only)</option>
                      <option value="slot-1">10:30 AM – 1 PM (Slot 2 only)</option>
                      <option value="slot-2">1 – 3:30 PM (Slot 3 only)</option>
                      <option value="slot-3">3:30 – 6 PM (Slot 4 only)</option>
                      <option value="morning">Morning — 8 AM – 1 PM (slots 1 + 2)</option>
                      <option value="afternoon">Afternoon — 1 – 6 PM (slots 3 + 4)</option>
                      <option value="full">Full Day — all 4 slots</option>
                    </select>
                  </div>

                  <div className="adm-form-row">
                    <label className="adm-form-label">
                      Reason <span className="adm-form-optional">(optional)</span>
                    </label>
                    <input
                      type="text"
                      className="adm-form-input"
                      placeholder="e.g. Holiday, Fleet job, Personal"
                      value={entryForm.reason}
                      onChange={e => setEntryForm(f => ({ ...f, reason: e.target.value }))}
                    />
                  </div>
                </div>

              ) : (

                /* ── Real Appointment form ── */
                <div className="adm-modal-form">
                  <p className="adm-modal-mode-desc">
                    Manually create an appointment — e.g. for a phone booking or a job you scheduled yourself.
                  </p>

                  <div className="adm-form-row-2col">
                    <div className="adm-form-row">
                      <label className="adm-form-label">Name <span className="adm-form-optional">(optional)</span></label>
                      <input
                        type="text"
                        className="adm-form-input"
                        placeholder="Customer name"
                        autoFocus
                        value={entryForm.name}
                        onChange={e => setEntryForm(f => ({ ...f, name: e.target.value }))}
                      />
                    </div>
                    <div className="adm-form-row">
                      <label className="adm-form-label">Phone <span className="adm-form-optional">(optional)</span></label>
                      <input
                        type="tel"
                        className="adm-form-input"
                        placeholder="+1 …"
                        value={entryForm.phone}
                        onChange={e => setEntryForm(f => ({ ...f, phone: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="adm-form-row">
                    <label className="adm-form-label">Date</label>
                    <input
                      type="date"
                      className="adm-form-input"
                      value={entryForm.date}
                      min={todayStr()}
                      onChange={e => setEntryForm(f => ({ ...f, date: e.target.value }))}
                    />
                  </div>

                  <div className="adm-form-row-2col">
                    <div className="adm-form-row">
                      <label className="adm-form-label">Start Time</label>
                      <input
                        type="time"
                        className="adm-form-input"
                        value={entryForm.start_time}
                        min="08:00"
                        max="17:45"
                        step="900"  /* 15-minute increments */
                        onChange={e => setEntryForm(f => ({ ...f, start_time: e.target.value }))}
                      />
                    </div>
                    <div className="adm-form-row">
                      <label className="adm-form-label">End Time</label>
                      <input
                        type="time"
                        className="adm-form-input"
                        value={entryForm.end_time}
                        min="08:15"
                        max="18:00"
                        step="900"
                        onChange={e => setEntryForm(f => ({ ...f, end_time: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="adm-form-row-2col">
                    <div className="adm-form-row">
                      <label className="adm-form-label">Service</label>
                      <select
                        className="adm-form-input"
                        value={entryForm.service_type}
                        onChange={e => setEntryForm(f => ({ ...f, service_type: e.target.value }))}
                      >
                        {Object.entries(SERVICE_LABELS).map(([k, v]) => (
                          <option key={k} value={k}>{v}</option>
                        ))}
                      </select>
                    </div>
                    <div className="adm-form-row">
                      <label className="adm-form-label">Status</label>
                      <select
                        className="adm-form-input"
                        value={entryForm.appointmentStatus}
                        onChange={e => setEntryForm(f => ({ ...f, appointmentStatus: e.target.value }))}
                      >
                        <option value="confirmed">Confirmed</option>
                        <option value="pending">Pending</option>
                      </select>
                    </div>
                  </div>

                  <div className="adm-form-row">
                    <label className="adm-form-label">
                      Vehicle <span className="adm-form-optional">(optional)</span>
                    </label>
                    <input
                      type="text"
                      className="adm-form-input"
                      placeholder="e.g. 2019 Toyota Camry"
                      value={entryForm.vehicle}
                      onChange={e => setEntryForm(f => ({ ...f, vehicle: e.target.value }))}
                    />
                  </div>

                  <div className="adm-form-row">
                    <label className="adm-form-label">
                      Notes <span className="adm-form-optional">(optional)</span>
                    </label>
                    <textarea
                      className="adm-form-input adm-form-textarea"
                      rows={3}
                      placeholder="Any additional notes…"
                      value={entryForm.notes}
                      onChange={e => setEntryForm(f => ({ ...f, notes: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              {entryError && <div className="adm-modal-error">{entryError}</div>}
            </div>

            {/* Footer */}
            <div className="adm-modal-footer">
              <button className="adm-btn adm-btn-ghost" onClick={closeEntryModal} disabled={entrySaving}>
                Cancel
              </button>
              <button className="adm-btn adm-btn-primary" onClick={handleEntrySave} disabled={entrySaving}>
                {entrySaving
                  ? 'Saving…'
                  : entryMode === 'block'
                    ? 'Block Slot(s)'
                    : 'Save Appointment'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          EDIT REVIEW MODAL
          ══════════════════════════════════════════════ */}
      {reviewEdit && (
        <div className="adm-modal-overlay" onClick={closeReviewEdit}>
          <div className="adm-modal" onClick={e => e.stopPropagation()}>
            <div className="adm-modal-header">
              <h3 className="adm-modal-title">Edit Review</h3>
              <button className="adm-modal-close" onClick={closeReviewEdit} aria-label="Close">✕</button>
            </div>

            <div className="adm-modal-body">
              <div className="adm-modal-form">

                <div className="adm-form-row-2col">
                  <div className="adm-form-row">
                    <label className="adm-form-label">Customer Name</label>
                    <input
                      type="text"
                      className="adm-form-input"
                      value={reviewEdit.customer_name || ''}
                      onChange={e => setReviewEdit(r => ({ ...r, customer_name: e.target.value }))}
                    />
                  </div>
                  <div className="adm-form-row">
                    <label className="adm-form-label">Rating</label>
                    <select
                      className="adm-form-input"
                      value={reviewEdit.rating}
                      onChange={e => setReviewEdit(r => ({ ...r, rating: parseInt(e.target.value, 10) }))}
                    >
                      <option value={5}>5 — Excellent</option>
                      <option value={4}>4 — Good</option>
                      <option value={3}>3 — Average</option>
                      <option value={2}>2 — Poor</option>
                      <option value={1}>1 — Bad</option>
                    </select>
                  </div>
                </div>

                <div className="adm-form-row">
                  <label className="adm-form-label">Comment</label>
                  <textarea
                    className="adm-form-input adm-form-textarea"
                    rows={6}
                    value={reviewEdit.comment || ''}
                    onChange={e => setReviewEdit(r => ({ ...r, comment: e.target.value }))}
                  />
                </div>

                <div className="adm-form-row-2col">
                  <div className="adm-form-row">
                    <label className="adm-form-label">
                      Vehicle <span className="adm-form-optional">(optional)</span>
                    </label>
                    <input
                      type="text"
                      className="adm-form-input"
                      placeholder="e.g. 2019 BMW 320d"
                      value={reviewEdit.vehicle || ''}
                      onChange={e => setReviewEdit(r => ({ ...r, vehicle: e.target.value }))}
                    />
                  </div>
                  <div className="adm-form-row">
                    <label className="adm-form-label">
                      Service <span className="adm-form-optional">(optional)</span>
                    </label>
                    <select
                      className="adm-form-input"
                      value={reviewEdit.service_type || ''}
                      onChange={e => setReviewEdit(r => ({ ...r, service_type: e.target.value || null }))}
                    >
                      <option value="">— None —</option>
                      {Object.entries(SERVICE_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="adm-form-row">
                  <label className="adm-form-label">Source</label>
                  <select
                    className="adm-form-input"
                    value={reviewEdit.source || 'website'}
                    onChange={e => setReviewEdit(r => ({ ...r, source: e.target.value }))}
                  >
                    <option value="website">Website (customer-submitted)</option>
                    <option value="google">Google (imported)</option>
                    <option value="manual">Manual (admin-added)</option>
                  </select>
                </div>

              </div>

              {reviewEditError && <div className="adm-modal-error">{reviewEditError}</div>}
            </div>

            <div className="adm-modal-footer">
              <button className="adm-btn adm-btn-ghost" onClick={closeReviewEdit} disabled={reviewEditSaving}>
                Cancel
              </button>
              <button className="adm-btn adm-btn-primary" onClick={saveReviewEdit} disabled={reviewEditSaving}>
                {reviewEditSaving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          BOOKING DETAILS / EDIT MODAL
          Two-stage: first read-only details, then "Edit" reveals
          editable fields with Save / Cancel buttons.
          ══════════════════════════════════════════════ */}
      {bookingDetails && !bookingEdit && (
        <div className="adm-modal-overlay" onClick={closeBookingDetails}>
          <div className="adm-modal" onClick={e => e.stopPropagation()}>
            <div className="adm-modal-header">
              <h3 className="adm-modal-title">Appointment Details</h3>
              <button className="adm-modal-close" onClick={closeBookingDetails} aria-label="Close">✕</button>
            </div>
            <div className="adm-modal-body">
              <div className="adm-details-grid">
                <div className="adm-details-row">
                  <span className="adm-details-lbl">Date</span>
                  <span>{formatDate(bookingDetails.booking_date)}</span>
                </div>
                <div className="adm-details-row">
                  <span className="adm-details-lbl">Time</span>
                  <span>{to12h(bookingDetails.start_time)} – {to12h(bookingDetails.end_time)}</span>
                </div>
                <div className="adm-details-row">
                  <span className="adm-details-lbl">Status</span>
                  <span className={`abt-badge abt-badge-${STATUS_LABELS[bookingDetails.status]?.color ?? 'grey'}`}>
                    {STATUS_LABELS[bookingDetails.status]?.label ?? bookingDetails.status}
                  </span>
                </div>
                <div className="adm-details-row">
                  <span className="adm-details-lbl">Service</span>
                  <span>{SERVICE_LABELS[bookingDetails.service_type] ?? bookingDetails.service_type ?? '—'}</span>
                </div>
                <div className="adm-details-row">
                  <span className="adm-details-lbl">Name</span>
                  <span>{bookingDetails.name || '—'}</span>
                </div>
                <div className="adm-details-row">
                  <span className="adm-details-lbl">Phone</span>
                  <span>
                    {bookingDetails.phone
                      ? <a href={`tel:${bookingDetails.phone}`}>{bookingDetails.phone}</a>
                      : '—'}
                  </span>
                </div>
                <div className="adm-details-row">
                  <span className="adm-details-lbl">Vehicle</span>
                  <span>{bookingDetails.vehicle || '—'}</span>
                </div>
                {bookingDetails.notes && (
                  <div className="adm-details-row adm-details-row-notes">
                    <span className="adm-details-lbl">Notes</span>
                    <span style={{ whiteSpace: 'pre-wrap' }}>{bookingDetails.notes}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="adm-modal-footer">
              <button className="adm-btn adm-btn-ghost" onClick={closeBookingDetails}>Close</button>
              <button className="adm-btn adm-btn-primary" onClick={startEditBooking}>
                Edit · Reschedule · Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit stage — same modal shell, editable fields */}
      {bookingEdit && (
        <div className="adm-modal-overlay" onClick={() => !bookingEditSaving && closeBookingDetails()}>
          <div className="adm-modal" onClick={e => e.stopPropagation()}>
            <div className="adm-modal-header">
              <h3 className="adm-modal-title">Edit Appointment</h3>
              <button className="adm-modal-close" onClick={closeBookingDetails} aria-label="Close" disabled={bookingEditSaving}>✕</button>
            </div>
            <div className="adm-modal-body">
              <div className="adm-modal-form">

                <div className="adm-form-row-2col">
                  <div className="adm-form-row">
                    <label className="adm-form-label">Name</label>
                    <input
                      type="text"
                      className="adm-form-input"
                      value={bookingEdit.name || ''}
                      onChange={e => setBookingEdit(r => ({ ...r, name: e.target.value }))}
                    />
                  </div>
                  <div className="adm-form-row">
                    <label className="adm-form-label">Phone</label>
                    <input
                      type="tel"
                      className="adm-form-input"
                      value={bookingEdit.phone || ''}
                      onChange={e => setBookingEdit(r => ({ ...r, phone: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="adm-form-row">
                  <label className="adm-form-label">Date</label>
                  <input
                    type="date"
                    className="adm-form-input"
                    value={bookingEdit.booking_date}
                    onChange={e => setBookingEdit(r => ({ ...r, booking_date: e.target.value }))}
                  />
                </div>

                <div className="adm-form-row-2col">
                  <div className="adm-form-row">
                    <label className="adm-form-label">Start Time</label>
                    <input
                      type="time"
                      className="adm-form-input"
                      value={bookingEdit.start_time || ''}
                      min="08:00" max="17:45" step="900"
                      onChange={e => setBookingEdit(r => ({ ...r, start_time: e.target.value }))}
                    />
                  </div>
                  <div className="adm-form-row">
                    <label className="adm-form-label">End Time</label>
                    <input
                      type="time"
                      className="adm-form-input"
                      value={bookingEdit.end_time || ''}
                      min="08:15" max="18:00" step="900"
                      onChange={e => setBookingEdit(r => ({ ...r, end_time: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="adm-form-row-2col">
                  <div className="adm-form-row">
                    <label className="adm-form-label">Service</label>
                    <select
                      className="adm-form-input"
                      value={bookingEdit.service_type || ''}
                      onChange={e => setBookingEdit(r => ({ ...r, service_type: e.target.value || null }))}
                    >
                      <option value="">— None —</option>
                      {Object.entries(SERVICE_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <div className="adm-form-row">
                    <label className="adm-form-label">Status</label>
                    <select
                      className="adm-form-input"
                      value={bookingEdit.status}
                      onChange={e => setBookingEdit(r => ({ ...r, status: e.target.value }))}
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div className="adm-form-row">
                  <label className="adm-form-label">Vehicle</label>
                  <input
                    type="text"
                    className="adm-form-input"
                    value={bookingEdit.vehicle || ''}
                    onChange={e => setBookingEdit(r => ({ ...r, vehicle: e.target.value }))}
                  />
                </div>

                <div className="adm-form-row">
                  <label className="adm-form-label">Notes</label>
                  <textarea
                    className="adm-form-input adm-form-textarea"
                    rows={3}
                    value={bookingEdit.notes || ''}
                    onChange={e => setBookingEdit(r => ({ ...r, notes: e.target.value }))}
                  />
                </div>

              </div>

              {/* Conflict warning — non-blocking, just informational.
                  Lets admin double-book on purpose (e.g. two short jobs
                  back-to-back) but flags the overlap clearly. */}
              {(() => {
                const conflicts = findBookingConflicts(bookingEdit);
                if (conflicts.length === 0) return null;
                return (
                  <div className="adm-modal-warning">
                    <strong>⚠ Time overlap</strong>
                    <p>The new time conflicts with:</p>
                    <ul>
                      {conflicts.map(c => (
                        <li key={c.id}>
                          <strong>{to12h(c.start_time)} – {to12h(c.end_time)}</strong>
                          {' · '}
                          {c.name || '(no name)'}
                          {' · '}
                          <em>{STATUS_LABELS[c.status]?.label ?? c.status}</em>
                        </li>
                      ))}
                    </ul>
                    <p className="adm-modal-warning-note">
                      You can still save — the system won&apos;t stop you. Just make sure
                      this overlap is intentional.
                    </p>
                  </div>
                );
              })()}

              {bookingEditError && <div className="adm-modal-error">{bookingEditError}</div>}
            </div>
            <div className="adm-modal-footer adm-modal-footer-edit">
              <button
                className="adm-btn adm-btn-danger"
                onClick={cancelBookingFromModal}
                disabled={bookingEditSaving || bookingEdit.status === 'cancelled'}
              >
                Cancel Appointment
              </button>
              <div className="adm-modal-footer-right">
                <button className="adm-btn adm-btn-ghost" onClick={closeBookingDetails} disabled={bookingEditSaving}>
                  Close
                </button>
                <button className="adm-btn adm-btn-primary" onClick={saveBookingEdit} disabled={bookingEditSaving}>
                  {bookingEditSaving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
