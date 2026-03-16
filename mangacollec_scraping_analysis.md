## 1. Credentials
- **Email:** `ltiollier31@gmail.com`
- **Password:** `MangaStore2025!`
- **OAuth Client ID:** `38fee110b53a75af6cc72f6fb66fa504fc6241e566788f4b2f5b21c25ba2fefb`
- **OAuth Client Secret:** `060658630f7d199c19ab1cf34ed4e50935c748267e318a24e048d6ab45871da2`
- **Sample Bearer Token:** `yTQK2HC-SwirfTd5PBIXwP0R0oxXeK7e3u4zpTilQEw`
  *(Note: This token was captured from a live session on 2026-03-16)*

## 2. API Analysis

The website works as a React application communicating with a REST API.

### Infrastructure
- **Base URL:** `https://api.mangacollec.com/v2/`
- **Authentication:** `Bearer` token (found in the `Authorization` header after login).

### Required Headers
To successfully mimic browser requests, the following headers are necessary:
- `x-app-version: 2.15.0`
- `x-system-name: Web`
- `x-app-build-number: 110`
- `Accept: application/json`
- `Authorization: Bearer <token>`

### Key Endpoints

#### `GET /series`
- **Usage:** Retrieve a list of series.
- **Sample Response:**
    ```json
    {
      "series": [
        {
          "id": "a02cf154-af6c-4f08-9a7a-32f7bc229ac8",
          "title": "One Piece",
          "type_id": "106f524e-7283-44b8-aa84-25e9a7fb1f7d",
          "adult_content": false,
          "editions_count": 5,
          "tasks_count": 1
        }
      ]
    }
    ```

#### `GET /series/{series_id}`
- **Usage:** Retrieve detailed metadata for a specific series, including editions and volumes.
- **One Piece ID:** `a02cf154-af6c-4f08-9a7a-32f7bc229ac8`
- **Sample Response Structure:**
    ```json
    {
      "authors": [
        {
          "first_name": "Eiichirō",
          "id": "e6cc4590-0b5e-4122-9428-b9b185bdb221",
          "name": "Oda",
          "tasks_count": 30
        }
      ],
      "editions": [
        {
          "id": "d56047bf-5855-4757-9f2f-539f9922e8db",
          "series_id": "a02cf154-af6c-4f08-9a7a-32f7bc229ac8",
          "volumes_count": 113,
          "commercial_stop": false
        }
      ],
      "volumes": [
        {
          "id": "de103e3c-79f6-4018-82eb-ad2a156f1742",
          "isbn": "9782344071120",
          "number": 113,
          "release_date": "2026-09-23"
        }
      ]
    }
    ```

#### `GET /kinds`
- **Usage:** Get the full list of genres/tags.

## 3. Recommended Scraping Strategy
1. **Login:** Capture the Bearer token by simulating a POST to `/login` (or equivalent).
2. **Crawl Series:** 
    - Iterate through the series list (handle pagination if necessary).
    - Store series UUIDs.
3. **Fetch Details:**
    - For each series UUID, call `/series/{uuid}` to get volumes and ISBNs.
4. **Rate Limiting:** Implement delays between requests to avoid being blocked.

## 4. Next Steps
- Implement a backend service in Laravel to perform the scraping.
- Map MangaCollec data structure to our local DDD Domain Models.
