import * as fs from 'fs'
import got from 'got'

// Expect an optional Devtoberfest year, default to current year.
const year = process.argv[2] || new Date().getFullYear()

// Khoros Community Search API
const communitysearchapibase = 'https://groups.community.sap.com/api/2.0/search'

// Main query to retrieve "event" ("occasion") information. Note that the items are
// still classed as "messages".
const eventquery = `
  select
    id,
    subject,
    occasion_data,
    metrics,
    replies.count(*),
    kudos.sum(weight)
  from messages
  where board.id = 'devtoberfest-events'
    and occasion_data.start_time > ${year}-01-01T00:00:00.000+00:00
    and occasion_data.start_time < ${year}-12-31T23:59:59.999+00:00
`

// The query to retrieve RSVPs for a given event (message). This will be
// used to retrieve all "yes" RSVPs for all the events (messages), via their
// IDs, retrieved by the main query.
const rsvpsquery = `
  select
    id,
    rsvp_response
  from rsvps
  where message.id in (LISTLIMIT25)
    and rsvp_response = 'yes'
`

// Function to make an API call to the Community Search API, and deal with the
// pagination mechanism too, by following any next_cursor pointers until all the
// data for the query result has been retrieved. For details on the pagination, see
// https://developer.khoros.com/khoroscommunitydevdocs/docs/pagination-with-community-api-v2
const retrieve = async (q) => {

  let cursor, result, data = []

  do { 

    // Retrieve as many records as we are allowed (LIMIT 1000) and also use the
    // next_cursor mechanism to consume all "pages" of the result set.
    const query = `${q} LIMIT 1000 ${cursor ? `CURSOR '${cursor}'` : ''}`

    // Make the call, expect JSON in response.
    result = await got(`${communitysearchapibase}?q=${encodeURIComponent(query)}`, {}).json()

    // Add the items to the existing data array.
    data = data.concat(result.data.items)

    // Save any next_cursor value.
    cursor = result.data.next_cursor

    // Repeat as long as there's a next_cursor.
  } while (cursor && cursor.length > 0)

  return data

}

// Add a partition(n) function to the Array prototype
Object.defineProperty(Array.prototype, 'partition', {
  value: function(size) {
    if (this.length == 0) return this
    return this.reduce((a, x) => {
      const last = a.length - 1
      if (a[last].length < size) {
        a[last].push(x)
      } else {
        a.push([x])
      }
      return a
    }, [[]])
  }
})

const quote = x => `'${x}'`

// Write events data to STDOUT
// console.log(JSON.stringify(await retrieve(eventquery)))

// Read events data from STDIN
//const eventdata = JSON.parse(fs.readFileSync('/dev/stdin').toString())

const eventdata = await retrieve(eventquery)

// Build queries to retrieve RSVP data, which is separate, and doesn't
// seem to be JOIN-able to the main query. There's also a limit of
// 25 items in the WHERE message.id IN (...) part so we have to partition
// the total number of message IDs out and make multiple calls.
const queries = eventdata
  .map(x => x.id)
  .partition(25)
  .map(x => rsvpsquery.replace('LISTLIMIT25', x.map(quote).join(',')))

// Run queries, appending to single RSVPs array. I would normally prefer to do
// this more functionally, but my brain isn't ready for async/await in lambda
// function contexts.
let rsvprecords = []
for (let i = 0; i < queries.length; i++) {
  rsvprecords = rsvprecords.concat(await retrieve(queries[i]))
}

// Turn RSVPs array into eventid:rsvpcount lookup
const rsvps = rsvprecords
  .reduce((a, x) => {
    a[x.id] = (a[x.id] ? a[x.id] + 1 : 1)
    return a 
  }, {})

// Output event data
console.log(JSON.stringify(eventdata.map(x => ({
  id: x.id,
  subject: x.subject,
  views: x.metrics.views,
  start_time: x.occasion_data.start_time,
  kudos: x.kudos.sum.weight,
  replies: x.replies.count,
  attendees: rsvps[x.id]
})), null, 2))
