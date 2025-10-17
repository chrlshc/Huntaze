"""Huntaze Q1 - Multi-Platform Traffic Automation.

Agent responsible for automated Instagram, TikTok, and Reddit publishing
using best practices for OnlyFans creators.
"""

import argparse
import base64
import json
import logging
import os
import random
import sys
import tempfile
import time
import urllib.request
from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Dict, List, Optional, Tuple

from instagrapi import Client as InstaClient
from instagrapi.exceptions import LoginRequired
import praw
from praw.exceptions import RedditAPIException

# Optional official API clients (Instagram Graph, TikTok Content Posting)
try:  # Instagram Graph API
    from automation.clients.instagram_graph import publish_image as ig_graph_publish
    HAS_IG_GRAPH = True
except Exception:
    HAS_IG_GRAPH = False

try:  # TikTok Content Posting API
    from automation.clients.tiktok_api import upload_video_from_url as tt_init_upload, commit_post as tt_commit
    HAS_TT_API = True
except Exception:
    HAS_TT_API = False


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler("huntaze_automation.log"),
        logging.StreamHandler(),
    ],
)
logger = logging.getLogger("HuntazeQ1")


class Platform(Enum):
    """Supported platforms."""

    INSTAGRAM = "instagram"
    TIKTOK = "tiktok"
    REDDIT = "reddit"


class ContentType(Enum):
    """Supported content types."""

    IMAGE = "image"
    VIDEO = "video"
    STORY = "story"
    REEL = "reel"


@dataclass
class ContentItem:
    """Representation of a content item to publish."""

    file_path: str
    content_type: ContentType
    platform: Platform
    caption: Optional[str] = None
    hashtags: Optional[List[str]] = None
    scheduled_time: Optional[datetime] = None
    is_nsfw: bool = False

    def __post_init__(self) -> None:
        if self.hashtags is None:
            self.hashtags = []


@dataclass
class PostMetrics:
    """Performance metrics for a post."""

    platform: Platform
    post_id: str
    likes: int = 0
    comments: int = 0
    views: int = 0
    shares: int = 0
    engagement_rate: float = 0.0
    posted_at: Optional[datetime] = None


class CaptionGenerator:
    """Generate optimized captions per platform."""

    CTA_INSTAGRAM = [
        "DM me 'VIP' for a surprise",
        "Need to see more? Link in bio.",
        "Ready for exclusive content? Check my profile.",
        "Curious to see what is next? Link in bio.",
        "More content waiting on my profile.",
    ]

    CTA_TIKTOK = [
        "Get ready with me... link on my profile",
        "The full clip is on my profile.",
        "Want more? Profile has the link.",
        "Follow the link in my bio.",
        "Check my profile for the full version.",
    ]

    CTA_REDDIT = [
        "Discover more on my profile for VIP content.",
        "More exclusive content on my profile.",
        "Check my profile for exclusive drops.",
        "Want more? My profile has everything.",
    ]

    SAFE_HASHTAGS_IG = [
        "NewPost",
        "Exclusive",
        "Fans",
        "Creator",
        "ContentCreator",
        "Model",
        "Photography",
        "Lifestyle",
        "Motivation",
        "Inspire",
        "Beautiful",
        "Aesthetic",
        "Vibes",
        "Goals",
    ]

    SAFE_HASHTAGS_TIKTOK = [
        "fyp",
        "foryou",
        "viral",
        "trending",
        "creator",
        "lifestyle",
        "aesthetic",
        "vibes",
        "motivation",
    ]

    @classmethod
    def generate(cls, platform: Platform, tags: Optional[List[str]] = None) -> str:
        """Return a caption that respects each platform policy."""

        if platform == Platform.INSTAGRAM:
            base = random.choice(cls.CTA_INSTAGRAM)
            source_tags = tags or cls.SAFE_HASHTAGS_IG
            safe_tags = [tag for tag in source_tags if "onlyfans" not in tag.lower()][:8]
            if safe_tags:
                base += "\n\n" + " ".join(f"#{tag}" for tag in safe_tags)
            return base

        if platform == Platform.TIKTOK:
            base = random.choice(cls.CTA_TIKTOK)
            source_tags = tags or cls.SAFE_HASHTAGS_TIKTOK
            safe_tags = [tag for tag in source_tags if "onlyfans" not in tag.lower()][:5]
            if safe_tags:
                base += " " + " ".join(f"#{tag}" for tag in safe_tags)
            return base

        return random.choice(cls.CTA_REDDIT)


