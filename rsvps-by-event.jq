def rsvps: 
  group_by(.rsvp_response)
  | map({(first.rsvp_response): map(.user.login)})
;
map({subject, rsvps: .occasion_data.rsvp|rsvps})
