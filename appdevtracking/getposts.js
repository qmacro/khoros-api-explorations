#!/usr/bin/env node

import * as fs from 'fs'
import got from 'got'

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


const results = await(retrieve(`
  select
    id,
    subject,
    post_time
  from messages
  where board.id = 'application-developmentforum-board'
`))

console.log(JSON.stringify(results, null, 2))
