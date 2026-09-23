let cachedToken = null;
let cachedTokenExpiresAt = 0;


function required(
  name
) {
  const value =
    String(
      process.env[
        name
      ] || ""
    ).trim();

  if (
    !value
  ) {
    throw new Error(
      `Missing environment variable: ${name}`
    );
  }

  return value;
}


async function
getAccessToken() {
  const now =
    Date.now();

  if (
    cachedToken &&
    now <
      cachedTokenExpiresAt -
        60_000
  ) {
    return cachedToken;
  }


  const clientId =
    required(
      "REDDIT_CLIENT_ID"
    );

  const clientSecret =
    required(
      "REDDIT_CLIENT_SECRET"
    );


  const auth =
    Buffer
      .from(
        `${clientId}:${clientSecret}`
      )
      .toString(
        "base64"
      );


  const body =
    new URLSearchParams({
      grant_type:
        "client_credentials",
    });


  const response =
    await fetch(
      "https://www.reddit.com/api/v1/access_token",
      {
        method:
          "POST",

        headers: {
          Authorization:
            `Basic ${auth}`,

          "Content-Type":
            "application/x-www-form-urlencoded",

          "User-Agent":
            process.env
              .REDDIT_USER_AGENT ||
            "TruMargReviewCollector/1.0",
        },

        body,
      }
    );


  if (
    !response.ok
  ) {
    const text =
      await response.text();

    throw new Error(
      `Reddit OAuth failed: ${response.status} ${text}`
    );
  }


  const json =
    await response.json();


  cachedToken =
    json.access_token;


  cachedTokenExpiresAt =
    now +
    Number(
      json.expires_in ||
      3600
    ) *
      1000;


  return cachedToken;
}


async function
redditGet(
  pathname,
  params = {}
) {
  const token =
    await getAccessToken();


  const url =
    new URL(
      `https://oauth.reddit.com${pathname}`
    );


  for (
    const [
      key,
      value,
    ]
    of Object.entries(
      params
    )
  ) {
    if (
      value !==
      undefined &&
      value !==
      null
    ) {
      url.searchParams.set(
        key,
        String(
          value
        )
      );
    }
  }


  const response =
    await fetch(
      url,
      {
        headers: {
          Authorization:
            `Bearer ${token}`,

          "User-Agent":
            process.env
              .REDDIT_USER_AGENT ||
            "TruMargReviewCollector/1.0",
        },
      }
    );


  if (
    !response.ok
  ) {
    const text =
      await response.text();

    throw new Error(
      `Reddit API failed: ${response.status} ${text}`
    );
  }


  return response.json();
}


function cleanText(
  value
) {
  return String(
    value || ""
  )
    .replace(
      /\s+/g,
      " "
    )
    .trim();
}


function postToReview(
  post
) {
  const data =
    post?.data ||
    {};

  const title =
    cleanText(
      data.title
    );

  const selftext =
    cleanText(
      data.selftext
    );

  const text =
    cleanText(
      [
        title,
        selftext,
      ]
        .filter(
          Boolean
        )
        .join(
          ". "
        )
    );


  if (
    text.length <
    40
  ) {
    return null;
  }


  return {
    sourceReviewId:
      data.name ||
      (
        data.id
          ? `t3_${data.id}`
          : null
      ),

    url:
      data.permalink
        ? `https://www.reddit.com${data.permalink}`
        : null,

    author:
      data.author ||
      null,

    title:
      title ||
      null,

    text,

    reviewDate:
      data.created_utc
        ? new Date(
            Number(
              data.created_utc
            ) *
              1000
          )
            .toISOString()
        : null,

    subreddit:
      data.subreddit ||
      null,

    redditType:
      "post",

    raw:
      data,
  };
}