class ContentValidator:
    """Ensure content respects each platform guidelines."""

    @staticmethod
    def validate_for_instagram(content: ContentItem) -> Tuple[bool, str]:
        if content.is_nsfw:
            return False, "Instagram forbids explicit NSFW content"
        if content.content_type == ContentType.VIDEO:
            return True, "Ensure the video is shorter than 60 seconds"
        return True, "OK"

    @staticmethod
    def validate_for_tiktok(content: ContentItem) -> Tuple[bool, str]:
        if content.is_nsfw:
            return False, "TikTok forbids adult content"
        if content.content_type != ContentType.VIDEO:
            return False, "TikTok accepts videos only"
        return True, "OK - stay suggestive, not explicit"

    @staticmethod
    def validate_for_reddit(content: ContentItem) -> Tuple[bool, str]:
        return True, "OK - mark NSFW if required"


def load_config_from_env() -> Dict[str, Dict[str, str]]:
    """Load platform credentials from environment variables."""

    config: Dict[str, Dict[str, str]] = {}

    ig_username = os.getenv("IG_USERNAME")
    ig_password = os.getenv("IG_PASSWORD")
    if ig_username and ig_password:
        config["instagram"] = {"username": ig_username, "password": ig_password}

    tiktok_cookies = os.getenv("TIKTOK_COOKIES")
    if tiktok_cookies:
        config["tiktok"] = {"cookies_file": tiktok_cookies}

    reddit_client = os.getenv("REDDIT_CLIENT_ID")
    reddit_secret = os.getenv("REDDIT_CLIENT_SECRET")
    reddit_user = os.getenv("REDDIT_USER")
    reddit_pass = os.getenv("REDDIT_PASS")
    if reddit_client and reddit_secret and reddit_user and reddit_pass:
        config["reddit"] = {
            "client_id": reddit_client,
            "client_secret": reddit_secret,
            "username": reddit_user,
            "password": reddit_pass,
        }

    return config


def ensure_platform_config(platform: Platform, config: Dict[str, Dict[str, str]]) -> None:
    if platform.value not in config:
        raise ValueError(f"missing credentials for platform: {platform.value}")


def guess_content_type(url_or_path: str, platform: Platform) -> ContentType:
    lowered = url_or_path.lower()
    if lowered.endswith(".mp4") or lowered.endswith(".mov"):
        if platform == Platform.REDDIT:
            return ContentType.IMAGE
        return ContentType.VIDEO
    if platform == Platform.TIKTOK:
        return ContentType.VIDEO
    return ContentType.IMAGE


def download_media(url: str) -> Tuple[str, bool]:
    """Download remote media and return local path and flag indicating temp file."""

    if os.path.exists(url):
        return url, False

    suffix = os.path.splitext(url.split("?")[0])[1] or ""
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp_file:
        with urllib.request.urlopen(url) as response:  # nosec B310
            tmp_file.write(response.read())
        return tmp_file.name, True

