#!/usr/bin/env jq

# The CodeJam and RSVP datasets are slurped in to become two items 
# in an array:
# - the RSVPs
# - the CodeJam dataset

# These are merged, by assembling a lookup object containing a key/value
# pair that is the CodeJam ID and the RSVP array for that CodeJam ID, and
# then replacing the value of each CodeJam's rsvp property with the 
# corresponding RSVP array from that lookup object.

# Assemble the RSVP lookup object:
(
  first.data.items
  | group_by(.id)
  | map({(first.id):.})
  | add
) as $rsvps

# Work through the CodeJam dataset and update the rsvp property
# with the corresponding array of RSVPs from the RSVP lookup object
# (falling back to an empty array if there are no RSVP records for 
# a CodeJam):
| .[1].data.items
| map(.occasion_data.rsvp = ($rsvps[.id] // []))
