#!/usr/bin/env node

import * as fs from 'fs'
import got from 'got'

// These are the ids for the "root level" messages (meaning blog posts and discussions)
// for the given challenge
const roots = [
    { id: '13749653', message: `Blog post:  Main challenge blog post` },
    { id: '13749996', message: `Discussion: Task 0 - Server and service provisioning` },
    { id: '13752205', message: `Discussion: Task 1 - Your first service and first endpoint` },
    { id: '13755407', message: `Discussion: Task 2 - Capire's Hello World!` },
    { id: '13757582', message: `Discussion: Task 3 - Multi-parameter basic sum function` },
    { id: '13760488', message: `Discussion: Task 4 - Plain "REST" endpoint` },
    { id: '13762855', message: `Discussion: Task 5 - A "REST" service document` },
    { id: '13765529', message: `Discussion: Task 6 - API endpoint with payload required` },
    { id: '13767476', message: `Discussion: Task 7 - Using CQL in an unbound function implementation` },
    { id: '13769896', message: `Discussion: Task 8 - Responding to an OData query with navigation` },
    { id: '13772607', message: `Discussion: Task 9 - Using CQL in an unbound action` },
    { id: '13774996', message: `Discussion: Task 10 - The power of CDL with as-select` },
    { id: '13776485', message: `Discussion: Task 11 - Using implicit parameters with a bound function` },
    { id: '13776497', message: `Discussion: Task 12 - Give us feedback about this challenge` }
]

// Khoros Community Search API
const communitysearchapibase = 'https://groups.community.sap.com/api/2.0/search'

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

        await new Promise(resolve => setTimeout(resolve, 1000))

        // Make the call, expect JSON in response.
        result = await got(`${communitysearchapibase}?q=${encodeURIComponent(query)}`, {}).json()

        // Add the items to the existing data array.
        data = data.concat(result.data.items)

        // Save any next_cursor value.
        cursor = result.data.next_cursor

        // Wait before making another call
        if (cursor) await new Promise(resolve => setTimeout(resolve, 5000))

        // Repeat as long as there's a next_cursor.
    } while (cursor && cursor.length > 0)

    return data

}
const quote = x => `'${x}'`

// Generic query to retrieve details for either:
// NODEREF = id -> root level message
// NODEREF = ancestors.id -> children messages (replies to the given root level message)
const query = `
select
  id, 
  subject,
  author,
  metrics,
  kudos.sum(weight)
from messages
where NODEREF = 'MESSAGEID'
`

const rootquery = query.replace('NODEREF', 'id')
const repliesquery = query.replace('NODEREF', 'ancestors.id')

// Emit all participants
roots.forEach(async root => {
    const msgreplies = await retrieve(repliesquery.replace('MESSAGEID', root.id))
    msgreplies.forEach(x => console.log(`${x.author.id} ${x.author.login}`))
})
