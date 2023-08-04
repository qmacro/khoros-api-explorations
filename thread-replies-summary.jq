import "lib" as lib;

# Produce a quick summary of all the replies to a discussion thread
.data.items
| map({
   (.post_time): "\(.author.login): \(.search_snippet)"
  })
| add
