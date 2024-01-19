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
	return fetch(videoUrlsResult.videoUrls[0], { headers: fullRequest.headers });
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
		body: `{\"query\":\"query GetVideoAssets($videoId: String!) {\\n  videos(where: {id_eq: $videoId}) {\\n    thumbnailPhoto {\\n      storageBag {\\n        id\\n      }\\n      resolvedUrls\\n    }\\n    media {\\n      storageBag {\\n        id\\n      }\\n      resolvedUrls\\n    }\\n  }\\n}\\n\",\"variables\":{\"videoId\":\"${videoId}\"},\"operationName\":\"GetVideoAssets\"}`,
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
		videoUrls: video.media.resolvedUrls,
		thumbnailUrls: video.thumbnailPhoto.resolvedUrls,
	};
}