class InstagramPublisher:
    """Handle Instagram publishing using instagrapi."""

    def __init__(self, username: str, password: str):
        self.username = username
        self.session_file = f"ig_session_{username}.json"
        self.client = InstaClient()
        self._login(password)

    def _login(self, password: str) -> None:
        try:
            if os.path.exists(self.session_file):
                self.client.load_settings(self.session_file)
                self.client.login(self.username, password)
                logger.info("Instagram session restored for %s", self.username)
            else:
                self.client.login(self.username, password)
                self.client.dump_settings(self.session_file)
                logger.info("Instagram session created for %s", self.username)
        except LoginRequired as exc:
            logger.error("Instagram login required: %s", exc)
            raise
        except Exception as exc:  # pragma: no cover
            logger.error("Instagram login failure: %s", exc)
            raise

    def post_photo(self, content: ContentItem) -> Optional[str]:
        try:
            valid, message = ContentValidator.validate_for_instagram(content)
            if not valid:
                logger.warning("Instagram validation failed: %s", message)
                return None

            caption = content.caption or CaptionGenerator.generate(
                Platform.INSTAGRAM, content.hashtags
            )
            media = self.client.photo_upload(content.file_path, caption)
            logger.info("Instagram photo published: %s", media.pk)
            return media.pk
        except Exception as exc:  # pragma: no cover
            logger.error("Instagram photo publish failed: %s", exc)
            return None

    def post_story(self, content: ContentItem) -> Optional[str]:
        try:
            media = self.client.photo_upload_to_story(content.file_path)
            logger.info("Instagram story published: %s", media.pk)
            return media.pk
        except Exception as exc:  # pragma: no cover
            logger.error("Instagram story publish failed: %s", exc)
            return None

    def post_reel(self, content: ContentItem) -> Optional[str]:
        try:
            caption = content.caption or CaptionGenerator.generate(
                Platform.INSTAGRAM, content.hashtags
            )
            media = self.client.clip_upload(content.file_path, caption)
            logger.info("Instagram reel published: %s", media.pk)
            return media.pk
        except Exception as exc:  # pragma: no cover
            logger.error("Instagram reel publish failed: %s", exc)
            return None

    def get_metrics(self, post_id: str) -> Optional[PostMetrics]:
        try:
            media_info = self.client.media_info(post_id)
            return PostMetrics(
                platform=Platform.INSTAGRAM,
                post_id=post_id,
                likes=media_info.like_count,
                comments=media_info.comment_count,
                views=media_info.view_count or 0,
                posted_at=media_info.taken_at,
            )
        except Exception as exc:  # pragma: no cover
            logger.error("Instagram metrics fetch failed: %s", exc)
            return None


class TikTokPublisher:
    """Handle TikTok publishing via tiktok-uploader."""

    def __init__(self, cookies_file: str):
        self.cookies_file = cookies_file
        try:
            from tiktok_uploader.upload import upload_video  # type: ignore

            self.upload_func = upload_video
            logger.info("TikTok uploader module available")
        except ImportError:
            logger.warning(
                "TikTok uploader module missing. Install via 'pip install tiktok-uploader'"
            )
            self.upload_func = None

    def post_video(self, content: ContentItem) -> Optional[str]:
        if not self.upload_func:
            logger.error("TikTok uploader not configured")
            return None

        try:
            valid, message = ContentValidator.validate_for_tiktok(content)
            if not valid:
                logger.warning("TikTok validation failed: %s", message)
                return None

            caption = content.caption or CaptionGenerator.generate(
                Platform.TIKTOK, content.hashtags
            )
            result = self.upload_func(
                content.file_path,
                description=caption,
                cookies=self.cookies_file,
            )
            if isinstance(result, dict):
                video_id = result.get("video_id", "unknown")
            else:
                video_id = "unknown"
            logger.info("TikTok video published: %s", video_id)
            return video_id
        except Exception as exc:  # pragma: no cover
            logger.error("TikTok publish failed: %s", exc)
            return None


class RedditPublisher:
    """Handle Reddit publishing using praw."""

    def __init__(self, client_id: str, client_secret: str, username: str, password: str):
        self.reddit = praw.Reddit(
            client_id=client_id,
            client_secret=client_secret,
            username=username,
            password=password,
            user_agent="HuntazeBot/1.0",
        )
        logger.info("Reddit authenticated as %s", self.reddit.user.me())

    def post_image(self, content: ContentItem, subreddit_name: str, title: str) -> Optional[str]:
        try:
            valid, message = ContentValidator.validate_for_reddit(content)
            if not valid:
                logger.warning("Reddit validation failed: %s", message)
                return None

            subreddit = self.reddit.subreddit(subreddit_name)
            submission = subreddit.submit_image(title=title, image_path=content.file_path)
            if content.is_nsfw:
                submission.mod.nsfw()
                logger.info("Reddit post flagged NSFW")
            logger.info("Reddit image published: %s", submission.id)
            return submission.id
        except RedditAPIException as exc:
            logger.error("Reddit API error: %s", exc)
            return None
        except Exception as exc:  # pragma: no cover
            logger.error("Reddit publish failed: %s", exc)
            return None

    def post_text(
        self, subreddit_name: str, title: str, text: str, is_nsfw: bool = False
    ) -> Optional[str]:
        try:
            subreddit = self.reddit.subreddit(subreddit_name)
            submission = subreddit.submit(title=title, selftext=text)
            if is_nsfw:
                submission.mod.nsfw()
            logger.info("Reddit text post published: %s", submission.id)
            return submission.id
        except Exception as exc:  # pragma: no cover
            logger.error("Reddit text publish failed: %s", exc)
            return None

    def get_metrics(self, post_id: str) -> Optional[PostMetrics]:
        try:
            submission = self.reddit.submission(id=post_id)
            return PostMetrics(
                platform=Platform.REDDIT,
                post_id=post_id,
                likes=submission.score,
                comments=submission.num_comments,
                posted_at=datetime.fromtimestamp(submission.created_utc),
            )
        except Exception as exc:  # pragma: no cover
            logger.error("Reddit metrics fetch failed: %s", exc)
            return None