function flattenComments(
  children,
  output = []
) {
  for (
    const child
    of children ||
    []
  ) {
    if (
      child?.kind !==
      "t1"
    ) {
      continue;
    }

    const data =
      child.data ||
      {};


    const body =
      cleanText(
        data.body
      );


    if (
      body.length >=
      40 &&
      body !==
      "[deleted]" &&
      body !==
      "[removed]"
    ) {
      output.push({
        sourceReviewId:
          data.name ||
          (
            data.id
              ? `t1_${data.id}`
              : null
          ),

        url:
          data.permalink
            ? `https://www.reddit.com${data.permalink}`
            : null,

        author:
          data.author ||
          null,

        title:
          null,

        text:
          body,

        reviewDate:
          data.created_utc
            ? new Date(
                Number(
                  data.created_utc
                ) *
                  1000
              )
                .toISOString()
            : null,

        subreddit:
          data.subreddit ||
          null,

        redditType:
          "comment",

        raw:
          data,
      });
    }


    const replies =
      data?.replies
        ?.data
        ?.children;

    if (
      Array.isArray(
        replies
      )
    ) {
      flattenComments(
        replies,
        output
      );
    }
  }

  return output;
}


async function
loadComments(
  postId
) {
  if (
    !postId
  ) {
    return [];
  }

  const json =
    await redditGet(
      `/comments/${postId}`,
      {
        limit:
          100,

        depth:
          6,

        raw_json:
          1,
      }
    );


  const commentListing =
    Array.isArray(
      json
    )
      ? json[1]
      : null;


  return flattenComments(
    commentListing
      ?.data
      ?.children ||
    []
  );
}


function uniqueById(
  rows
) {
  const seen =
    new Set();

  const output =
    [];

  for (
    const row
    of rows
  ) {
    const key =
      row
        ?.sourceReviewId ||
      row
        ?.url ||
      row
        ?.text;

    if (
      !key ||
      seen.has(
        key
      )
    ) {
      continue;
    }

    seen.add(
      key
    );

    output.push(
      row
    );
  }

  return output;
}


export async function
collectRedditReviews({
  collegeName,
  aliases = [],
  maxPosts = 40,
  maxReviews = 60,
}) {
  if (
    !collegeName
  ) {
    throw new Error(
      "collegeName is required"
    );
  }


  const queries =
    [
      collegeName,
      ...aliases,
      `${collegeName} review`,
      `${collegeName} placements`,
      `${collegeName} hostel`,
      `${collegeName} campus`,
      `${collegeName} faculty`,
    ]
      .filter(
        Boolean
      );


  const postMap =
    new Map();


  for (
    const query
    of queries
  ) {
    const search =
      await redditGet(
        "/search",
        {
          q:
            query,

          sort:
            "relevance",

          t:
            "all",

          limit:
            100,

          type:
            "link",

          raw_json:
            1,
        }
      );


    const children =
      search
        ?.data
        ?.children ||
      [];


    for (
      const post
      of children
    ) {
      const id =
        post
          ?.data
          ?.id;

      if (
        !id
      ) {
        continue;
      }

      if (
        !postMap.has(
          id
        )
      ) {
        postMap.set(
          id,
          post
        );
      }

      if (
        postMap.size >=
        maxPosts
      ) {
        break;
      }
    }


    if (
      postMap.size >=
      maxPosts
    ) {
      break;
    }
  }


  const collected =
    [];


  for (
    const [
      postId,
      post
    ]
    of postMap
  ) {
    const review =
      postToReview(
        post
      );

    if (
      review
    ) {
      collected.push(
        review
      );
    }


    if (
      collected.length <
      maxReviews
    ) {
      try {
        const comments =
          await loadComments(
            postId
          );

        collected.push(
          ...comments
        );
      }
      catch (
        error
      ) {
        console.warn(
          "[REDDIT COMMENTS]",
          postId,
          error?.message
        );
      }
    }


    if (
      collected.length >=
      maxReviews *
        2
    ) {
      break;
    }
  }


  return uniqueById(
    collected
  )
    .slice(
      0,
      maxReviews
    );
}
