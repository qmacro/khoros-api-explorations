def rsvp_details: 
  group_by(.rsvp_response)
  | map({(first.rsvp_response): map(.user.login)})
;

def rsvp_summary: 
  group_by(.rsvp_response)
  | map({(first.rsvp_response): length})
  | add
;
