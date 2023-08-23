def addmonth: .month = (.post_time[:7]);
def topics: map(.subject | sub("^Re: ";"")) | unique;
map(addmonth)
| group_by(.month)
| map({(first.month): topics})
| add


