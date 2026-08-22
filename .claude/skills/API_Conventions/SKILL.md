\## API Conventions



\- All endpoints return JSON

\- Use kebab-case for URL paths: `/user-profiles` not `/userProfiles`

\- Use camelCase for JSON fields: `{ "firstName": "Ada" }`

\- Always include `Content-Type: application/json` header



\## Error Response Format



Always return errors in this exact shape:



```json

{

&#x20; "error": {

&#x20;   "code": "NOT\_FOUND",

&#x20;   "message": "User with id 42 not found"

&#x20; }

}

```



\## Status Code Rules



\- 200 for successful reads

\- 201 for successful creates

\- 400 for invalid input

\- 404 for missing resources

\- 500 should never be intentional — fix the bug