class MultiPlatformOrchestrator:
    """Central orchestrator coordinating all platform publishers."""

    def __init__(self, config: Dict[str, Dict[str, str]]):
        self.config = config
        self.publishers: Dict[Platform, object] = {}
        self.metrics_db: List[PostMetrics] = []
        self._init_publishers()

    def _init_publishers(self) -> None:
        if "instagram" in self.config:
            try:
                self.publishers[Platform.INSTAGRAM] = InstagramPublisher(
                    self.config["instagram"]["username"],
                    self.config["instagram"]["password"],
                )
            except Exception as exc:  # pragma: no cover
                logger.error("Instagram init failed: %s", exc)

        if "tiktok" in self.config:
            try:
                self.publishers[Platform.TIKTOK] = TikTokPublisher(
                    self.config["tiktok"]["cookies_file"],
                )
            except Exception as exc:  # pragma: no cover
                logger.error("TikTok init failed: %s", exc)

        if "reddit" in self.config:
            try:
                self.publishers[Platform.REDDIT] = RedditPublisher(
                    self.config["reddit"]["client_id"],
                    self.config["reddit"]["client_secret"],
                    self.config["reddit"]["username"],
                    self.config["reddit"]["password"],
                )
            except Exception as exc:  # pragma: no cover
                logger.error("Reddit init failed: %s", exc)

    def publish(self, content: ContentItem, **kwargs) -> Optional[str]:
        publisher = self.publishers.get(content.platform)
        if not publisher:
            logger.error("Publisher not available for %s", content.platform.value)
            return None

        try:
            if content.platform == Platform.INSTAGRAM:
                if content.content_type == ContentType.IMAGE:
                    # Prefer Graph API if configured and remote URL available
                    remote_url = kwargs.get("remote_url")
                    use_graph = os.getenv("IG_USE_GRAPH", "").lower() in ("1", "true", "yes") or bool(os.getenv("META_PAGE_ACCESS_TOKEN"))
                    if HAS_IG_GRAPH and use_graph and remote_url and remote_url.startswith("http"):
                        caption = content.caption or CaptionGenerator.generate(Platform.INSTAGRAM, content.hashtags)
                        try:
                            res = ig_graph_publish(remote_url, caption)
                            return str(res.get("id") or res)
                        except Exception as exc:
                            logger.warning("Instagram Graph publish failed, falling back: %s", exc)
                    return publisher.post_photo(content)
                if content.content_type == ContentType.STORY:
                    return publisher.post_story(content)
                if content.content_type == ContentType.REEL:
                    return publisher.post_reel(content)

            if content.platform == Platform.TIKTOK:
                # Prefer TikTok official API if configured and remote URL available
                remote_url = kwargs.get("remote_url")
                use_tt = os.getenv("USE_TT_API", "").lower() in ("1", "true", "yes") or bool(os.getenv("TT_ACCESS_TOKEN"))
                if HAS_TT_API and use_tt and remote_url and remote_url.startswith("http") and content.content_type == ContentType.VIDEO:
                    caption = content.caption or CaptionGenerator.generate(Platform.TIKTOK, content.hashtags)
                    try:
                        upload_id = tt_init_upload(remote_url)
                        res = tt_commit(upload_id, caption)
                        data = res.get("data") if isinstance(res, dict) else None
                        vid = (data or {}).get("video_id") if isinstance(data, dict) else None
                        return str(vid or upload_id)
                    except Exception as exc:
                        logger.warning("TikTok API publish failed, falling back: %s", exc)
                return publisher.post_video(content)

            if content.platform == Platform.REDDIT:
                subreddit = kwargs.get("subreddit", "OnlyFansPromo")
                title = kwargs.get(
                    "title",
                    "Sneak peek of my exclusive content",
                )
                return publisher.post_image(content, subreddit, title)

            logger.error("Unsupported content type %s", content.content_type.value)
            return None
        finally:
            time.sleep(random.uniform(2, 5))

    def publish_multi(
        self, contents: List[ContentItem], delay_between: int = 300
    ) -> Dict[Platform, str]:
        results: Dict[Platform, str] = {}
        for item in contents:
            post_id = self.publish(item)
            if post_id:
                results[item.platform] = post_id
                if delay_between:
                    time.sleep(delay_between)
        return results

    def get_all_metrics(self, post_ids: Dict[Platform, str]) -> List[PostMetrics]:
        metrics: List[PostMetrics] = []
        for platform, post_id in post_ids.items():
            publisher = self.publishers.get(platform)
            if publisher and hasattr(publisher, "get_metrics"):
                metric = publisher.get_metrics(post_id)  # type: ignore[attr-defined]
                if metric:
                    metrics.append(metric)
                    self.metrics_db.append(metric)
        return metrics

    @staticmethod
    def get_best_posting_times(platform: Platform) -> List[int]:
        optimal_times = {
            Platform.INSTAGRAM: [19, 20, 21, 22],
            Platform.TIKTOK: [18, 19, 20, 21, 22, 23],
            Platform.REDDIT: [20, 21, 22, 23],
        }
        return optimal_times.get(platform, [20, 21])


