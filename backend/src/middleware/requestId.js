import {
  randomUUID,
} from 'node:crypto';


export default function requestIdMiddleware(
  req,
  res,
  next
) {
  const incoming =
    String(
      req.headers[
        'x-request-id'
      ] || ''
    ).trim();


  const requestId =
    incoming ||
    `req_${randomUUID()}`;


  req.requestId =
    requestId;


  res.setHeader(
    'x-request-id',
    requestId
  );


  next();
}
