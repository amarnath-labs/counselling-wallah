import 'dotenv/config';


const accountId =
  process.env.CLOUDFLARE_ACCOUNT_ID;

const token =
  process.env.CLOUDFLARE_API_TOKEN;

const model =
  process.env.CLOUDFLARE_EMBEDDING_MODEL ||
  '@cf/baai/bge-small-en-v1.5';


if (!accountId) {
  throw new Error(
    'Missing CLOUDFLARE_ACCOUNT_ID'
  );
}


if (!token) {
  throw new Error(
    'Missing CLOUDFLARE_API_TOKEN'
  );
}


const url =
  `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`;


const response =
  await fetch(
    url,
    {
      method: 'POST',

      headers: {
        Authorization:
          `Bearer ${token}`,

        'Content-Type':
          'application/json',
      },

      body:
        JSON.stringify({
          text: [
            'Class 12 PCM student preparing for JEE and interested in engineering and technology.',
          ],
        }),
    }
  );


const data =
  await response.json();


console.log(
  'HTTP:',
  response.status
);


console.log(
  'SUCCESS:',
  data.success
);


if (
  !response.ok ||
  !data.success
) {
  console.dir(
    data,
    {
      depth: null,
    }
  );

  process.exit(1);
}


const vectors =
  data?.result?.data;


console.log(
  'VECTOR COUNT:',
  vectors?.length
);


console.log(
  'DIMENSIONS:',
  vectors?.[0]?.length
);


console.log(
  'FIRST 5:',
  vectors?.[0]?.slice(
    0,
    5
  )
);
