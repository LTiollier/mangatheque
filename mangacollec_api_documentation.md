# MangaCollec API Database Schema Documentation

This document describes the database schema of the MangaCollec API, based on the analysis of the `v2/series` and `v2/series/{id}` endpoints.

## Entity-Relationship Overview

The schema follows a hierarchical structure where manga are organized by **Series**, which contain multiple **Editions**, which in turn contain multiple **Volumes**. **Boxes** (coffrets) are handled separately through **Box Editions**.

---

## 1. Series
Represents a manga series (e.g., "One Piece").

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Unique identifier of the series. |
| `title` | String | Name of the series. |
| `type_id` | UUID | Reference to the **Type** of the series. |
| `adult_content` | Boolean | Whether the series contains adult content. |
| `editions_count` | Integer | Total number of editions for this series. |
| `tasks_count` | Integer | Number of tasks (authors/jobs) associated. |
| `kinds_ids` | UUID[] | Array of **Kind** identifiers (genres). |

---

## 2. Types
Defines the format of the series.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Unique identifier. |
| `title` | String | Format name (e.g., "Manga", "Global Manga", "Artbook", "Roman"). |
| `to_display` | Boolean | UI hint for display. |

---

## 3. Kinds (Genres)
Genres or categories associated with series.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Unique identifier. |
| `title` | String | Genre name (e.g., "Action", "Aventure", "Shōnen"). |

---

## 4. Authors
People involved in creating the series.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Unique identifier. |
| `name` | String | Last name or pseudonym. |
| `first_name` | String | First name (nullable). |
| `tasks_count` | Integer | Total tasks associated with this author across all series. |

---

## 5. Jobs
Roles that authors can have.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Unique identifier. |
| `title` | String | Role name (e.g., "Auteur", "Dessinateur", "Scénariste"). |

---

## 6. Tasks
Link table for Series, Authors, and Jobs (M-N relation with extra metadata).

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Unique identifier. |
| `series_id` | UUID | Reference to **Series**. |
| `author_id` | UUID | Reference to **Author**. |
| `job_id` | UUID | Reference to **Job**. |

---

## 7. Editions
Specific editions of a series (e.g., "Standard", "Collector", "Double Volume").

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Unique identifier. |
| `title` | String | Edition name (nullable for default/unnamed editions). |
| `series_id` | UUID | Reference to **Series**. |
| `publisher_id` | UUID | Reference to **Publisher**. |
| `parent_edition_id`| UUID | Reference to another **Edition** (for variant editions, nullable). |
| `volumes_count` | Integer | Number of volumes in this edition. |
| `last_volume_number`| Integer | Number of the latest volume released (nullable). |
| `commercial_stop` | Boolean | Whether the edition is still in print. |
| `not_finished` | Boolean | Whether the edition is still ongoing. |
| `follow_editions_count`| Integer | Number of users following this edition. |

---

## 8. Publishers
Companies publishing the manga.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Unique identifier. |
| `title` | String | Publisher name (e.g., "Glénat", "Kana"). |
| `closed` | Boolean | Whether the publisher is still active. |
| `editions_count` | Integer | Total number of editions published. |
| `no_amazon` | Boolean | Whether the publisher prohibits Amazon sales. |

---

## 9. Volumes
Individual books within an edition.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Unique identifier. |
| `title` | String | volume-specific title (nullable). |
| `number` | Integer | Volume number. |
| `release_date` | Date | Official release date (YYYY-MM-DD). |
| `isbn` | String | International Standard Book Number. |
| `asin` | String | Amazon Standard Identification Number (nullable). |
| `edition_id` | UUID | Reference to **Edition**. |
| `possessions_count`| Integer | Number of users owning this volume. |
| `not_sold` | Boolean | Whether the volume is not sold individually (e.g., box-only). |
| `image_url` | String | URL to the cover image. |

> [!NOTE]
> Detailed descriptions (synopsis) are not available at the series level. They are found at the volume level in the `content` field (HTML format), accessible via the `GET /v2/volumes/{volume_id}` endpoint.

---

## 10. Box Editions (Coffret Series)
Groups of box sets (coffrets).

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Unique identifier. |
| `title` | String | Name of the box edition. |
| `publisher_id` | UUID | Reference to **Publisher**. |
| `boxes_count` | Integer | Number of boxes in this collection. |
| `adult_content` | Boolean | Adult content flag. |
| `box_follow_editions_count`| Integer | Users following this box series. |

---

## 11. Boxes (Individual Coffrets)
Physical box sets sold.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Unique identifier. |
| `title` | String | Name of the box (e.g., "Coffret East Blue"). |
| `number` | Integer | Box number in the series. |
| `release_date` | Date | Release date. |
| `isbn` | String | ISBN for the box set. |
| `asin` | String | ASIN for the box set. |
| `commercial_stop` | Boolean | In print status. |
| `box_edition_id` | UUID | Reference to **Box Edition**. |
| `box_possessions_count`| Integer | Users owning this box. |
| `image_url` | String | URL to the box image. |

---

## 12. Box Volumes
Link table between Boxes and Volumes.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Unique identifier. |
| `box_id` | UUID | Reference to **Box**. |
| `volume_id` | UUID | Reference to **Volume**. |
| `included` | Boolean | Whether the volume is physically included in the box (some boxes are "empty" collectors). |
