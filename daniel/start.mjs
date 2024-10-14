import * as fs from 'fs'
import got from 'got'

// Expect a thread id and size (tiny, thumb, small, medium, large, original)
const threadid = process.argv[2] || '13872559'
const size = process.argv[3] || 'original'

// Khoros Community Search API
const communitysearchapibase = 'https://groups.community.sap.com/api/2.0/search'

const eventquery = `
  select
    id
  from messages
  where ancestors.id = '${threadid}'
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

const getMessageImages = async (messageid) => {
  const imagequery = `
    select
      id,
      owner.login,
      title,
      ${size}_href
    from images
    where messages.id = '${messageid}'
  `
  // Get image info for thread message
  const result = await retrieve(imagequery)
  console.log(result)

  // Download each image
  result.forEach(image => {

    // Image extension is in the filename in the 'title'
    const ext = image.title.replace(/^.+\./, '')

    // Construct the filename from owner, message ID, image ID and extension
    const filename = [
      image.owner.login,
      messageid,
      image.id,
      size
    ].join('-') + `.${ext}`

    console.log(filename)

    // Download
    got.stream(image[`${size}_href`]).pipe(fs.createWriteStream(filename))
  })
}

const main = async () => {
  const messages = await retrieve(eventquery)
  messages.forEach(async message => {
    await getMessageImages(message.id)
    await new Promise(resolve => setTimeout(resolve, 1000));
  })
}

main()
