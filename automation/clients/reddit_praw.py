import os
import praw

def _client():
    client_id=os.getenv("REDDIT_CLIENT_ID")
    client_secret=os.getenv("REDDIT_CLIENT_SECRET")
    username=os.getenv("REDDIT_USER")
    password=os.getenv("REDDIT_PASS")
    if not all([client_id, client_secret, username, password]):
        raise RuntimeError("Reddit not configured: set REDDIT_* envs")
    return praw.Reddit(
        client_id=client_id,
        client_secret=client_secret,
        username=username,
        password=password,
        user_agent="HuntazeBot/1.0",
    )

def submit_image(subreddit: str, title: str, image_path: str, nsfw: bool, body_text: str | None = None):
    reddit = _client()
    sub = reddit.subreddit(subreddit)
    submission = sub.submit_image(title=title, image_path=image_path, send_replies=False, nsfw=nsfw)
    if body_text:
        submission.reply(body_text)
    return submission.permalink