class ContentScheduler:
    """Schedule content at optimal times."""

    def __init__(self, orchestrator: MultiPlatformOrchestrator):
        self.orchestrator = orchestrator
        self.schedule: List[Tuple[datetime, ContentItem, Dict[str, str]]] = []

    def add_to_schedule(
        self, content: ContentItem, scheduled_time: Optional[datetime] = None, **kwargs
    ) -> None:
        if not scheduled_time:
            best_hours = self.orchestrator.get_best_posting_times(content.platform)
            scheduled_time = self._next_optimal_time(best_hours)
        self.schedule.append((scheduled_time, content, kwargs))
        self.schedule.sort(key=lambda item: item[0])
        logger.info(
            "Scheduled post for %s at %s",
            content.platform.value,
            scheduled_time.isoformat(),
        )

    def _next_optimal_time(self, hours: List[int]) -> datetime:
        now = datetime.now()
        for hour in hours:
            target = now.replace(hour=hour, minute=0, second=0, microsecond=0)
            if target > now:
                return target
        return (now + timedelta(days=1)).replace(
            hour=hours[0], minute=0, second=0, microsecond=0
        )

    def execute_pending(self) -> int:
        now = datetime.now()
        executed: List[Tuple[datetime, ContentItem, Dict[str, str]]] = []
        for scheduled_time, content, kwargs in self.schedule:
            if scheduled_time <= now:
                logger.info("Publishing scheduled content for %s", content.platform.value)
                self.orchestrator.publish(content, **kwargs)
                executed.append((scheduled_time, content, kwargs))
        for item in executed:
            self.schedule.remove(item)
        return len(executed)

    def get_schedule_summary(self) -> str:
        summary = f"Planning: {len(self.schedule)} upcoming publications\n\n"
        for scheduled_time, content, _ in self.schedule[:5]:
            summary += (
                f"- {scheduled_time.strftime('%d/%m %Hh%M')}"
                f" | {content.platform.value} | {content.content_type.value}\n"
            )
        return summary


