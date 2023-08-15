const https = require('https');
const search = 'https://groups.community.sap.com/api/2.0/search'
const year = 2022
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
  limit 25
`
const rsvpquery = `
  select
    id,
    rsvp_response
  from rsvps
  where message.id in (LIST)
    and rsvp_response = 'yes'
  limit 1000
`

https

  .get(`${search}?q=${encodeURIComponent(eventquery)}`, res => {

    let chunks = []

    res.on('data', chunk => { chunks.push(chunk) })

    res.on('end', () => {

      const result = JSON.parse(Buffer.concat(chunks).toString())
      const events = result.data.items
      const eventidlist = events.map(x => `'${x.id}'`)
      const query = rsvpquery.replace('LIST',eventidlist)

      https.get(`${search}?q=${encodeURIComponent(query)}`, res => {

        let chunks = []

        res.on('data', chunk => { chunks.push(chunk) })

        res.on('end', () => {
          const result = JSON.parse(Buffer.concat(chunks).toString())
          console.log(result.data)
          const attendeecounts = result.data.items.reduce(
            (a, x) => { a[x.id] = a[x.id] ? a[x.id] + 1 : 1; return a },
            {}
          )

          console.log(
            events.map(x => ({
              event: x.subject,
              date: x.occasion_data.start_time.split('T')[0],
              views: x.metrics.views,
              replies: x.replies.count,
              kudos: x.kudos.sum.weight,
              attendees: attendeecounts[x.id]
            }))
          )
          
        })

      })
      .on('error', err => { console.log(err.message) })

    })

  })

  .on('error', err => { console.log(err.message) })
