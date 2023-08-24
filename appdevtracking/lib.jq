#!/usr/bin/jq

# Add a month property to the object, based on the object's 
# post_time value, which will start YYYY-MM-DD... and we just
# take the first 7 chars, i.e. the YYYY-MM part.
def addmonth: .month = (.post_time[:7]);

# Return a list of unique topics, based on subject lines of
# threads, and replies to those threads, where any "Re: " prefix
# on the replies' subject lines have been removed.
def topics: map(.subject | sub("^Re: ";"")) | unique;
