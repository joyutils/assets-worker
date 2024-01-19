# Joystream Assets worker

This is a Cloudflare worker that lets you easily get thumbnails/media for Joystream videos. Instead of running a complex GraphQL query, processing results and then fetching the data, you can use this worker with just a video ID and get assets directly.

## Usage

1. Get all assets URLs for a video ID:

```
https://assets.joyutils.org/video/<video_id>
```

2. Get a video thumbnail:

```
https://assets.joyutils.org/video/<video_id>/thumbnail
```

3. Get a video media:

```
https://assets.joyutils.org/video/<video_id>/media
```

4. Get all assets URLs for a channel ID:

```
https://assets.joyutils.org/channel/<channel_id>
```

5. Get a channel avatar:

```
https://assets.joyutils.org/channel/<channel_id>/avatar
```

6. Get a channel cover photo:

```
https://assets.joyutils.org/channel/<channel_id>/cover
```

## How it works

Under the hood, whenever a request to the worker is made, it will query Orion at `https://orion.gleev.xyz/graphql` to get a list of active operators for given assets. The worker also resolves user geolocation and provides that to Orion to get URLs sorted by distance.