def run_publish_job(job: Dict[str, Any]) -> Dict[str, Any]:
    """Execute a publish job produced by the queue layer."""

    if "platform" not in job:
        raise ValueError("job missing 'platform'")

    platform = Platform(job["platform"])
    config = job.get("config") or load_config_from_env()
    ensure_platform_config(platform, config)

    orchestrator = MultiPlatformOrchestrator(config)

    content_payload = job.get("content") or {}
    media_urls: List[str] = content_payload.get("mediaUrls") or job.get("mediaUrls") or []
    if not media_urls:
        raise ValueError("job missing mediaUrls")

    requested_type = (content_payload.get("contentType") or job.get("contentType") or "").upper()
    if requested_type in ContentType.__members__:
        content_type = ContentType[requested_type]
    else:
        content_type = guess_content_type(media_urls[0], platform)

    local_path, is_temp = download_media(media_urls[0])
    cleanup_paths = [local_path] if is_temp else []

    caption = (
        job.get("caption")
        or content_payload.get("caption")
        or content_payload.get("description")
        or job.get("description")
    )
    hashtags: List[str] = (
        job.get("tags")
        or content_payload.get("tags")
        or []
    )
    is_nsfw = bool(job.get("isNsfw") or content_payload.get("isNsfw"))

    content_item = ContentItem(
        file_path=local_path,
        content_type=content_type,
        platform=platform,
        caption=caption,
        hashtags=hashtags,
        is_nsfw=is_nsfw,
    )

    publish_kwargs: Dict[str, Any] = {}
    # Provide remote URL for official APIs where applicable
    try:
        if media_urls and media_urls[0].startswith("http"):
            publish_kwargs["remote_url"] = media_urls[0]
    except Exception:
        pass
    if platform == Platform.REDDIT:
        publish_kwargs["subreddit"] = (
            job.get("subreddit")
            or job.get("options", {}).get("subreddit")
            or "OnlyFansPromo"
        )
        publish_kwargs["title"] = (
            job.get("title")
            or content_payload.get("title")
            or "Exclusive content preview"
        )

    try:
        post_id = orchestrator.publish(content_item, **publish_kwargs)
    finally:
        for path in cleanup_paths:
            try:
                os.unlink(path)
            except OSError:
                pass

    if not post_id:
        raise RuntimeError(f"publishing failed for platform {platform.value}")

    return {
        "ok": True,
        "platform": platform.value,
        "postId": post_id,
        "contentId": job.get("contentId"),
    }


def sample_usage() -> None:
    config = load_config_from_env()

    orchestrator = MultiPlatformOrchestrator(config)
    scheduler = ContentScheduler(orchestrator)

    ig_post = ContentItem(
        file_path="media/post1.jpg",
        content_type=ContentType.IMAGE,
        platform=Platform.INSTAGRAM,
        hashtags=["NewPost", "Exclusive", "Creator"],
        is_nsfw=False,
    )

    tiktok_clip = ContentItem(
        file_path="media/teaser1.mp4",
        content_type=ContentType.VIDEO,
        platform=Platform.TIKTOK,
        is_nsfw=False,
    )

    reddit_post = ContentItem(
        file_path="media/preview1.jpg",
        content_type=ContentType.IMAGE,
        platform=Platform.REDDIT,
        is_nsfw=True,
    )

    scheduler.add_to_schedule(ig_post)
    scheduler.add_to_schedule(
        reddit_post,
        subreddit="OnlyFansPromo",
        title="Sneak peek of my exclusive content",
    )

    logger.info("\n%s", scheduler.get_schedule_summary())

    post_id = orchestrator.publish(ig_post)
    if post_id:
        logger.info("Instagram post published: %s", post_id)
        time.sleep(10)
        metrics = orchestrator.get_all_metrics({Platform.INSTAGRAM: post_id})
        if metrics:
            metric = metrics[0]
            logger.info(
                "Instagram metrics: %s likes, %s comments",
                metric.likes,
                metric.comments,
            )


def main() -> None:
    parser = argparse.ArgumentParser(description="Run Huntaze traffic automation job")
    parser.add_argument("--job-json", help="Raw JSON payload for a job")
    parser.add_argument("--job-b64", help="Base64 encoded JSON payload")
    parser.add_argument("--sample", action="store_true", help="Run built-in sample flow")
    args = parser.parse_args()

    if args.sample or (not args.job_json and not args.job_b64):
        sample_usage()
        return

    if args.job_json:
        job_payload = json.loads(args.job_json)
    else:
        decoded = base64.b64decode(args.job_b64).decode("utf-8")
        job_payload = json.loads(decoded)

    try:
        result = run_publish_job(job_payload)
        if "ok" not in result:
            result["ok"] = True
        print(json.dumps(result))
    except Exception as exc:  # pragma: no cover
        logger.exception("Automation job failed")
        print(json.dumps({"ok": False, "error": str(exc)}))
        sys.exit(1)


if __name__ == "__main__":
    main()
