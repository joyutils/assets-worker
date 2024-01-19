import { Router } from 'itty-router';

const router = Router();

router.get('/video/:videoId', async (request, fullRequest: Request) => {
	const { videoId } = request.params;
	if (!videoId || isNaN(Number(videoId))) {
		return new Response('Invalid video id', { status: 400 });
	}
	const videoUrlsResult = await getVideoUrls(videoId, fullRequest.cf);
	if (videoUrlsResult instanceof Response) {
		return videoUrlsResult;
	}
	return Response.json(videoUrlsResult);
});
router.get('/video/:videoId/thumbnail', async (request, fullRequest: Request) => {
	const { videoId } = request.params;
	if (!videoId || isNaN(Number(videoId))) {
		return new Response('Invalid video id', { status: 400 });
	}
	const videoUrlsResult = await getVideoUrls(videoId, fullRequest.cf);
	if (videoUrlsResult instanceof Response) {
		return videoUrlsResult;
	}
	if (!videoUrlsResult.thumbnailUrls.length) {
		return new Response('Video has no thumbnail', { status: 404 });
	}
	return fetch(videoUrlsResult.thumbnailUrls[0], { headers: fullRequest.headers });
});
router.get('/video/:videoId/media', async (request, fullRequest: Request) => {
	const { videoId } = request.params;
	if (!videoId || isNaN(Number(videoId))) {
		return new Response('Invalid video id', { status: 400 });
	}
	const videoUrlsResult = await getVideoUrls(videoId, fullRequest.cf);
	if (videoUrlsResult instanceof Response) {
		return videoUrlsResult;
	}
	if (!videoUrlsResult.videoUrls.length) {
		return new Response('Video has no media', { status: 404 });
	}
	return fetch(videoUrlsResult.videoUrls[0], { headers: fullRequest.headers });
});

router.get('/channel/:channelId', async (request, fullRequest: Request) => {
	const { channelId } = request.params;
	if (!channelId || isNaN(Number(channelId))) {
		return new Response('Invalid channel id', { status: 400 });
	}
	const channelUrlsResult = await getChannelUrls(channelId, fullRequest.cf);
	if (channelUrlsResult instanceof Response) {
		return channelUrlsResult;
	}
	return Response.json(channelUrlsResult);
});
router.get('/channel/:channelId/avatar', async (request, fullRequest: Request) => {
	const { channelId } = request.params;
	if (!channelId || isNaN(Number(channelId))) {
		return new Response('Invalid channel id', { status: 400 });
	}
	const channelUrlsResult = await getChannelUrls(channelId, fullRequest.cf);
	if (channelUrlsResult instanceof Response) {
		return channelUrlsResult;
	}
	if (!channelUrlsResult.avatarUrls.length) {
		return new Response('Channel has no avatar', { status: 404 });
	}
	return fetch(channelUrlsResult.avatarUrls[0], { headers: fullRequest.headers });
});
router.get('/channel/:channelId/cover', async (request, fullRequest: Request) => {
	const { channelId } = request.params;
	if (!channelId || isNaN(Number(channelId))) {
		return new Response('Invalid channel id', { status: 400 });
	}
	const channelUrlsResult = await getChannelUrls(channelId, fullRequest.cf);
	if (channelUrlsResult instanceof Response) {
		return channelUrlsResult;
	}
	if (!channelUrlsResult.coverUrls.length) {
		return new Response('Channel has no cover', { status: 404 });
	}
	return fetch(channelUrlsResult.coverUrls[0], { headers: fullRequest.headers });
});

router.all('*', () => new Response('Not Found.', { status: 404 }));

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		return router.handle(request, request);
	},
};

async function getVideoUrls(videoId: string, cf?: CfProperties) {
	const response = await fetch('https://orion.joystream.org/graphql', {
		headers: {
			'content-type': 'application/json',
			'X-Client-Loc': `${cf?.latitude}, ${cf?.longitude}`,
		},
		body: JSON.stringify({
			query: `
				query GetVideoAssets($id: String!) {
					videos(where: {id_eq: $id}) {
						media {
							resolvedUrls
							storageBag {
								id
							}
						}
						thumbnailPhoto {
							resolvedUrls
							storageBag {
								id
							}
						}
					}
				}
			`,
			variables: {
				id: videoId,
			},
		}),
		method: 'POST',
	});
	if (!response.ok) {
		return new Response('Unexpected error', { status: 500 });
	}
	const data = (await response.json()) as any;
	const video = data.data?.videos?.[0];
	if (!video) {
		return new Response('Video not found', { status: 404 });
	}
	return {
		videoUrls: video.media?.resolvedUrls || [],
		thumbnailUrls: video.thumbnailPhoto?.resolvedUrls || [],
	};
}

async function getChannelUrls(channelId: string, cf?: CfProperties) {
	const response = await fetch('https://orion.joystream.org/graphql', {
		headers: {
			'content-type': 'application/json',
			'X-Client-Loc': `${cf?.latitude}, ${cf?.longitude}`,
		},
		body: JSON.stringify({
			query: `
				query GetChannelAssets($id: String!) {
					channels(where: {id_eq: $id}) {
						avatarPhoto {
							resolvedUrls
							storageBag {
								id
							}
						}
						coverPhoto {
							resolvedUrls
							storageBag {
								id
							}
						}
					}
				}
			`,
			variables: {
				id: channelId,
			},
		}),
		method: 'POST',
	});
	if (!response.ok) {
		return new Response('Unexpected error', { status: 500 });
	}
	const data = (await response.json()) as any;
	const channel = data.data?.channels?.[0];
	if (!channel) {
		return new Response('Channel not found', { status: 404 });
	}
	return {
		avatarUrls: channel.avatarPhoto?.resolvedUrls || [],
		coverUrls: channel.coverPhoto?.resolvedUrls || [],
	};
}
