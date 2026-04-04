import { useState, useMemo, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, MapPin } from "lucide-react";
import "../styles/events-calendar.css";

/**
 * EventsCalendar — Dual-pane design (Mini Calendar + Day List)
 * Mobile-first, side-by-side on desktop.
 */
export default function EventsCalendar({ events = [] }) {
  // --- Helpers ---
  const parseTimeValue = (str) => {
    if (!str) return 0;
    const match = str.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!match) return 0;
    let [ , h, m, period] = match;
    let hours = parseInt(h, 10);
    let mins = parseInt(m, 10);
    if (period.toUpperCase() === "PM" && hours !== 12) hours += 12;
    if (period.toUpperCase() === "AM" && hours === 12) hours = 0;
    return hours * 60 + mins;
  };

  const getEventTimes = (timeStr) => {
    if (!timeStr) return { start: 0, end: 0 };
    const parts = timeStr.split(/[-–—]/); 
    return {
      start: parseTimeValue(parts[0]),
      end: parseTimeValue(parts[1])
    };
  };

  const getLocalDateString = (dateObj) => {
    const d = new Date(dateObj);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0];
  };

  // --- Process Events ---
  // Determine which dates have events (YYYY-MM-DD strings)
  const eventDatesMap = useMemo(() => {
    const map = new Map();
    events.forEach(ev => {
      const dateKey = ev.date.slice(0, 10);
      if (!map.has(dateKey)) map.set(dateKey, []);
      map.get(dateKey).push(ev);
    });
    // Sort events within each day chronologically
    for (let dayEvents of map.values()) {
      dayEvents.sort((a, b) => {
        const timesA = getEventTimes(a.time);
        const timesB = getEventTimes(b.time);
        
        // If start times are different, sort by start time
        if (timesA.start !== timesB.start) {
          return timesA.start - timesB.start;
        }
        // If start times are exactly the same, sort by end time (shorter events first)
        return timesA.end - timesB.end;
      });
    }
    return map;
  }, [events]);

  // --- State ---
  const [selectedDateStr, setSelectedDateStr] = useState(getLocalDateString(new Date()));
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Auto-select a valid date when component mounts if today has no events
  useEffect(() => {
    const todayStr = getLocalDateString(new Date());
    if (events.length > 0 && !eventDatesMap.has(todayStr)) {
      // Find the earliest upcoming event
      const upcoming = events.slice().sort((a, b) => new Date(a.date) - new Date(b.date));
      const firstValidDate = upcoming[0].date.slice(0, 10);
      setSelectedDateStr(firstValidDate);
      setCurrentMonth(new Date(upcoming[0].date));
    }
  }, [events, eventDatesMap]);

  // --- Calendar Generator Logic ---
  const renderCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    
    const startOffset = firstDayOfMonth.getDay(); // 0 (Sun) to 6 (Sat)
    const totalDays = lastDayOfMonth.getDate();

    const days = [];
    
    // Empty prefix cells
    for (let i = 0; i < startOffset; i++) {
      days.push(<div key={`empty-${i}`} className="ec-cal-cell empty"></div>);
    }

    const todayStr = getLocalDateString(new Date());

    // Actual day cells
    for (let i = 1; i <= totalDays; i++) {
      const dateD = new Date(year, month, i);
      const dateKey = getLocalDateString(dateD);
      const hasEvents = eventDatesMap.has(dateKey);
      const eventCount = hasEvents ? eventDatesMap.get(dateKey).length : 0;
      
      const isSelected = dateKey === selectedDateStr;
      const isToday = dateKey === todayStr;

      let classes = "ec-cal-cell";
      if (isSelected) classes += " selected";
      else if (isToday) classes += " today";
      
      if (hasEvents && !isSelected) classes += " has-events";

      days.push(
        <button 
          key={i} 
          className={classes} 
          onClick={() => setSelectedDateStr(dateKey)}
          type="button"
        >
          <span className="ec-cal-date-num">{i}</span>
        </button>
      );
    }

    return days;
  };

  const handlePrevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  // --- Render Event List ---
  const selectedEvents = eventDatesMap.get(selectedDateStr) || [];
  
  const displaySelectedDate = new Date(selectedDateStr).toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  return (
    <div className="ec-split-layout">
      
      {/* ── LEFT PANE: Mini Calendar Widget ── */}
      <div className="ec-pane-calendar">
        <div className="ec-cal-header">
          <button onClick={handlePrevMonth} className="ec-cal-nav"><ChevronLeft size={18} /></button>
          <h4 className="ec-cal-month-title">
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h4>
          <button onClick={handleNextMonth} className="ec-cal-nav"><ChevronRight size={18} /></button>
        </div>
        
        <div className="ec-cal-grid-header">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
            <div key={d} className="ec-cal-dow">{d}</div>
          ))}
        </div>
        
        <div className="ec-cal-grid">
          {renderCalendarDays()}
        </div>
        
        {/* Legend / Info */}
        <div className="ec-cal-legend">
           <span className="ec-legend-item"><span className="ec-has-events-demo"></span> Event Day</span>
           <span className="ec-legend-item"><span className="ec-today-demo"></span> Today</span>
        </div>
      </div>

      {/* ── RIGHT PANE: Event List for Selected Day ── */}
      <div className="ec-pane-list">
        <div className="ec-list-header">
          <div className="ec-list-title-wrap">
            <CalendarIcon size={18} className="ec-list-icon" />
            <h4 className="ec-list-title">{displaySelectedDate}</h4>
          </div>
          {selectedEvents.length > 0 && (
            <span className="ec-list-count">{selectedEvents.length} Event{selectedEvents.length !== 1 ? 's' : ''}</span>
          )}
        </div>

        <div className="ec-list-content">
          {selectedEvents.length === 0 ? (
            <div className="ec-empty">
              <span className="ec-empty-icon">☕</span>
              <p>No events scheduled for this day.</p>
              <button 
                className="ec-btn-reset" 
                onClick={() => {
                  const upcoming = events.slice().sort((a,b) => new Date(a.date) - new Date(b.date));
                  if (upcoming.length > 0) {
                     const firstValid = upcoming[0].date.slice(0, 10);
                     setSelectedDateStr(firstValid);
                     setCurrentMonth(new Date(upcoming[0].date));
                  }
                }}
              >
                Jump to upcoming event
              </button>
            </div>
          ) : (
            <div className="ec-cards-wrapper">
              {selectedEvents.map((ev, idx) => (
                <div key={ev.id || idx} className="ec-event-card">
                  <div className="ec-card-time">{ev.time}</div>
                  <div className="ec-card-body">
                    <h5 className="ec-card-title">{ev.title}</h5>
                    <div className="ec-card-venue">
                      <MapPin size={12} /> {ev.place}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
