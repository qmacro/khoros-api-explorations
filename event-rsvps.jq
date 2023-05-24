import "lib" as lib;

# Simplify start times to just YYYY-MM-DD
map(.occasion_data.start_time |= .[:10])

# Order by start date
| sort_by(.occasion_data.start_time)

# Emit title, start date and RSVP summary for each
# upcoming CodeJam event.
| map({
  subject, 
  start: .occasion_data.start_time,
  rsvps: .occasion_data.rsvp | lib::rsvp_summary
})
